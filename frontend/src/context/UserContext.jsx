/**
 * Customer auth context — wraps Clerk's useAuth for customer-facing features.
 * Separate from admin auth (which uses CLERK_ADMIN_EMAILS allowlist).
 * Any signed-in Clerk user gets access to their profile and reservation history.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth, useClerk, useUser as useClerkUser } from '@clerk/react'

const UserContext = createContext(null)
const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

function getClerkEmail(user) {
  return user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''
}

function buildFallbackUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.fullName || user.firstName || 'Cake Member',
    email: getClerkEmail(user),
    phone: '',
    createdAt: user.createdAt || null,
  }
}

function ClerkUserProvider({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user: clerkUser } = useClerkUser()
  const clerk = useClerk()
  const [profile, setProfile] = useState(null)
  const [reservations, setReservations] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setProfile(null)
      setReservations([])
      setSyncing(false)
      setSyncError('')
      return
    }

    let cancelled = false
    setSyncing(true)

    getToken()
      .then((token) => {
        if (!token) throw new Error('Missing session token')
        return fetch('/api/customer/session', {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
          if (!res.ok) throw new Error('Session sync failed')
          return res.json()
        })
      })
      .then((result) => {
        if (cancelled) return
        setProfile(result.data.user)
        setReservations(result.data.reservations || [])
        setSyncError('')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[UserContext] Session sync failed:', err.message)
        setProfile(buildFallbackUser(clerkUser))
        setSyncError('Your order history is temporarily unavailable.')
      })
      .finally(() => {
        if (!cancelled) setSyncing(false)
      })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken, clerkUser])

  const user = profile || buildFallbackUser(clerkUser)

  const value = useMemo(() => ({
    user,
    reservations,
    syncError,
    isSignedIn: Boolean(isSignedIn && user),
    loading: !isLoaded || syncing,
    signOut: () => clerk.signOut({ redirectUrl: '/' }),
    /** Prepend a newly created reservation to the history list */
    addReservation(reservation) {
      if (!reservation) return
      setReservations((current) => {
        if (current.some((r) => r.id === reservation.id)) return current
        return [reservation, ...current]
      })
    },
  }), [user, reservations, syncError, isSignedIn, isLoaded, syncing, clerk])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

function DisabledUserProvider({ children }) {
  const value = useMemo(() => ({
    user: null,
    reservations: [],
    syncError: '',
    isSignedIn: false,
    loading: false,
    signOut: () => {},
    addReservation: () => {},
  }), [])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function UserProvider({ children }) {
  return CLERK_ENABLED
    ? <ClerkUserProvider>{children}</ClerkUserProvider>
    : <DisabledUserProvider>{children}</DisabledUserProvider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
