/**
 * Customer-facing auth routes.
 * Any authenticated Clerk user (not just admin-listed emails) can access these.
 */
const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { clerkClient, getAuth } = require('@clerk/express')

const RESERVATIONS_FILE = path.join(__dirname, '../data/reservations.json')

function readReservations() {
  if (!fs.existsSync(RESERVATIONS_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(RESERVATIONS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function getPrimaryEmail(clerkUser) {
  if (!clerkUser?.emailAddresses?.length) return null
  const primary = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
  return (primary || clerkUser.emailAddresses[0])?.emailAddress || null
}

function getPrimaryPhone(clerkUser) {
  if (!clerkUser?.phoneNumbers?.length) return null
  const primary = clerkUser.phoneNumbers.find((e) => e.id === clerkUser.primaryPhoneNumberId)
  return (primary || clerkUser.phoneNumbers[0])?.phoneNumber || null
}

function getDisplayName(clerkUser, fallbackEmail) {
  const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim()
  if (fullName) return fullName
  return fallbackEmail ? fallbackEmail.split('@')[0] : 'Cake Member'
}

// GET /api/customer/session
// Returns the signed-in customer's profile and their reservation history.
router.get('/session', async (req, res) => {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(503).json({ error: 'Customer authentication is not configured' })
    }

    const auth = getAuth(req)
    if (!auth?.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const clerkUser = await clerkClient.users.getUser(auth.userId)
    const email = getPrimaryEmail(clerkUser)
    if (!email) {
      return res.status(400).json({ error: 'Your account does not have an email address' })
    }

    const phone = getPrimaryPhone(clerkUser)
    const name = getDisplayName(clerkUser, email)

    // Find reservations belonging to this customer — match by Clerk userId OR email
    const all = readReservations()
    const reservations = all
      .filter((r) =>
        (r.customerId && r.customerId === auth.userId) ||
        (!r.customerId && r.email?.toLowerCase() === email.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50)

    return res.json({
      success: true,
      data: {
        user: {
          id: auth.userId,
          name,
          email,
          phone: phone || null,
          createdAt: clerkUser.createdAt || null,
        },
        reservations,
      },
    })
  } catch (err) {
    console.error('[Customer] Session lookup failed:', err.message)
    return res.status(500).json({ error: 'Could not load account data' })
  }
})

module.exports = router
