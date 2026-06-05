const express = require('express')
const router = express.Router()
const biotrack = require('../services/biotrack')

// GET /api/products
// Query: ?category=flower|edibles|concentrates|prerolls|topicals|all
router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const products = await biotrack.getProducts(category || null)
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
    res.json({ products, source: biotrack.isConfigured() ? 'biotrack' : 'local' })
  } catch (err) {
    console.error('[Products] GET error:', err)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await biotrack.getProductById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

module.exports = router
