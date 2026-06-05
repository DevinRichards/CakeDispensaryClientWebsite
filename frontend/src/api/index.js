/**
 * API utility — all backend calls go through here.
 * Local dev uses Vite's /api proxy. Production can point directly at the
 * deployed API service with VITE_API_BASE_URL, e.g. https://api.example.com/api.
 */

import { getClerkBearerToken } from '../auth/clerkToken'

const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
const ADMIN_TOKEN_KEY = 'cake-admin-token'
const MENU_CACHE_TTL_MS = 5 * 60 * 1000
const menuCache = new Map()

async function request(path, options = {}) {
  const clerkToken = await getClerkBearerToken()
  const legacyToken = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  const token = clerkToken || legacyToken
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ─── Products ─────────────────────────────────────
export const getProducts = async (category) => {
  const key = category && category !== 'all' ? category : 'all'
  const cached = menuCache.get(key)
  if (cached && Date.now() - cached.at < MENU_CACHE_TTL_MS) return cached.products

  const data = await request(`/products${category && category !== 'all' ? `?category=${category}` : ''}`)
  const products = Array.isArray(data) ? data : data.products || []
  menuCache.set(key, { at: Date.now(), products })
  return products
}

// ─── Deals ────────────────────────────────────────
export const getDeals = () => request('/deals')

// ─── Reservations ─────────────────────────────────
export const createReservation = (data) =>
  request('/reservations', { method: 'POST', body: JSON.stringify(data) })

export const getReservations = (status) =>
  request(`/reservations${status ? `?status=${status}` : ''}`)

export const updateReservation = (id, data) =>
  request(`/reservations/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

// ─── Contact ──────────────────────────────────────
export const submitContact = (data) =>
  request('/contact', { method: 'POST', body: JSON.stringify(data) })

export const getContacts = () => request('/contact')

export const markContactRead = (id) =>
  request(`/contact/${id}/read`, { method: 'PATCH', body: JSON.stringify({}) })

// ─── Admin ────────────────────────────────────────
export const adminLogin = (password) =>
  request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) })

export const getAdminStats = () => request('/admin/stats')

export const getBiotrackStatus = () => request('/admin/biotrack-status')

export const getAdminMenu = () => request('/admin/menu')

export const getAdminDeals = () => request('/admin/deals')

export const createAdminDeal = (data) =>
  request('/admin/deals', { method: 'POST', body: JSON.stringify(data) })

export const updateAdminDeal = (id, data) =>
  request(`/admin/deals/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) })

export const deleteAdminDeal = (id) =>
  request(`/admin/deals/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const uploadAdminImage = (data) =>
  request('/admin/uploads/image', { method: 'POST', body: JSON.stringify(data) })

export const createAdminProduct = (data) =>
  request('/admin/menu', { method: 'POST', body: JSON.stringify(data) })

export const updateAdminProduct = (id, data) =>
  request(`/admin/menu/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) })

export const deleteAdminProduct = (id) =>
  request(`/admin/menu/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const previewMenuSpreadsheetImport = (csv) =>
  request('/admin/menu/import/preview', { method: 'POST', body: JSON.stringify({ csv }) })

export const applyMenuSpreadsheetImport = (csv, approvedChanges) =>
  request('/admin/menu/import/apply', { method: 'POST', body: JSON.stringify({ csv, approvedChanges }) })

// ─── Customer ─────────────────────────────────────
// Fetches the signed-in customer's profile and reservation history.
// Passes the Clerk token directly (same mechanism as admin requests).
export const fetchCustomerSession = () => request('/customer/session')

export { ADMIN_TOKEN_KEY }
