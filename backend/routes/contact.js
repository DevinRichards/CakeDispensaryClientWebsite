const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { sendContactAlert } = require('../services/email')

const FILE = path.join(__dirname, '../data/contacts.json')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-().\s]{7,20}$/

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

function cleanMessage(value, maxLength) {
  return String(value || '')
    .replace(/\r/g, '')
    .trim()
    .slice(0, maxLength)
}

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body

    if (!name || !phone || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const cleanName = cleanText(name, 120)
    const cleanPhone = cleanText(phone, 32)
    const cleanEmail = cleanText(email, 254).toLowerCase()
    const cleanSubject = cleanText(subject, 120)
    const cleanBody = cleanMessage(message, 3000)

    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    if (!PHONE_RE.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid phone number' })
    }

    const submission = {
      id: uuidv4(),
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanBody,
      read: false,
      createdAt: new Date().toISOString(),
    }

    const all = readAll()
    all.unshift(submission) // newest first
    writeAll(all)

    sendContactAlert(submission) // non-blocking

    res.status(201).json({ success: true })
  } catch (err) {
    console.error('[Contact] POST error:', err)
    res.status(500).json({ error: 'Failed to submit contact form' })
  }
})

// GET /api/contact — admin only
router.get('/', (req, res) => {
  try {
    res.json(readAll())
  } catch {
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// PATCH /api/contact/:id/read
router.patch('/:id/read', (req, res) => {
  try {
    const all = readAll()
    const idx = all.findIndex((c) => c.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Not found' })
    all[idx].read = true
    writeAll(all)
    res.json(all[idx])
  } catch {
    res.status(500).json({ error: 'Failed to update' })
  }
})

module.exports = router
