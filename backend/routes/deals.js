const express = require('express')
const router = express.Router()
const fs = require('fs')
const { dataPath } = require('../utils/dataPath')

const FILE = dataPath('deals.json')

function parseDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isActiveDeal(deal, now) {
  const startDate = parseDate(deal.startDate)
  const endDate = parseDate(deal.endDate)

  if (startDate && now < startDate) return false
  if (endDate && now > endDate) return false

  return true
}

router.get('/', (req, res) => {
  try {
    const deals = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : []
    const now = new Date()
    const enriched = deals.map((d) => ({
      ...d,
      isActive: isActiveDeal(d, now),
      hasDefinedWindow: Boolean(d.startDate && d.endDate),
    }))
    res.json(enriched)
  } catch {
    res.status(500).json({ error: 'Failed to fetch deals' })
  }
})

module.exports = router
