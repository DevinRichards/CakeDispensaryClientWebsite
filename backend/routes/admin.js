/**
 * Admin API routes
 * POST /api/admin/login        — get a JWT token
 * GET  /api/admin/stats        — dashboard stats
 * GET  /api/admin/biotrack-status — Biotrack POS connection info
 */

const express = require('express')
const router = express.Router()
const fs = require('fs')
const { requireAuth, signAdminToken, checkAdminPassword, isAuthConfigured, isClerkConfigured } = require('../middleware/auth')
const biotrack = require('../services/biotrack')
const { dataPath } = require('../utils/dataPath')

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
