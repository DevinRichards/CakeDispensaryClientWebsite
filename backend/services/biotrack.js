/**
 * Biotrack / NM Trace integration service.
 *
 * - Live storefront menu is powered by NM Trace sync_inventory.
 * - Recent sync_sale data is used as a temporary price signal.
 * - Reservation confirmation is wired to the documented pickup order API.
 */

const path = require('path')
const fs = require('fs')
const { dataPath } = require('../utils/dataPath')

const TRACE_API_URL = normalizeLegacyApiUrl(process.env.BIOTRACK_API_URL || 'https://mcp-tracking.nmhealth.org/serverjson.asp')
const ORDER_API_BASE = (process.env.BIOTRACK_ORDER_API_URL || 'https://api.nm.trace.biotrackthc.net').replace(/\/+$/, '')
const LICENSE_NUMBER = process.env.BIOTRACK_LICENSE_NUMBER || ''
const FACILITY_KEY = process.env.BIOTRACK_FACILITY_KEY || ''
const USERNAME = process.env.BIOTRACK_USERNAME || ''
const PASSWORD = process.env.BIOTRACK_PASSWORD || ''
const ORDER_LOCATION = process.env.BIOTRACK_ORDER_LOCATION || null
const MENU_OVERRIDES_FILE = dataPath('menu-overrides.json')
const UNMATCHED_PRICING_FILE = dataPath('unmatched-pricing-items.json')
const PRICING_SOURCE_FILE = process.env.BIOTRACK_PRICE_SOURCE_FILE
  ? path.resolve(process.env.BIOTRACK_PRICE_SOURCE_FILE)
  : dataPath('products-pricing-source.csv')

const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000
const SALES_LOOKBACK_TXNS = 2_000_000

const INVENTORY_CATEGORY_MAP = {
  12: 'flower',
  13: 'flower',
  15: 'concentrates',
  17: 'concentrates',
  19: 'concentrates',
  22: 'edibles',
  23: 'edibles',
  24: 'vapes',
  25: 'topicals',
  27: 'flower',
  28: 'prerolls',
  30: 'flower',
  31: 'prerolls',
  32: 'prerolls',
}

const MISSING_CONFIG_VARS = [
  'BIOTRACK_LICENSE_NUMBER',
  'BIOTRACK_USERNAME',
  'BIOTRACK_PASSWORD',
]

let _traceSessionId = null
let _traceSessionExp = 0
let _orderSessionId = null
let _orderSessionExp = 0
let _productCache = {
  at: 0,
  products: null,
  priceCoverage: 0,
  spreadsheetPriceCoverage: 0,
  location: null,
}

function normalizeLegacyApiUrl(value) {
  if (!value) return 'https://mcp-tracking.nmhealth.org/serverjson.asp'
  return /serverjson\.asp$/i.test(value) ? value : value.replace(/\/+$/, '') + '/serverjson.asp'
}

const isConfigured = () => !!(LICENSE_NUMBER && USERNAME && PASSWORD)

async function callTraceApi(payload) {
  const res = await fetch(TRACE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      API: '4.0',
      ...payload,
    }),
  })

  const text = await res.text()
  let data

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  if (!res.ok) throw new Error(`Biotrack request failed: ${res.status}`)
  if (data && Number(data.success) === 0) throw new Error(data.error || 'Biotrack rejected the request')

  return data
}

async function callOrderApi(method, route, { body, headers } = {}) {
  const res = await fetch(`${ORDER_API_BASE}${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    throw new Error(data.error || data.code || `Order API request failed: ${res.status}`)
  }

  return data
}

function extractSessionId(data) {
  return data.sessionid || data.session_id || data.session || data.token || null
}

async function getTraceSessionId() {
  if (_traceSessionId && Date.now() < _traceSessionExp) return _traceSessionId

  const data = await callTraceApi({
    action: 'login',
    username: USERNAME,
    password: PASSWORD,
    license_number: LICENSE_NUMBER,
  })

  const sessionId = extractSessionId(data)
  if (!sessionId) throw new Error('Biotrack login succeeded but no session identifier was returned')

  _traceSessionId = sessionId
  _traceSessionExp = Date.now() + 55 * 60 * 1000
  return _traceSessionId
}

async function getOrderSessionId() {
  if (_orderSessionId && Date.now() < _orderSessionExp) return _orderSessionId

  const data = await callOrderApi('POST', '/v1/login', {
    body: {
      username: USERNAME,
      password: PASSWORD,
      license: LICENSE_NUMBER,
    },
  })

  const sessionId = extractSessionId(data)
  if (!sessionId) throw new Error('Order API login succeeded but no session identifier was returned')

  _orderSessionId = sessionId
  _orderSessionExp = Date.now() + 55 * 60 * 1000
  return _orderSessionId
}

async function getProducts(categoryFilter = null) {
  const all = await getAllProductsForAdmin()
  let products = all.filter(isPublicMenuProduct)
  if (categoryFilter && categoryFilter !== 'all') {
    products = products.filter((p) => p.category === categoryFilter)
  }
  return products
}

async function getAllProductsForAdmin(categoryFilter = null) {
  if (!isConfigured()) {
    console.log('[Biotrack] Not configured — using local products.json')
    return applyDisplayPricing(getLocalProducts(categoryFilter))
  }

  try {
    const all = await getLiveProducts()
    let products = all
    if (categoryFilter && categoryFilter !== 'all') {
      products = products.filter((p) => p.category === categoryFilter)
    }
    return products
  } catch (err) {
    console.error('[Biotrack] Live inventory sync failed, falling back to local data:', err.message)
    return applyDisplayPricing(getLocalProducts(categoryFilter))
  }
}

async function getProductById(productId) {
  const all = await getProducts()
  return all.find((p) => p.id === productId) || null
}

async function createReservationOrder(reservation) {
  if (!isConfigured()) {
    console.log('[Biotrack] Not configured — skipping reservation sync')
    return null
  }

  try {
    const sessionId = await getOrderSessionId()
    const items = buildPickupItems(reservation.items)
    const location = resolveOrderLocation(reservation.items)

    if (!location) {
      throw new Error('Unable to determine pickup order location from live menu data')
    }

    if (items.length === 0) {
      throw new Error('No pickup-ready items were found on the reservation')
    }

    const payload = {
      training: false,
      location,
      txn_type: 'RECREATIONAL',
      pickup_time: formatPickupDateTime(reservation.pickupDate, reservation.pickupTime),
      external_id: reservation.id,
      items,
    }

    const data = await callOrderApi('POST', '/v2/pickups/', {
      headers: { 'x-api-key': sessionId },
      body: payload,
    })

    console.log(`[Biotrack] Pickup order created for reservation ${reservation.id}: ${data.id}`)
    return String(data.id || data.transactionid || data.ticket_id || '')
  } catch (err) {
    console.error('[Biotrack] createReservationOrder failed:', err.message)
    return null
  }
}

async function updateOrderState(biotrackOrderId, state) {
  if (!isConfigured() || !biotrackOrderId) return false

  try {
    const sessionId = await getOrderSessionId()

    if (state === 'cancelled') {
      await callOrderApi('POST', `/v1/pickups/${biotrackOrderId}/void`, {
        headers: { 'x-api-key': sessionId },
        body: { training: false },
      })
      return true
    }

    if (state === 'completed') {
      await callOrderApi('POST', `/v1/pickups/${biotrackOrderId}/complete`, {
        headers: { 'x-api-key': sessionId },
        body: { training: false },
      })
      return true
    }

    return true
  } catch (err) {
    console.error('[Biotrack] updateOrderState failed:', err.message)
    return false
  }
}

async function updateOrderItems(biotrackOrderId, items, substitutions = []) {
  if (!isConfigured() || !biotrackOrderId) return false
  if (!substitutions.length) return true

  console.warn(`[Biotrack] updateOrderItems is not implemented yet for pickup API order ${biotrackOrderId}. Manual review required.`)
  return false
}

async function getConnectionStatus() {
  if (!isConfigured()) {
    const missing = MISSING_CONFIG_VARS.filter((name) => !process.env[name])
    return {
      connected: false,
      configured: false,
      licenseNumber: LICENSE_NUMBER || null,
      facilityKey: FACILITY_KEY || null,
      inventoryMode: 'local',
      message: `Biotrack credentials not set in .env. Missing: ${missing.join(', ')}`,
    }
  }

  try {
    await Promise.all([getTraceSessionId(), getOrderSessionId()])
    const products = await getLiveProducts()
    return {
      connected: true,
      configured: true,
      licenseNumber: LICENSE_NUMBER,
      facilityKey: FACILITY_KEY || null,
      inventoryMode: 'live',
      orderApi: 'ready',
      productCount: products.length,
      message: `Connected to NM Trace and pickup API. Live inventory is powering stock (${products.length} products). Spreadsheet price coverage: ${_productCache.spreadsheetPriceCoverage}%. Total menu price coverage: ${_productCache.priceCoverage}%.`,
    }
  } catch (err) {
    return {
      connected: false,
      configured: true,
      licenseNumber: LICENSE_NUMBER,
      facilityKey: FACILITY_KEY || null,
      inventoryMode: 'local',
      message: `Connection failed: ${err.message}`,
    }
  }
}

async function getLiveProducts() {
  if (_productCache.products && Date.now() - _productCache.at < PRODUCT_CACHE_TTL_MS) {
    return _productCache.products
  }

  const sessionId = await getTraceSessionId()
  const inventory = await fetchInventory(sessionId)
  const salesPriceMap = await fetchRecentSalesPriceMap(sessionId, inventory)
  const spreadsheetPricing = loadSpreadsheetPricing()
  const products = mapInventoryToProducts(inventory, salesPriceMap, spreadsheetPricing)
  const enrichedProducts = applyDisplayPricing(applyMenuOverrides(products))
  writeUnmatchedPricingItems(enrichedProducts)

  const pricedCount = enrichedProducts.filter((product) => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.some((variant) => variant.price != null)
    }
    return product.price != null
  }).length

  _productCache = {
    at: Date.now(),
    products: enrichedProducts,
    priceCoverage: enrichedProducts.length ? Math.round((pricedCount / enrichedProducts.length) * 100) : 0,
    spreadsheetPriceCoverage: enrichedProducts.length
      ? Math.round((enrichedProducts.filter(productHasSpreadsheetPrice).length / enrichedProducts.length) * 100)
      : 0,
    location: enrichedProducts.find((product) => product.biotrackLocation)?.biotrackLocation || null,
  }

  return enrichedProducts
}

async function fetchInventory(sessionId) {
  const data = await callTraceApi({
    action: 'sync_inventory',
    sessionid: sessionId,
    active: 1,
  })

  const inventory = Array.isArray(data.inventory)
    ? data.inventory
    : data.inventory
      ? [data.inventory]
      : []

  return inventory.filter((item) => !Number(item.deleted))
}

async function fetchRecentSalesPriceMap(sessionId, inventory) {
  const recentStart = estimateSalesTransactionStart(inventory)
  const data = await callTraceApi({
    action: 'sync_sale',
    sessionid: sessionId,
    transaction_start: recentStart,
    active: 1,
  })

  const sales = Array.isArray(data.sale)
    ? data.sale
    : data.sale
      ? [data.sale]
      : []

  const activeIds = new Set(inventory.map((item) => String(item.id)))
  const priceMap = new Map()

  for (const sale of sales) {
    if (Number(sale.deleted) || Number(sale.refunded)) continue
    const inventoryId = String(sale.inventoryid || '')
    if (!activeIds.has(inventoryId)) continue

    const quantity = parseFloat(sale.quantity || '0') || 0
    const totalPrice = parseFloat(sale.price || '0')
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) continue

    const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice
    const next = {
      price: roundCurrency(unitPrice),
      sessiontime: Number(sale.sessiontime || 0),
    }

    const prev = priceMap.get(inventoryId)
    if (!prev || next.sessiontime >= prev.sessiontime) {
      priceMap.set(inventoryId, next)
    }
  }

  return priceMap
}

function estimateSalesTransactionStart(inventory) {
  let maxTransactionId = 0
  for (const item of inventory) {
    const current = Number(item.transactionid || 0)
    const original = Number(item.transactionid_original || 0)
    maxTransactionId = Math.max(maxTransactionId, current, original)
  }
  return Math.max(0, maxTransactionId - SALES_LOOKBACK_TXNS)
}

function loadSpreadsheetPricing() {
  if (!fs.existsSync(PRICING_SOURCE_FILE)) return createEmptyPricingCatalog()

  try {
    return parseSpreadsheetPricingText(fs.readFileSync(PRICING_SOURCE_FILE, 'utf8'))
  } catch (err) {
    console.error('[Biotrack] Failed to load spreadsheet pricing:', err.message)
    return createEmptyPricingCatalog()
  }
}

function parseSpreadsheetPricingText(text) {
  const rows = parseCsv(text)
  const header = rows.shift()?.map((cell) => normalizeHeader(cell)) || []
  const entriesByKey = new Map()
  let currentProduct = ''

  for (const row of rows) {
    const record = Object.fromEntries(header.map((column, index) => [column, row[index] || '']))
    const productName = String(record.product || record.product_name || record.item || record.name || '').trim()
    if (productName) currentProduct = productName
    if (!currentProduct) continue

    const medicalPrice = parseCurrency(
      record.medical_price ||
      record.med_price ||
      record.price_med ||
      record.medical ||
      record.med ||
      record.price
    )
    const recreationalPrice = parseCurrency(
      record.recreational_price ||
      record.nonmedical_price ||
      record.non_medical_price ||
      record.rec_price ||
      record.price_rec ||
      record.price_post_tax ||
      record.price_posttax ||
      record.price_posttax_rec ||
      record.price_post_tax_rec ||
      record.price_nonmedical ||
      record.price_non_medical
    ) ?? medicalPrice
    const price = recreationalPrice ?? medicalPrice
    if (price == null) continue

    const quantity = String(record.quantity || record.size || record.weight || '').trim()
    const productGrams = extractProductPackageGrams(currentProduct)
    const purchaseQuantity = parseQuantityGrams(quantity)
    if (productGrams != null && purchaseQuantity != null && purchaseQuantity !== 1) continue

    const entry = {
      productName: currentProduct,
      quantity,
      grams: productGrams ?? purchaseQuantity,
      price,
      medicalPrice,
      recreationalPrice,
    }

    for (const key of getPricingKeys(currentProduct)) {
      if (!entriesByKey.has(key)) entriesByKey.set(key, [])
      entriesByKey.get(key).push(entry)
    }
  }

  return {
    entriesByKey,
    rowCount: rows.length,
    priceCount: [...entriesByKey.values()].reduce((sum, entries) => sum + entries.length, 0),
    findEntries(values) {
      for (const value of values.filter(Boolean)) {
        for (const key of getPricingKeys(value)) {
          const entries = entriesByKey.get(key)
          if (entries?.length) return entries
        }
      }
      return []
    },
  }
}

function createEmptyPricingCatalog() {
  return {
    entriesByKey: new Map(),
    findEntries: () => [],
  }
}

function findSpreadsheetPrice(entries, size) {
  if (!entries || entries.length === 0) return null

  const grams = parseGrams(size)
  if (Number.isFinite(grams)) {
    const exact = entries.find((entry) => entry.grams != null && Math.abs(entry.grams - grams) < 0.001)
    if (exact) return exact
  }

  const oneUnit = entries.find((entry) => entry.grams === 1 || /^1(?:\.0+)?(?:\s*g)?$/i.test(entry.quantity))
  return oneUnit || entries[0]
}

function pricesFromSpreadsheetEntry(entry) {
  if (!entry) return null
  const medicalPrice = entry.medicalPrice ?? entry.price ?? null
  const recreationalPrice = entry.recreationalPrice ?? entry.price ?? medicalPrice
  return {
    price: recreationalPrice ?? medicalPrice,
    medicalPrice,
    recreationalPrice,
  }
}

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      value += '"'
      index += 1
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      row.push(value)
      value = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1
      row.push(value)
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)
      row = []
      value = ''
    } else {
      value += char
    }
  }

  if (value || row.length) {
    row.push(value)
    if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)
  }

  return rows
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function parseCurrency(value) {
  const parsed = Number(String(value || '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) && parsed >= 0 ? roundCurrency(parsed) : null
}

function parseQuantityGrams(value) {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function extractProductPackageGrams(value) {
  const matches = [...String(value || '').matchAll(/(\d+(?:\.\d+)?)\s*g(?:ram|rams)?\b/gi)]
  if (matches.length === 0) return null
  const parsed = Number(matches[matches.length - 1][1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function getPricingKeys(value) {
  const normalized = normalizePricingName(value)
  const keys = new Set([normalized])
  const beforeVendor = normalized.split(/\s+-\s+/)[0]?.trim()
  if (beforeVendor) keys.add(beforeVendor)
  const withoutVendorSuffix = normalized.replace(/\s+(llc|inc|ltd|manu|manufacturing|americas pkwy).*$/i, '').trim()
  if (withoutVendorSuffix) keys.add(withoutVendorSuffix)
  return [...keys].filter(Boolean)
}

function normalizePricingName(value) {
  return normalizeLiveProductName(value)
    .toLowerCase()
    .replace(/\b(non-member|member)\b/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function mapInventoryToProducts(inventory, salesPriceMap, spreadsheetPricing = createEmptyPricingCatalog()) {
  const groups = new Map()

  for (const item of inventory) {
    if (shouldHideInventoryItem(item)) continue

    let category = getCategory(item)
    if (!category) continue

    const name = normalizeLiveProductName(item.productname || item.strain || item.id)
    if (!name) continue

    const type = getType(item, category)

    // Reclassify beverage edibles into their own 'drinks' category
    if (category === 'edibles' && type === 'Beverage') category = 'drinks'
    const size = extractVariantSize(item)
    const quantity = parseFloat(item.remaining_quantity || item.quantity || '0') || 0
    const inStock = quantity > 0
    const inventoryId = String(item.id)
    const spreadsheetEntries = spreadsheetPricing.findEntries([
      item.productname,
      item.strain,
      name,
    ])
    const spreadsheetPrice = findSpreadsheetPrice(spreadsheetEntries, size)
    const spreadsheetPrices = pricesFromSpreadsheetEntry(spreadsheetPrice)
    const salesPrice = salesPriceMap.get(inventoryId)?.price ?? null
    const price = spreadsheetPrices?.price ?? salesPrice ?? null
    const medicalPrice = spreadsheetPrices?.medicalPrice ?? salesPrice ?? null
    const recreationalPrice = spreadsheetPrices?.recreationalPrice ?? salesPrice ?? null
    const key = `${category}::${name}`

    if (!groups.has(key)) {
      groups.set(key, {
        id: slugify(key),
        name,
        category,
        type,
        available: false,
        imageUrl: getImageForItem(category, type, name),
        description: buildDescription(item, category),
        thc: null,
        cbd: null,
        terpenes: null,
        thcMg: category === 'edibles' ? inferEdibleThcMg(name) : null,
        price: null,
        variants: [],
        biotrackIds: [],
        biotrackLocation: item.location ? String(item.location) : null,
        _prices: [],
        _medicalPrices: [],
        _recreationalPrices: [],
        _spreadsheetPrices: [],
      })
    }

    const product = groups.get(key)
    product.available = product.available || inStock
    product.biotrackIds.push(inventoryId)
    if (!product.biotrackLocation && item.location) {
      product.biotrackLocation = String(item.location)
    }
    if (price != null) product._prices.push(price)
    if (medicalPrice != null) product._medicalPrices.push(medicalPrice)
    if (recreationalPrice != null) product._recreationalPrices.push(recreationalPrice)
    if (spreadsheetPrice?.price != null) product._spreadsheetPrices.push(spreadsheetPrice.price)

    if (shouldUseVariants(category, size)) {
      const existing = product.variants.find((variant) => variant.size === size)
      if (existing) {
        existing.inStock = existing.inStock || inStock
        existing.stockCount += quantity
        if (spreadsheetPrice?.price != null) {
          existing.price = spreadsheetPrice.price
          existing.medicalPrice = spreadsheetPrices.medicalPrice
          existing.recreationalPrice = spreadsheetPrices.recreationalPrice
          existing.priceSource = 'spreadsheet'
          existing.hasSpreadsheetPrice = true
        } else if (existing.price == null && price != null) {
          existing.price = price
          existing.medicalPrice = medicalPrice
          existing.recreationalPrice = recreationalPrice
          existing.priceSource = 'sync_sale'
        }
        existing.barcodes.push(inventoryId)
      } else {
        product.variants.push({
          size,
          price,
          medicalPrice,
          recreationalPrice,
          priceSource: spreadsheetPrice?.price != null ? 'spreadsheet' : price != null ? 'sync_sale' : null,
          hasSpreadsheetPrice: spreadsheetPrice?.price != null,
          inStock,
          gramsPerUnit: parseGrams(size),
          biotrackInventoryId: inventoryId,
          barcodes: [inventoryId],
          biotrackLocation: item.location ? String(item.location) : null,
          stockCount: quantity,
        })
      }
    } else if (spreadsheetPrice?.price != null) {
      product.priceSource = 'spreadsheet'
      product.hasSpreadsheetPrice = true
    } else if (price != null) {
      product.priceSource = 'sync_sale'
    }
  }

  const products = []

  for (const product of groups.values()) {
    if (product.variants.length > 0) {
      product.variants.sort((a, b) => parseGrams(a.size) - parseGrams(b.size))
      if (product.variants.length === 1) {
        const [onlyVariant] = product.variants
        product.price = onlyVariant.price ?? average(product._prices)
        product.medicalPrice = onlyVariant.medicalPrice ?? average(product._medicalPrices) ?? product.price
        product.recreationalPrice = onlyVariant.recreationalPrice ?? average(product._recreationalPrices) ?? product.price
        product.priceSource = onlyVariant.priceSource || (product._spreadsheetPrices.length ? 'spreadsheet' : product.priceSource || null)
        product.hasSpreadsheetPrice = onlyVariant.hasSpreadsheetPrice || product._spreadsheetPrices.length > 0
        product.available = onlyVariant.inStock
        product.biotrackInventoryId = onlyVariant.biotrackInventoryId
        product.barcodes = onlyVariant.barcodes
        product.stockCount = onlyVariant.stockCount
        product.variants = []
      } else {
        const pricedVariant = product.variants.find((variant) => variant.inStock && variant.price != null)
          || product.variants.find((variant) => variant.price != null)
        product.price = pricedVariant ? pricedVariant.price : average(product._prices)
        product.medicalPrice = pricedVariant?.medicalPrice ?? average(product._medicalPrices) ?? product.price
        product.recreationalPrice = pricedVariant?.recreationalPrice ?? average(product._recreationalPrices) ?? product.price
        product.priceSource = pricedVariant?.priceSource || (product._spreadsheetPrices.length ? 'spreadsheet' : product.priceSource || null)
        product.hasSpreadsheetPrice = product._spreadsheetPrices.length > 0 || product.variants.some((variant) => variant.hasSpreadsheetPrice)
      }
    } else {
      product.price = average(product._prices)
      product.medicalPrice = average(product._medicalPrices) ?? product.price
      product.recreationalPrice = average(product._recreationalPrices) ?? product.price
      product.priceSource = product._spreadsheetPrices.length ? 'spreadsheet' : product.priceSource || null
      product.hasSpreadsheetPrice = product._spreadsheetPrices.length > 0
      product.biotrackInventoryId = product.biotrackIds[0] || null
      product.barcodes = [...product.biotrackIds]
    }

    delete product._prices
    delete product._medicalPrices
    delete product._recreationalPrices
    delete product._spreadsheetPrices
    products.push(product)
  }

  return products.sort(compareProducts)
}

function shouldHideInventoryItem(item) {
  const name = String(item.productname || '').toLowerCase()
  return Boolean(Number(item.is_sample)) || name.includes('sample')
}

function getCategory(item) {
  return INVENTORY_CATEGORY_MAP[Number(item.inventorytype)] || null
}

function getType(item, category) {
  const name = (item.productname || '').toLowerCase()
  const strain = (item.strain || '').toLowerCase()
  const typeCode = Number(item.inventorytype)

  if (category === 'flower') {
    if (strain.includes('sativa') || name.includes('(s)')) return 'Sativa Dominant'
    if (strain.includes('indica') || name.includes('(i)')) return 'Indica Dominant'
    if (strain.includes('hybrid') || name.includes('(h)')) return 'Balanced Hybrid'
    return 'Flower'
  }

  if (category === 'prerolls') {
    if (typeCode === 32 || name.includes('infused') || name.includes('lunar rock') || name.includes('moon')) {
      return 'Infused Pre-Roll'
    }
    return 'Single Joint'
  }

  if (category === 'concentrates') {
    if (name.includes('rosin')) return 'Rosin'
    if (name.includes('bubble hash') || name.includes('hash')) return 'Bubble Hash'
    if (name.includes('shatter')) return 'Shatter'
    if (name.includes('wax')) return 'Wax'
    if (name.includes('live resin') || typeCode === 17) return 'Live Resin'
    return 'Concentrate'
  }

  if (category === 'vapes') {
    if (name.includes('dispo') || name.includes('disposable')) return 'Disposable'
    if (name.includes('pod')) return 'Pod'
    return 'Cartridge'
  }

  if (category === 'edibles' || category === 'drinks') {
    if (
      name.includes('lemonade') ||
      name.includes('cock-tail') ||
      name.includes('cocktail') ||
      name.includes('drink') ||
      name.includes('beverage') ||
      name.includes('juice') ||
      name.includes('soda') ||
      name.includes('sparkling') ||
      name.includes('shot') ||
      name.includes('elixir') ||
      name.includes('syrup') ||
      name.includes('tincture') ||
      name.includes('serum') ||
      name.includes('watermelon')
    ) return 'Beverage'
    if (name.includes('gumm')) return 'Gummies'
    if (name.includes('chocolate') || name.includes('choco')) return 'Chocolate'
    if (name.includes('cookie') || name.includes('brownie') || name.includes('baked')) return 'Baked Good'
    if (name.includes('honey')) return 'Honey'
    if (name.includes('capsule') || name.includes('pill') || name.includes('tablet')) return 'Capsule'
    return 'Edible'
  }

  if (category === 'topicals') {
    if (name.includes('lotion')) return 'Lotion'
    if (name.includes('balm') || name.includes('salve')) return 'Salve'
    if (name.includes('lip balm')) return 'Lip Balm'
    return 'Topical'
  }

  return 'Product'
}

function normalizeUnicodeSpaces(str) {
  // Replace non-breaking space (\u00a0) and other Unicode whitespace with a regular space
  return str.replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/g, ' ')
}

function normalizeLiveProductName(name) {
  return normalizeUnicodeSpaces(name)
    .replace(/\s*-\s*\d+(?:\.\d+)?\s*gram(s)?\b/gi, '')
    .replace(/\b\d+(?:\.\d+)?\s*g(?:ram)?\b/gi, '')
    .replace(/\b\d+\s*gram(s)?\b/gi, '')
    .replace(/\|\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+\(\s*[sih]\s*\)/gi, '')
    .replace(/\s*-\s*$/g, '')
    .trim()
}

function extractVariantSize(item) {
  const sources = [
    item.productname,
    item.usable_weight ? `${item.usable_weight} gram` : '',
    item.net_package ? `${item.net_package} gram` : '',
  ].filter(Boolean)

  for (const src of sources) {
    const match = String(src).match(/(\d+(?:\.\d+)?)\s*gram/ig)
    if (match && match.length > 0) {
      const value = parseFloat(match[match.length - 1])
      if (Number.isFinite(value) && value > 0) return `${trimNumber(value)}g`
    }
    const shorthand = String(src).match(/(\d+(?:\.\d+)?)\s*g\b/i)
    if (shorthand) return `${trimNumber(parseFloat(shorthand[1]))}g`
    const pack = String(src).match(/\b(\d+)\s*pack\b/i)
    if (pack) return `${pack[1]}-Pack`
  }

  return null
}

function shouldUseVariants(category, size) {
  return !!size && ['flower', 'concentrates', 'prerolls', 'vapes'].includes(category)
}

function inferEdibleThcMg(name) {
  const match = String(name).match(/(\d+)\s*mg\b/i)
  return match ? parseInt(match[1], 10) : null
}

function buildDescription(item, category) {
  const parts = []

  if (item.strain && !/^(mixed|null)$/i.test(String(item.strain))) {
    parts.push(`Strain: ${item.strain}`)
  }

  if (category === 'flower' || category === 'prerolls' || category === 'concentrates') {
    const weight = extractVariantSize(item)
    if (weight) parts.push(`Package size: ${weight}`)
  }

  const remaining = parseFloat(item.remaining_quantity || '0') || 0
  if (remaining > 0) {
    parts.push(`Live stock: ${trimNumber(remaining)} unit${remaining === 1 ? '' : 's'} available`)
  }

  return parts.join(' • ')
}

function getImageForItem(category, type, name) {
  const lowerName = String(name).toLowerCase()
  const lowerType = String(type).toLowerCase()

  if (category === 'flower') return '/menu-images/flower-generic.svg'

  if (category === 'drinks') {
    return '/menu-images/edible-beverage.svg'
  }

  if (category === 'edibles') {
    if (lowerName.includes('honey')) return '/menu-images/edible-honey.svg'
    return '/menu-images/edible-generic.svg'
  }

  if (category === 'concentrates') {
    if (lowerType.includes('rosin')) return '/menu-images/conc-rosin.svg'
    return '/menu-images/conc-wax.svg'
  }

  if (category === 'vapes') {
    if (lowerType.includes('disposable')) return '/menu-images/vape-disposable.svg'
    return '/menu-images/vape-cartridge.svg'
  }

  if (category === 'prerolls') {
    if (lowerType.includes('infused') || lowerName.includes('lunar') || lowerName.includes('moon')) {
      return '/menu-images/preroll-infused.svg'
    }
    return '/menu-images/preroll-classic.svg'
  }

  if (category === 'topicals') {
    if (lowerType.includes('lip balm') || lowerType.includes('salve')) return '/menu-images/topical-salve.svg'
    return '/menu-images/topical-patch.svg'
  }

  return null
}

function applyMenuOverrides(products) {
  const overrides = loadMenuOverrides()
  const productOverrides = overrides.products || {}
  const barcodeOverrides = overrides.barcodes || {}
  const liveIds = new Set(products.map((product) => product.id))

  const liveProducts = products
    .map((product) => {
      const merged = {
        ...product,
        variants: Array.isArray(product.variants) ? product.variants.map((variant) => ({ ...variant })) : [],
      }

      const directOverride = productOverrides[product.id] || {}
      mergeProductOverride(merged, directOverride)

      if (merged.variants.length > 0) {
        merged.variants = merged.variants
          .map((variant) => {
            const variantOverride = directOverride.variantOverrides?.[variant.size] || {}
            const hasVariantPriceOverride = variantOverride.price !== undefined
              || variantOverride.medicalPrice !== undefined
              || variantOverride.recreationalPrice !== undefined
            const barcodeOverride = variant.barcodes
              ?.map((barcode) => barcodeOverrides[String(barcode)] || null)
              .find(Boolean) || {}

            return {
              ...variant,
              ...barcodeOverride,
              ...variantOverride,
              priceSource: hasVariantPriceOverride ? 'override' : (variantOverride.priceSource || barcodeOverride.priceSource || variant.priceSource),
              barcodes: variant.barcodes,
            }
          })
          .filter((variant) => !variant.hidden)

        if (merged.variants.length === 1) {
          const [onlyVariant] = merged.variants
          merged.price = onlyVariant.price ?? merged.price
        } else if (merged.variants.length > 1) {
          const pricedVariant = merged.variants.find((variant) => variant.inStock && variant.price != null)
            || merged.variants.find((variant) => variant.price != null)
          if (pricedVariant) merged.price = pricedVariant.price
        }
        if (merged.variants.some((variant) => variant.priceSource === 'override')) {
          merged.priceSource = 'override'
        }
      } else {
        const barcodeOverride = merged.barcodes
          ?.map((barcode) => barcodeOverrides[String(barcode)] || null)
          .find(Boolean) || {}
        mergeProductOverride(merged, barcodeOverride)
      }

      // Live NM Trace stock is authoritative: staff can hide an item, but cannot force
      // a sold-out live item onto the public menu.
      merged.available = product.available !== false && merged.available !== false

      return merged
    })
    .filter((product) => !product.hidden)

  const customProducts = Object.entries(productOverrides)
    .filter(([id, override]) => override?.custom === true && !liveIds.has(id) && !override.hidden)
    .map(([id, override]) => normalizeCustomProduct(id, override))

  return [...liveProducts, ...customProducts].sort(compareProducts)
}

function applyDisplayPricing(products) {
  return products.map((product) => {
    const next = {
      ...product,
      variants: Array.isArray(product.variants) ? product.variants.map((variant) => ({ ...variant })) : [],
    }

    addExplicitDisplayPrices(next)
    next.variants = next.variants.map((variant) => addExplicitDisplayPrices(variant))
    return next
  })
}

function addExplicitDisplayPrices(item) {
  const base = item.price ?? null
  item.medicalPrice = item.medicalPrice ?? base
  item.recreationalPrice = item.recreationalPrice ?? base
  item.price = item.recreationalPrice ?? item.medicalPrice ?? base
  return item
}

function mergeProductOverride(product, override) {
  if (!override) return product

  const simpleFields = ['name', 'category', 'type', 'imageUrl', 'description', 'thc', 'cbd', 'terpenes', 'thcMg', 'price', 'medicalPrice', 'recreationalPrice', 'gramsPerUnit']
  for (const field of simpleFields) {
    if (override[field] !== undefined && override[field] !== null && override[field] !== '') {
      product[field] = override[field]
      if (['price', 'medicalPrice', 'recreationalPrice'].includes(field)) product.priceSource = 'override'
    }
  }

  if (override.available !== undefined) product.available = override.available
  if (override.hidden !== undefined) product.hidden = override.hidden
  return product
}

function normalizeCustomProduct(id, override) {
  const category = override.category || 'flower'
  const type = override.type || 'Product'

  return {
    id,
    productId: id,
    name: override.name || 'Custom Product',
    category,
    type,
    available: override.available !== false,
    imageUrl: override.imageUrl || getImageForItem(category, type, override.name || ''),
    description: override.description || 'Store-managed menu item.',
    thc: override.thc || null,
    cbd: override.cbd || null,
    terpenes: override.terpenes || null,
    thcMg: override.thcMg ?? null,
    gramsPerUnit: override.gramsPerUnit ?? null,
    price: override.recreationalPrice ?? override.medicalPrice ?? override.price ?? null,
    medicalPrice: override.medicalPrice ?? override.price ?? null,
    recreationalPrice: override.recreationalPrice ?? override.price ?? null,
    priceSource: override.price != null || override.medicalPrice != null || override.recreationalPrice != null ? 'override' : null,
    hasSpreadsheetPrice: false,
    variants: Array.isArray(override.variants) ? override.variants : [],
    custom: true,
    biotrackInventoryId: override.biotrackInventoryId || null,
    barcodes: Array.isArray(override.barcodes) ? override.barcodes : [],
    biotrackLocation: override.biotrackLocation || null,
  }
}

function loadMenuOverrides() {
  try {
    if (!fs.existsSync(MENU_OVERRIDES_FILE)) {
      return { products: {}, barcodes: {} }
    }
    const raw = fs.readFileSync(MENU_OVERRIDES_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      products: parsed.products || {},
      barcodes: parsed.barcodes || {},
    }
  } catch (err) {
    console.error('[Biotrack] Failed to load menu overrides:', err.message)
    return { products: {}, barcodes: {} }
  }
}

function writeMenuOverrides(overrides) {
  const next = {
    products: overrides.products || {},
    barcodes: overrides.barcodes || {},
  }
  fs.writeFileSync(MENU_OVERRIDES_FILE, JSON.stringify(next, null, 2))
  clearProductCache()
  return next
}

function writeUnmatchedPricingItems(products) {
  const unmatched = getUnmatchedPricingItems(products)
  try {
    fs.writeFileSync(UNMATCHED_PRICING_FILE, JSON.stringify({
      generatedAt: new Date().toISOString(),
      count: unmatched.length,
      items: unmatched,
    }, null, 2))
  } catch (err) {
    console.error('[Biotrack] Failed to write unmatched pricing list:', err.message)
  }
  return unmatched
}

function readUnmatchedPricingItems() {
  try {
    if (!fs.existsSync(UNMATCHED_PRICING_FILE)) return { generatedAt: null, count: 0, items: [] }
    return JSON.parse(fs.readFileSync(UNMATCHED_PRICING_FILE, 'utf8'))
  } catch {
    return { generatedAt: null, count: 0, items: [] }
  }
}

function getUnmatchedPricingItems(products) {
  return products
    .filter((product) => !product.custom && !product.hidden && product.available !== false && !isPublicMenuProduct(product))
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      type: product.type,
      reviewReason: productHasSpreadsheetPrice(product)
        ? 'Needs staff display/pricing review'
        : 'Live in BioTrack, not found in pricing spreadsheet',
      currentPrice: product.price ?? null,
      currentPriceSource: product.priceSource || null,
      variants: Array.isArray(product.variants)
        ? product.variants
            .filter((variant) => variant.priceSource !== 'spreadsheet')
            .map((variant) => ({
              size: variant.size,
              currentPrice: variant.price ?? null,
              currentPriceSource: variant.priceSource || null,
              stockCount: variant.stockCount ?? null,
            }))
        : [],
    }))
}

function isPublicMenuProduct(product) {
  if (!product || product.hidden) return false
  if (product.available === false) return false
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const visibleVariant = product.variants.some((variant) =>
      !variant.hidden &&
      variant.inStock !== false &&
      variant.medicalPrice != null &&
      variant.recreationalPrice != null
    )
    if (!visibleVariant) return false
  } else if (product.medicalPrice == null || product.recreationalPrice == null) {
    return false
  }
  if (product.custom) return true
  if (!isConfigured() && product.price != null) return true
  if (product.priceSource === 'override') return true
  if (productHasSpreadsheetPrice(product)) return true
  return false
}

function clearProductCache() {
  _productCache = {
    at: 0,
    products: null,
    priceCoverage: 0,
    spreadsheetPriceCoverage: 0,
    location: null,
  }
}

function sameCurrency(a, b) {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return Math.abs(Number(a) - Number(b)) < 0.001
}

async function previewSpreadsheetImport(csvText) {
  const text = String(csvText || '')
  if (!text.trim()) throw new Error('Spreadsheet CSV content is required')

  const catalog = parseSpreadsheetPricingText(text)
  const products = await getAllProductsForAdmin()
  const changes = []

  for (const product of products) {
    const entries = catalog.findEntries([product.name, product.id])
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      for (const variant of product.variants) {
        const match = findSpreadsheetPrice(entries, variant.size)
        const next = pricesFromSpreadsheetEntry(match)
        if (!next) continue
        if (
          !sameCurrency(variant.medicalPrice, next.medicalPrice) ||
          !sameCurrency(variant.recreationalPrice, next.recreationalPrice)
        ) {
          changes.push({
            productId: product.id,
            productName: product.name,
            size: variant.size,
            currentMedicalPrice: variant.medicalPrice ?? null,
            currentRecreationalPrice: variant.recreationalPrice ?? null,
            nextMedicalPrice: next.medicalPrice,
            nextRecreationalPrice: next.recreationalPrice,
            sourceProduct: match.productName,
          })
        }
      }
      continue
    }

    const match = findSpreadsheetPrice(entries, null)
    const next = pricesFromSpreadsheetEntry(match)
    if (!next) continue
    if (
      !sameCurrency(product.medicalPrice, next.medicalPrice) ||
      !sameCurrency(product.recreationalPrice, next.recreationalPrice)
    ) {
      changes.push({
        productId: product.id,
        productName: product.name,
        size: null,
        currentMedicalPrice: product.medicalPrice ?? null,
        currentRecreationalPrice: product.recreationalPrice ?? null,
        nextMedicalPrice: next.medicalPrice,
        nextRecreationalPrice: next.recreationalPrice,
        sourceProduct: match.productName,
      })
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    rowCount: catalog.rowCount || 0,
    parsedPriceCount: catalog.priceCount || 0,
    changeCount: changes.length,
    changes,
  }
}

async function applySpreadsheetImport(csvText, approvedChanges = null) {
  const preview = await previewSpreadsheetImport(csvText)
  const changes = Array.isArray(approvedChanges) && approvedChanges.length > 0
    ? preview.changes.filter((change) => approvedChanges.some((approved) =>
        approved.productId === change.productId && (approved.size || null) === (change.size || null)
      ))
    : preview.changes

  const overrides = loadMenuOverrides()
  for (const change of changes) {
    const current = overrides.products[change.productId] || {}
    if (change.size) {
      overrides.products[change.productId] = {
        ...current,
        variantOverrides: {
          ...(current.variantOverrides || {}),
          [change.size]: {
            ...((current.variantOverrides || {})[change.size] || {}),
            medicalPrice: change.nextMedicalPrice,
            recreationalPrice: change.nextRecreationalPrice,
            price: change.nextRecreationalPrice ?? change.nextMedicalPrice,
          },
        },
        updatedAt: new Date().toISOString(),
      }
    } else {
      overrides.products[change.productId] = {
        ...current,
        medicalPrice: change.nextMedicalPrice,
        recreationalPrice: change.nextRecreationalPrice,
        price: change.nextRecreationalPrice ?? change.nextMedicalPrice,
        updatedAt: new Date().toISOString(),
      }
    }
  }

  fs.writeFileSync(PRICING_SOURCE_FILE, csvText)
  writeMenuOverrides(overrides)

  return {
    ...preview,
    appliedCount: changes.length,
    appliedChanges: changes,
  }
}

async function getAdminMenuItems() {
  const products = await getAllProductsForAdmin()
  const overrides = loadMenuOverrides()
  const unmatchedPricing = readUnmatchedPricingItems()

  return {
    products: products.map((product) => ({
      ...product,
      override: overrides.products?.[product.id] || null,
      needsPricingReview: !product.custom && product.available !== false && !isPublicMenuProduct(product),
      missingSpreadsheetMatch: !product.custom && !productHasSpreadsheetPrice(product),
      missingPrice: product.price == null && !(Array.isArray(product.variants) && product.variants.some((variant) => variant.price != null)),
      publicMenuVisible: isPublicMenuProduct(product),
      custom: Boolean(overrides.products?.[product.id]?.custom || product.custom),
    })),
    overrides,
    unmatchedPricing,
  }
}

function sanitizeOverrideInput(input = {}) {
  const allowedStringFields = ['name', 'category', 'type', 'imageUrl', 'description', 'thc', 'cbd', 'terpenes']
  const allowedNumberFields = ['price', 'medicalPrice', 'recreationalPrice', 'thcMg', 'gramsPerUnit']
  const next = {}

  for (const field of allowedStringFields) {
    if (input[field] !== undefined) {
      const value = String(input[field] || '').trim()
      if (value) next[field] = value.slice(0, field === 'description' ? 1000 : 180)
    }
  }

  for (const field of allowedNumberFields) {
    if (input[field] !== undefined && input[field] !== '') {
      const value = Number(input[field])
      if (Number.isFinite(value) && value >= 0) next[field] = Math.round(value * 100) / 100
    }
  }

  if (input.available !== undefined) next.available = Boolean(input.available)
  if (input.hidden !== undefined) next.hidden = Boolean(input.hidden)
  if (input.custom !== undefined) next.custom = Boolean(input.custom)
  if (input.variantOverrides && typeof input.variantOverrides === 'object') {
    next.variantOverrides = Object.fromEntries(
      Object.entries(input.variantOverrides)
        .map(([size, override]) => [String(size), sanitizeOverrideInput(override)])
        .filter(([, override]) => Object.keys(override).length > 0)
    )
  }

  return next
}

function upsertProductOverride(productId, input) {
  const id = String(productId || '').trim()
  if (!id) throw new Error('Product id is required')

  const overrides = loadMenuOverrides()
  const current = overrides.products[id] || {}
  overrides.products[id] = {
    ...current,
    ...sanitizeOverrideInput(input),
    updatedAt: new Date().toISOString(),
  }

  writeMenuOverrides(overrides)
  return overrides.products[id]
}

function createCustomProduct(input) {
  const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const overrides = loadMenuOverrides()
  overrides.products[id] = {
    ...sanitizeOverrideInput(input),
    custom: true,
    available: input.available !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (!overrides.products[id].name) {
    throw new Error('Product name is required')
  }
  if (!overrides.products[id].category) {
    throw new Error('Product category is required')
  }

  writeMenuOverrides(overrides)
  return applyDisplayPricing([normalizeCustomProduct(id, overrides.products[id])])[0]
}

function deleteProductOverride(productId) {
  const id = String(productId || '').trim()
  if (!id) throw new Error('Product id is required')

  const overrides = loadMenuOverrides()
  const current = overrides.products[id] || {}

  if (current.custom) {
    delete overrides.products[id]
  } else {
    overrides.products[id] = {
      ...current,
      hidden: true,
      updatedAt: new Date().toISOString(),
    }
  }

  writeMenuOverrides(overrides)
  return { hidden: true }
}

function buildPickupItems(items) {
  return items
    .map((item, index) => {
      const barcode = item.biotrackInventoryId || item.barcodes?.[0] || item.biotrackIds?.[0] || null
      if (!barcode) return null

      return {
        barcode,
        quantity: item.qty,
        price: item.price,
        external_id: `${item.productId || item.id || 'item'}-${index}`,
      }
    })
    .filter(Boolean)
}

function resolveOrderLocation(items) {
  return String(
    ORDER_LOCATION
    || items.find((item) => item.biotrackLocation)?.biotrackLocation
    || _productCache.location
    || ''
  ) || null
}

function formatPickupDateTime(date, time) {
  const match = String(time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) throw new Error(`Invalid pickup time: ${time}`)

  let hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)
  const meridiem = match[3].toUpperCase()

  if (meridiem === 'PM' && hour !== 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0

  const local = new Date(`${date}T00:00:00`)
  local.setHours(hour, minute, 0, 0)

  const year = local.getFullYear()
  const month = String(local.getMonth() + 1).padStart(2, '0')
  const day = String(local.getDate()).padStart(2, '0')
  const hh = String(local.getHours()).padStart(2, '0')
  const mm = String(local.getMinutes()).padStart(2, '0')
  const ss = String(local.getSeconds()).padStart(2, '0')
  const offsetMinutes = -local.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0')

  return `${year}-${month}-${day}T${hh}:${mm}:${ss}${sign}${offsetHours}`
}

function parseGrams(size) {
  const match = String(size || '').match(/(\d+(?:\.\d+)?)\s*g/i)
  return match ? parseFloat(match[1]) : Number.MAX_SAFE_INTEGER
}

function trimNumber(value) {
  return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100
}

function average(values) {
  if (!values || values.length === 0) return null
  return roundCurrency(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function compareProducts(a, b) {
  if (a.category !== b.category) return a.category.localeCompare(b.category)
  return a.name.localeCompare(b.name)
}

function productHasSpreadsheetPrice(product) {
  if (product.hasSpreadsheetPrice || product.priceSource === 'spreadsheet') return true
  return Array.isArray(product.variants) && product.variants.some((variant) => variant.hasSpreadsheetPrice || variant.priceSource === 'spreadsheet')
}

function getLocalProducts(categoryFilter = null) {
  try {
    const filePath = dataPath('products.json')
    const raw = fs.readFileSync(filePath, 'utf8')
    let products = JSON.parse(raw)
    if (categoryFilter && categoryFilter !== 'all') {
      products = products.filter((p) => p.category === categoryFilter)
    }
    return products
  } catch {
    return []
  }
}

module.exports = {
  isConfigured,
  getProducts,
  getProductById,
  getAllProductsForAdmin,
  createReservationOrder,
  updateOrderState,
  updateOrderItems,
  getConnectionStatus,
  getAdminMenuItems,
  upsertProductOverride,
  createCustomProduct,
  deleteProductOverride,
  previewSpreadsheetImport,
  applySpreadsheetImport,
  applyDisplayPricing,
  clearProductCache,
}
