/**
 * Admin API routes
 * POST /api/admin/login        — get a JWT token
 * GET  /api/admin/stats        — dashboard stats
 * GET  /api/admin/biotrack-status — Biotrack POS connection info
 */

const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { requireAuth, signAdminToken, checkAdminPassword, isAuthConfigured, isClerkConfigured } = require('../middleware/auth')
const biotrack = require('../services/biotrack')
const { dataPath, ACTIVE_DATA_DIR } = require('../utils/dataPath')

const DEALS_FILE = dataPath('deals.json')
const UPLOAD_DIR = path.join(ACTIVE_DATA_DIR, 'uploads')

function readJsonFile(file, fallback = []) {
  if (!fs.existsSync(file)) return fallback
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJsonFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function cleanText(value, maxLength = 180) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function cleanDate(value) {
  const text = String(value || '').trim()
  if (!text) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

function sanitizeDealInput(input = {}, existing = {}) {
  const title = cleanText(input.title ?? existing.title, 120)
  const discount = cleanText(input.discount ?? existing.discount, 60)
  const description = cleanText(input.description ?? existing.description, 1000)
  if (!title || !discount || !description) {
    throw new Error('Deal title, discount, and description are required')
  }

  return {
    id: existing.id || `deal-${crypto.randomUUID()}`,
    title,
    discount,
    description,
    category: cleanText(input.category ?? existing.category ?? 'all', 40) || 'all',
    schedule: cleanText(input.schedule ?? existing.schedule ?? 'Ongoing', 120) || 'Ongoing',
    startDate: cleanDate(input.startDate ?? existing.startDate),
    endDate: cleanDate(input.endDate ?? existing.endDate),
    icon: cleanText(input.icon ?? existing.icon ?? 'local_offer', 40) || 'local_offer',
    color: cleanText(input.color ?? existing.color ?? 'primary', 40) || 'primary',
  }
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  if (isClerkConfigured()) {
    return res.status(410).json({ error: 'Password login is disabled. Use Clerk sign-in.' })
  }

  if (!isAuthConfigured()) {
    return res.status(503).json({ error: 'Admin authentication is not configured' })
  }

  const { password } = req.body
  if (!password || !checkAdminPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  res.set('Cache-Control', 'no-store')
  res.json({ token: signAdminToken(), expiresIn: '12h' })
})

// GET /api/admin/stats (protected)
router.get('/stats', requireAuth, (req, res) => {
  try {
    res.set('Cache-Control', 'no-store')

    const resFile = dataPath('reservations.json')
    const conFile = dataPath('contacts.json')

    const reservations = fs.existsSync(resFile)
      ? JSON.parse(fs.readFileSync(resFile, 'utf8'))
      : []
    const contacts = fs.existsSync(conFile)
      ? JSON.parse(fs.readFileSync(conFile, 'utf8'))
      : []

    const today = new Date().toISOString().slice(0, 10)

    res.json({
      reservations: {
        total:     reservations.length,
        pending:   reservations.filter((r) => r.status === 'pending').length,
        confirmed: reservations.filter((r) => r.status === 'confirmed').length,
        cancelled: reservations.filter((r) => r.status === 'cancelled').length,
        today:     reservations.filter((r) => r.pickupDate === today).length,
      },
      contacts: {
        total:  contacts.length,
        unread: contacts.filter((c) => !c.read).length,
      },
      biotrackConfigured: biotrack.isConfigured(),
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' })
  }
})

// GET /api/admin/biotrack-status (protected)
router.get('/biotrack-status', requireAuth, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store')
    const status = await biotrack.getConnectionStatus()
    res.json(status)
  } catch (err) {
    res.status(500).json({ connected: false, message: err.message })
  }
})

// GET /api/admin/deals (protected)
router.get('/deals', requireAuth, (req, res) => {
  try {
    res.set('Cache-Control', 'no-store')
    res.json(readJsonFile(DEALS_FILE, []))
  } catch {
    res.status(500).json({ error: 'Failed to load deals' })
  }
})

// POST /api/admin/deals (protected)
router.post('/deals', requireAuth, (req, res) => {
  try {
    const deals = readJsonFile(DEALS_FILE, [])
    const deal = sanitizeDealInput(req.body || {})
    deals.push(deal)
    writeJsonFile(DEALS_FILE, deals)
    res.status(201).json(deal)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create deal' })
  }
})

// PATCH /api/admin/deals/:id (protected)
router.patch('/deals/:id', requireAuth, (req, res) => {
  try {
    const deals = readJsonFile(DEALS_FILE, [])
    const index = deals.findIndex((deal) => deal.id === req.params.id)
    if (index === -1) return res.status(404).json({ error: 'Deal not found' })
    deals[index] = sanitizeDealInput(req.body || {}, deals[index])
    writeJsonFile(DEALS_FILE, deals)
    res.json(deals[index])
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update deal' })
  }
})

// DELETE /api/admin/deals/:id (protected)
router.delete('/deals/:id', requireAuth, (req, res) => {
  try {
    const deals = readJsonFile(DEALS_FILE, [])
    const next = deals.filter((deal) => deal.id !== req.params.id)
    if (next.length === deals.length) return res.status(404).json({ error: 'Deal not found' })
    writeJsonFile(DEALS_FILE, next)
    res.json({ success: true, id: req.params.id })
  } catch {
    res.status(400).json({ error: 'Failed to delete deal' })
  }
})

// POST /api/admin/uploads/image (protected)
router.post('/uploads/image', requireAuth, (req, res) => {
  try {
    const { filename, mimeType, dataBase64 } = req.body || {}
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (!allowed.has(mimeType)) return res.status(400).json({ error: 'Unsupported image type' })
    if (!dataBase64) return res.status(400).json({ error: 'Image data is required' })

    const bytes = Buffer.from(String(dataBase64).replace(/^data:[^,]+,/, ''), 'base64')
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be 2MB or smaller' })
    }

    const ext =
      mimeType === 'image/png' ? '.png'
      : mimeType === 'image/webp' ? '.webp'
      : '.jpg'
    const safeStem = cleanText(path.parse(filename || 'product-image').name, 80)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product-image'
    const storedName = `${Date.now().toString(36)}-${safeStem}${ext}`
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    fs.writeFileSync(path.join(UPLOAD_DIR, storedName), bytes)
    const publicBase = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`
    res.status(201).json({ url: `${publicBase.replace(/\/+$/, '')}/uploads/${storedName}` })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to upload image' })
  }
})

// GET /api/admin/menu (protected)
router.get('/menu', requireAuth, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store')
    const menu = await biotrack.getAdminMenuItems()
    res.json(menu)
  } catch (err) {
    console.error('[Admin] menu GET error:', err)
    res.status(500).json({ error: 'Failed to load menu admin data' })
  }
})

// POST /api/admin/menu/import/preview (protected) — parse spreadsheet CSV and show changes
router.post('/menu/import/preview', requireAuth, async (req, res) => {
  try {
    const preview = await biotrack.previewSpreadsheetImport(req.body?.csv || '')
    res.json(preview)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to preview spreadsheet import' })
  }
})

// POST /api/admin/menu/import/apply (protected) — apply approved spreadsheet price changes
router.post('/menu/import/apply', requireAuth, async (req, res) => {
  try {
    const result = await biotrack.applySpreadsheetImport(req.body?.csv || '', req.body?.approvedChanges || null)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to apply spreadsheet import' })
  }
})

// POST /api/admin/menu (protected) — create a website-managed menu item
router.post('/menu', requireAuth, async (req, res) => {
  try {
    const product = biotrack.createCustomProduct(req.body || {})
    res.status(201).json(product)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create product' })
  }
})

// PATCH /api/admin/menu/:id (protected) — force price/details/visibility overrides
router.patch('/menu/:id', requireAuth, async (req, res) => {
  try {
    const override = biotrack.upsertProductOverride(req.params.id, req.body || {})
    res.json(override)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update product override' })
  }
})

// DELETE /api/admin/menu/:id (protected) — hide live items or remove custom items
router.delete('/menu/:id', requireAuth, async (req, res) => {
  try {
    const result = biotrack.deleteProductOverride(req.params.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to delete product' })
  }
})

module.exports = router
