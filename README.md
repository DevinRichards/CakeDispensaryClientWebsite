# Cake Dispensary — Website

Gallup's cannabis dispensary website. Built with React + Vite (frontend) and Node.js + Express (backend), with live NM Trace inventory powering the storefront menu.

---

## Prerequisites

Make sure you have the following installed before starting:

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)

Verify your versions:
```bash
node -v
npm -v
```

---

## Project Structure

```
Cake Dispensary Website/
├── frontend/          # React + Vite app (port 5173)
│   ├── public/        # robots.txt, sitemap.xml, static assets
│   └── src/
│       ├── api/       # All backend API calls
│       ├── components/# Reusable UI components (Nav, Footer, AgeGate, etc.)
│       ├── context/   # React context (CartContext)
│       ├── hooks/     # Custom hooks (usePageTitle)
│       └── pages/     # Full page components
├── backend/           # Express API server (port 3002)
│   ├── data/          # JSON flat-file storage (deals, overrides, reservations, contacts)
│   ├── middleware/    # JWT auth middleware
│   ├── routes/        # API route handlers
│   └── services/      # NM Trace / BioTrack integration
├── package.json       # Root scripts — runs both servers together
└── README.md
```

---

## Quick Start (Development)

### 1. Install all dependencies

From the root of the project:

```bash
npm run install:all
```

This installs packages for both the backend and frontend in one command.

### 2. Set up environment variables

Copy the example below and save it as **`backend/.env`**:

```env
# ── Server ──────────────────────────────────────────
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ── Admin Panel / Clerk Auth ────────────────────────
# Preferred production auth. Staff must sign in with Clerk and match this allowlist.
CLERK_SECRET_KEY=sk_live_or_test_key_here
CLERK_ADMIN_EMAILS=manager@example.com,owner@example.com

# Legacy local fallback only when CLERK_SECRET_KEY is not set.
ADMIN_PASSWORD=your-secure-password-here
JWT_SECRET=replace-this-with-a-long-random-secret

# ── Email (optional) ────────────────────────────────
# Used for sending reservation alerts to staff and confirmations to customers
# Works with Gmail (use an App Password, not your main password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=dispensarycake@gmail.com
EMAIL_PASS=your-gmail-app-password
# STORE_EMAIL is where staff reservation alerts are sent (defaults to EMAIL_USER)
STORE_EMAIL=dispensarycake@gmail.com

# ── Biotrack NM / NM Trace (recommended) ───────────
# Live storefront inventory is pulled from the official NM Trace JSON API.
BIOTRACK_API_URL=https://mcp-tracking.nmhealth.org/serverjson.asp
# Optional override if your account uses a different order API base
BIOTRACK_ORDER_API_URL=https://api.nm.trace.biotrackthc.net
# IMPORTANT:
# The NM Trace API docs use a "license_number" field for login. That appears to be
# the traceability account identifier / UBI-style value, not necessarily your public
# cannabis retailer license like VIC-2025-0034-PRM-0002.
BIOTRACK_LICENSE_NUMBER=your-traceability-license-number
BIOTRACK_USERNAME=your-biotrack-username
BIOTRACK_PASSWORD=your-biotrack-password
# Optional override if the pickup API needs a fixed location
BIOTRACK_ORDER_LOCATION=
```

> **Note:** If you skip the Biotrack variables, the site still works with the local fallback catalog in `backend/data/products.json`. For production, the intended source of truth is live NM Trace inventory plus menu overrides.

### 3. Start both servers

```bash
npm run dev
```

This starts the backend API (port 3002) and the frontend dev server (port 5173) concurrently.

Open your browser to: **http://localhost:5173**

---

## Running Servers Individually

If you need to run only one side at a time:

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

---

## Admin Panel

The admin panel is available at **http://localhost:5173/admin**.

Production admin auth uses Clerk. Set `VITE_CLERK_PUBLISHABLE_KEY` in the frontend environment, set `CLERK_SECRET_KEY` in `backend/.env`, and allowlist staff with `CLERK_ADMIN_EMAILS`. If Clerk is not configured, the app falls back to the legacy `ADMIN_PASSWORD` + `JWT_SECRET` local login.

From the admin panel you can:
- View and update reservation status (pending → confirmed → completed)
- Substitute individual items on a reservation when a product runs out
- Read contact form submissions
- See live dashboard stats
- Check NM Trace connection status, live inventory sync count, and price coverage

Current limitation:
- Reservation substitutions update the website/admin record immediately, but external pickup-order item reconciliation is still a manual follow-up until `updateOrderItems()` is implemented for the order API.

---

## Building for Production

```bash
npm run build
```

This builds the frontend to `frontend/dist/`. To serve it in production:

1. Point your web server (Nginx, Caddy, etc.) to serve `frontend/dist/` as static files.
2. Configure it to proxy all `/api/*` requests to the backend server.
3. Start the backend with:

```bash
cd backend
NODE_ENV=production node server.js
```

Make sure `backend/.env` has `NODE_ENV=production` and `FRONTEND_URL` set to your actual domain (e.g. `https://cakedispensarynm.com`).

---

## Menu Data

The live menu can come from two sources, depending on your `.env`:

| Source | When used |
|---|---|
| **NM Trace inventory + `backend/data/menu-overrides.json`** | Primary source when the required `BIOTRACK_*` variables are set |
| **`backend/data/products.json`** | Fallback only when Biotrack is not configured or the live sync fails |

### Live menu enrichment

`backend/data/menu-overrides.json` is the safe place to fill gaps NM Trace does not provide reliably, such as:
- approved display names
- category/type cleanup
- client-approved prices
- image URLs
- polished descriptions
- variant-specific corrections

This keeps stock and inventory identifiers live from NM Trace while letting the website stay complete and customer-friendly.

### Local fallback catalog

If you need to run without NM Trace, edit `backend/data/products.json` directly. Products support both single-price and multi-variant (gram size) formats:

**Single price product:**
```json
{
  "id": "unique-id",
  "name": "Product Name",
  "category": "vapes",
  "type": "Cartridge",
  "price": 45.00,
  "thc": "85%",
  "description": "Product description.",
  "available": true
}
```

**Multi-variant product (flower, concentrates, pre-rolls):**
```json
{
  "id": "unique-id",
  "name": "Strain Name",
  "category": "flower",
  "type": "Indica Dominant",
  "thc": "24%",
  "description": "Strain description.",
  "variants": [
    { "size": "1g",   "price": 12, "inStock": true,  "gramsPerUnit": 1   },
    { "size": "3.5g", "price": 35, "inStock": true,  "gramsPerUnit": 3.5 },
    { "size": "7g",   "price": 60, "inStock": false, "gramsPerUnit": 7   }
  ]
}
```

**Edible products** also need a `thcMg` field for NM purchase limit tracking:
```json
{ "thcMg": 100 }
```

Valid `category` values: `flower`, `edibles`, `concentrates`, `vapes`, `prerolls`, `topicals`

---

## Deals & Promotions

Edit deals directly in `backend/data/deals.json`. Deals are considered active when the current date falls within the optional `startDate` / `endDate` window. Use explicit dates for limited promotions and leave them blank only for true ongoing specials. Each deal follows this shape:

```json
{
  "id": "unique-id",
  "title": "Deal Name",
  "discount": "20% Off",
  "description": "Deal details.",
  "schedule": "Every Tuesday · All Day",
  "startDate": "2026-05-01",
  "endDate": "2026-05-31",
  "icon": "local_offer",
  "color": "primary"
}
```

The `icon` field accepts any [Material Symbols](https://fonts.google.com/icons) name.

---

## Launch Notes

Before going live, make sure you have completed the following:

- [x] Add the New Mexico Cannabis Retailer License number to `frontend/src/components/Footer.jsx`
- [ ] Configure Clerk keys and `CLERK_ADMIN_EMAILS` for the admin panel
- [ ] Keep `ADMIN_PASSWORD` and `JWT_SECRET` only as local fallback values if Clerk is not configured
- [ ] Set the real `EMAIL_PASS` in `backend/.env` so customer/staff emails are enabled
- [ ] Confirm your domain is set as `FRONTEND_URL` in production
- [ ] Ensure the site is served over **HTTPS** in production
- [ ] Update `frontend/public/sitemap.xml` if your domain differs from `cakedispensarynm.com`
- [ ] Populate client-approved staff information on the About page
- [ ] Add defined start and end dates for time-limited promotions in `backend/data/deals.json`
- [ ] Fill remaining live-menu price gaps in `backend/data/menu-overrides.json` using client-approved pricing
- [ ] Run launch QA: Chrome, Safari, Firefox, Edge, mobile/tablet, accessibility review, performance audit, and smoke test
- [ ] Validate one real end-to-end pickup creation in BioTrack before launch

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS v3, Vite |
| Backend | Node.js, Express 4, JWT (jsonwebtoken), Nodemailer |
| POS Integration | NM Trace / BioTrack inventory + pickup APIs |
| Data Storage | JSON flat files (no database required) |
| Security | Helmet, CORS, express-rate-limit, bcryptjs |
# CakeDispensaryClientWebsite
