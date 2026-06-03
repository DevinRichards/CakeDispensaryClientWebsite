require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { isClerkConfigured, maybeClerkMiddleware, requireAuth, requireCustomerAuth } = require('./middleware/auth')

const app = express()
const PORT = process.env.PORT || 3002

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(maybeClerkMiddleware())

// ─── Security Headers ─────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image loads
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://*.clerk.accounts.dev', 'https://*.clerk.com'],
      frameSrc: ['https://www.google.com', 'https://maps.google.com', 'https://www.google.com/maps'],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
}))

// ─── CORS ─────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost:4173', FRONTEND_URL],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// ─── Body Parsing ──────────────────────────────────
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// ─── Rate Limits ──────────────────────────────────
// General API: 100 req/15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

// Strict limit for form submissions: 10/15 min per IP
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions, please wait before trying again.' },
})

// Admin login: 5 attempts/15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
})

app.use('/api/', apiLimiter)

// ─── Public Routes ────────────────────────────────
app.use('/api/products', require('./routes/products'))
app.use('/api/deals', require('./routes/deals'))

// Reservation POST is public; GET/PATCH are admin-protected
const reservationRouter = require('./routes/reservations')
app.use('/api/reservations', (req, res, next) => {
  if (req.method === 'POST') return formLimiter(req, res, next)
  return requireAuth(req, res, next)
}, reservationRouter)

// Contact POST is public; GET/PATCH are admin-protected
const contactRouter = require('./routes/contact')
app.use('/api/contact', (req, res, next) => {
  if (req.method === 'POST') return formLimiter(req, res, next)
  return requireAuth(req, res, next)
}, contactRouter)

// ─── Customer Routes (any authenticated Clerk user) ───────────────────────────
app.use('/api/customer', requireCustomerAuth, require('./routes/customer'))

// ─── Admin Routes ─────────────────────────────────
const adminRouter = require('./routes/admin')
app.use('/api/admin', (req, res, next) => {
  if (req.path === '/login' && req.method === 'POST') {
    return authLimiter(req, res, next)
  }
  return next()
}, adminRouter)

// ─── Health Check ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ─── 404 ───────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.path}` })
})

// ─── Global Error Handler ─────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  const emailConfigured = Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)
  console.log(`\n🎂 Cake Dispensary API`)
  console.log(`   Running on: http://localhost:${PORT}`)
  console.log(`   Biotrack:   ${process.env.BIOTRACK_LICENSE_NUMBER && process.env.BIOTRACK_USERNAME && process.env.BIOTRACK_PASSWORD ? '✅ Configured (live NM Trace inventory)' : '⚠️  Not configured (using local fallback catalog)'}`)
  console.log(`   Email:      ${emailConfigured ? '✅ Configured' : '⚠️  Not configured (email disabled)'}`)
  console.log(`   Auth:       ${isClerkConfigured() ? '✅ Clerk configured' : '⚠️  Legacy JWT fallback'}`)
  console.log(`   CORS:       ${FRONTEND_URL}`)
  console.log()
})
