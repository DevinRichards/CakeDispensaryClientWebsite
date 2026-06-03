/**
 * Admin authentication middleware.
 *
 * Preferred production mode: Clerk session auth + explicit admin email allowlist.
 * Legacy fallback mode: local password exchange + signed JWT, used only when Clerk
 * is not configured.
 */

const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { clerkClient, clerkMiddleware, getAuth } = require('@clerk/express')

const JWT_ISSUER = 'cake-dispensary-api'
const JWT_AUDIENCE = 'cake-dispensary-admin'

function getJwtSecret() {
  return process.env.JWT_SECRET || ''
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || ''
}

function isClerkConfigured() {
  return Boolean(process.env.CLERK_SECRET_KEY)
}

function getAllowedAdminEmails() {
  return String(process.env.CLERK_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function isAuthConfigured() {
  if (isClerkConfigured()) return getAllowedAdminEmails().length > 0
  return Boolean(getJwtSecret() && getAdminPassword())
}

function maybeClerkMiddleware() {
  return isClerkConfigured() ? clerkMiddleware() : (_req, _res, next) => next()
}

/** Middleware: verifies Clerk session auth in production, or legacy JWT fallback. */
async function requireAuth(req, res, next) {
  if (!isAuthConfigured()) {
    return res.status(503).json({ error: 'Admin authentication is not configured' })
  }

  if (isClerkConfigured()) {
    try {
      const auth = getAuth(req)
      if (!auth.isAuthenticated || !auth.userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const allowedEmails = getAllowedAdminEmails()
      const user = await clerkClient.users.getUser(auth.userId)
      const userEmails = user.emailAddresses
        .map((entry) => entry.emailAddress?.toLowerCase())
        .filter(Boolean)
      const authorizedEmail = userEmails.find((email) => allowedEmails.includes(email))

      if (!authorizedEmail) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      req.admin = {
        role: 'admin',
        provider: 'clerk',
        userId: auth.userId,
        email: authorizedEmail,
      }
      return next()
    } catch (err) {
      console.error('[Auth] Clerk admin auth failed:', err.message)
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/** Sign a new admin token (24-hour expiry) */
function signAdminToken() {
  if (!isAuthConfigured()) {
    throw new Error('Admin authentication is not configured')
  }

  return jwt.sign(
    { role: 'admin' },
    getJwtSecret(),
    {
      expiresIn: '12h',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  )
}

/** Verify admin password */
function safeCompare(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

function checkAdminPassword(password) {
  const adminPass = getAdminPassword()
  if (!adminPass || typeof password !== 'string') return false
  return safeCompare(password, adminPass)
}

/**
 * Middleware: verifies any valid Clerk session (customer-facing routes).
 * Does NOT check the admin email allowlist — any authenticated Clerk user passes.
 */
async function requireCustomerAuth(req, res, next) {
  if (!isClerkConfigured()) {
    return res.status(503).json({ error: 'Customer authentication is not available' })
  }
  try {
    const auth = getAuth(req)
    if (!auth?.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    req.customerId = auth.userId
    return next()
  } catch (err) {
    console.error('[Auth] Customer auth check failed:', err.message)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

module.exports = {
  requireAuth,
  requireCustomerAuth,
  signAdminToken,
  checkAdminPassword,
  isAuthConfigured,
  isClerkConfigured,
  maybeClerkMiddleware,
}
