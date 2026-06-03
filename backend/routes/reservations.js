const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { getAuth } = require('@clerk/express')
const biotrack = require('../services/biotrack')
const { sendReservationAlert, sendConfirmationEmail } = require('../services/email')

const FILE = path.join(__dirname, '../data/reservations.json')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-().\s]{7,20}$/
const RESERVATION_STATUSES = new Set(['pending', 'confirmed', 'cancelled', 'completed'])
const STORE_HOURS = {
  0: { open: 12, close: 22 },
  1: { open: 10, close: 22 },
  2: { open: 10, close: 22 },
  3: { open: 10, close: 22 },
  4: { open: 10, close: 22 },
  5: { open: 10, close: 23 },
  6: { open: 10, close: 23 },
}

function readAll() {
  if (!fs.existsSync(FILE)) return []
  return JSON.parse(fs.readFileSync(FILE, 'utf8'))
}

function writeAll(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function cleanMultilineText(value, maxLength) {
  return String(value || '')
    .replace(/\r/g, '')
    .trim()
    .slice(0, maxLength)
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function getPickupSlots(dateStr) {
  if (!isValidDateString(dateStr)) return []

  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return []

  const dow = date.getDay()
  const hours = STORE_HOURS[dow] || { open: 10, close: 22 }
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const isToday = dateStr === today
  const slots = []

  for (let h = hours.open; h < hours.close; h += 1) {
    for (let m = 0; m < 60; m += 15) {
      if (isToday) {
        const slotTime = new Date(year, month - 1, day, h, m)
        if (slotTime <= now) continue
      }

      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
      const ampm = h >= 12 ? 'PM' : 'AM'
      const minStr = String(m).padStart(2, '0')
      slots.push(`${hour12}:${minStr} ${ampm}`)
    }
  }

  return slots
}

async function normalizeReservationItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('Reservation must include at least one item')
  }

  if (rawItems.length > 25) {
    throw new Error('Reservation exceeds the maximum number of items')
  }

  const normalized = []

  for (const rawItem of rawItems) {
    const requestedQty = Number.parseInt(rawItem?.qty, 10)
    if (!Number.isInteger(requestedQty) || requestedQty < 1 || requestedQty > 25) {
      throw new Error('Invalid reservation quantity')
    }

    const baseProductId = cleanText(rawItem?.productId || rawItem?.id || '', 160).split('__')[0]
    if (!baseProductId) {
      throw new Error('Reservation contains an invalid product reference')
    }

    const product = await biotrack.getProductById(baseProductId)
    if (!product) {
      throw new Error('One or more reserved products could not be found')
    }

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const requestedVariant = cleanText(rawItem?.variant, 32)
      const variant = product.variants.find((entry) => entry.size === requestedVariant)
      if (!variant) {
        throw new Error(`Selected size is no longer available for ${product.name}`)
      }
      if (!variant.inStock) {
        throw new Error(`${product.name} (${variant.size}) is out of stock`)
      }
      if (variant.price == null) {
        throw new Error(`${product.name} (${variant.size}) does not have a valid price`)
      }

      normalized.push({
        id: `${product.id}__${variant.size}`,
        productId: product.id,
        name: product.name,
        category: product.category,
        type: product.type,
        variant: variant.size,
        price: variant.price,
        medicalPrice: variant.medicalPrice ?? variant.price,
        recreationalPrice: variant.recreationalPrice ?? variant.price,
        qty: requestedQty,
        gramsPerUnit: variant.gramsPerUnit ?? null,
        thcMg: product.thcMg ?? null,
        biotrackInventoryId: variant.biotrackInventoryId || null,
        barcodes: Array.isArray(variant.barcodes) ? [...variant.barcodes] : [],
        biotrackLocation: variant.biotrackLocation || product.biotrackLocation || null,
      })
      continue
    }

    if (product.available === false) {
      throw new Error(`${product.name} is out of stock`)
    }
    if (product.price == null) {
      throw new Error(`${product.name} does not have a valid price`)
    }

    normalized.push({
      id: product.id,
      productId: product.id,
      name: product.name,
      category: product.category,
      type: product.type,
      price: product.price,
      medicalPrice: product.medicalPrice ?? product.price,
      recreationalPrice: product.recreationalPrice ?? product.price,
      qty: requestedQty,
      gramsPerUnit: product.gramsPerUnit ?? null,
      thcMg: product.thcMg ?? null,
      biotrackInventoryId: product.biotrackInventoryId || null,
      barcodes: Array.isArray(product.barcodes) ? [...product.barcodes] : [],
      biotrackLocation: product.biotrackLocation || null,
    })
  }

  return normalized
}

// POST /api/reservations — submit a new reservation
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, pickupDate, pickupTime, items } = req.body

    if (!name || !phone || !email || !pickupDate || !pickupTime || !items?.length) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const cleanName = cleanText(name, 120)
    const cleanPhone = cleanText(phone, 32)
    const cleanEmail = cleanText(email, 254).toLowerCase()

    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    if (!PHONE_RE.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid phone number' })
    }

    if (!isValidDateString(pickupDate)) {
      return res.status(400).json({ error: 'Invalid pickup date' })
    }

    const today = new Date().toISOString().slice(0, 10)
    if (pickupDate < today) {
      return res.status(400).json({ error: 'Pickup date cannot be in the past' })
    }

    const validSlots = getPickupSlots(pickupDate)
    if (!validSlots.includes(pickupTime)) {
      return res.status(400).json({ error: 'Invalid pickup time for the selected date' })
    }

    const normalizedItems = await normalizeReservationItems(items)

    // Optionally link reservation to a signed-in Clerk customer account
    let customerId = null
    if (process.env.CLERK_SECRET_KEY) {
      try {
        customerId = getAuth(req)?.userId || null
      } catch {
        // Guest checkout — no customer account linked
      }
    }

    const reservation = {
      id: uuidv4(),
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      customerId,
      pickupDate,
      pickupTime,
      items: normalizedItems,
      status: 'pending',
      substitutions: [],     // staff-managed item substitutions
      biotrackOrderId: null,
      note: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 1. Save locally
    const all = readAll()
    all.push(reservation)
    writeAll(all)

    // 2. Send email alert to staff + confirmation to customer (non-blocking)
    sendReservationAlert(reservation)

    res.status(201).json({ success: true, reservation })
  } catch (err) {
    console.error('[Reservations] POST error:', err)
    res.status(500).json({ error: 'Failed to create reservation' })
  }
})

// GET /api/reservations — list all (admin only)
router.get('/', (req, res) => {
  try {
    const all = readAll()
    const { status } = req.query
    const filtered = status ? all.filter((r) => r.status === status) : all
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json(filtered)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservations' })
  }
})

// PATCH /api/reservations/:id — update status, note, or substitutions (admin)
router.patch('/:id', async (req, res) => {
  try {
    const all = readAll()
    const idx = all.findIndex((r) => r.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Reservation not found' })

    const { status, note, substitution } = req.body

    // Apply top-level fields
    if (status !== undefined) {
      if (!RESERVATION_STATUSES.has(status)) {
        return res.status(400).json({ error: 'Invalid reservation status' })
      }
      all[idx].status = status
    }
    if (note !== undefined) all[idx].note = cleanMultilineText(note, 1000)

    // Handle a substitution entry: { itemIndex, originalName, substituteWith, reason }
    if (substitution) {
      const itemIndex = Number.parseInt(substitution.itemIndex, 10)
      if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= all[idx].items.length) {
        return res.status(400).json({ error: 'Invalid substitution item index' })
      }

      const substituteWith = cleanText(substitution.substituteWith, 160)
      const originalName = cleanText(substitution.originalName, 160)
      const reason = cleanMultilineText(substitution.reason || '', 240)

      if (!substituteWith) {
        return res.status(400).json({ error: 'Replacement item is required' })
      }

      if (!Array.isArray(all[idx].substitutions)) all[idx].substitutions = []
      const existing = all[idx].substitutions.findIndex(
        (s) => s.itemIndex === itemIndex
      )
      const entry = {
        itemIndex,
        originalName,
        substituteWith,
        reason,
        addedAt: new Date().toISOString(),
      }
      if (existing !== -1) {
        all[idx].substitutions[existing] = entry
      } else {
        all[idx].substitutions.push(entry)
      }
    }

    all[idx].updatedAt = new Date().toISOString()
    writeAll(all)

    const reservation = all[idx]

    // ── Biotrack sync ────────────────────────────────────────────────────────
    if (status === 'confirmed' && !reservation.biotrackOrderId) {
      // First confirmation — create the pending sale in Biotrack now
      biotrack.createReservationOrder(reservation).then((biotrackOrderId) => {
        if (biotrackOrderId) {
          const latest = readAll()
          const i = latest.findIndex((r) => r.id === reservation.id)
          if (i !== -1) {
            latest[i].biotrackOrderId = biotrackOrderId
            writeAll(latest)
          }
        }
      })
    } else if (status && reservation.biotrackOrderId) {
      // Subsequent status changes — sync to existing Biotrack order
      const btState =
        status === 'cancelled' ? 'cancelled'
        : status === 'completed' ? 'completed'
        : 'pending'
      biotrack.updateOrderState(reservation.biotrackOrderId, btState)
    }

    // If a substitution was applied and Biotrack order exists, push updated items
    if (substitution && reservation.biotrackOrderId) {
      biotrack.updateOrderItems(reservation.biotrackOrderId, reservation.items, reservation.substitutions)
    }

    // ── Email: customer confirmation on first confirm ────────────────────────
    if (status === 'confirmed') {
      sendConfirmationEmail(reservation)
    }

    res.json(reservation)
  } catch (err) {
    console.error('[Reservations] PATCH error:', err)
    res.status(500).json({ error: 'Failed to update reservation' })
  }
})

// GET /api/reservations/:id — single reservation
router.get('/:id', (req, res) => {
  const all = readAll()
  const found = all.find((r) => r.id === req.params.id)
  if (!found) return res.status(404).json({ error: 'Not found' })
  res.json(found)
})

module.exports = router
