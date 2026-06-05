# Render + GoDaddy Launch Guide

This app should be deployed as two Render services:

- `cake-dispensary-api`: Node/Express backend.
- `cake-dispensary-web`: Vite static frontend.

GoDaddy should only manage DNS. Render hosts the website and API.

## 1. Render Blueprint

Use the root `render.yaml` file to create the services in Render.

The backend includes a persistent disk mounted at:

```text
/var/data/cake-dispensary
```

The backend reads/writes app data through:

```text
DATA_DIR=/var/data/cake-dispensary
```

This keeps reservations, contact messages, menu overrides, uploaded pricing CSVs, and pricing review data from disappearing on deploys.

## 2. Backend Environment Variables

Set these on `cake-dispensary-api` in Render.

```env
NODE_ENV=production
DATA_DIR=/var/data/cake-dispensary
PUBLIC_API_URL=https://api.cakedispensarynm.com

FRONTEND_URL=https://cakedispensarynm.com
FRONTEND_URLS=https://cakedispensarynm.com,https://www.cakedispensarynm.com

CLERK_SECRET_KEY=...
CLERK_ADMIN_EMAILS=dispensarycake@gmail.com

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=dispensarycake@gmail.com
EMAIL_PASS=...
STORE_EMAIL=dispensarycake@gmail.com

BIOTRACK_API_URL=https://mcp-tracking.nmhealth.org/serverjson.asp
BIOTRACK_ORDER_API_URL=https://api.nm.trace.biotrackthc.net
BIOTRACK_LICENSE_NUMBER=...
BIOTRACK_FACILITY_KEY=...
BIOTRACK_USERNAME=...
BIOTRACK_PASSWORD=...
BIOTRACK_ORDER_LOCATION=...
```

Use a Gmail App Password for `EMAIL_PASS`, not the normal Gmail password.

## 3. Frontend Environment Variables

Set these on `cake-dispensary-web` in Render.

```env
VITE_API_BASE_URL=https://api.cakedispensarynm.com/api
VITE_CLERK_PUBLISHABLE_KEY=...
```

If the API custom domain is not ready yet, temporarily use the Render backend URL:

```env
VITE_API_BASE_URL=https://cake-dispensary-api.onrender.com/api
```

After changing `VITE_*` variables, redeploy the static frontend because Vite bakes them into the build.

## 4. GoDaddy DNS

After Render gives the exact DNS targets for each custom domain, update GoDaddy DNS.

Recommended domain layout:

```text
cakedispensarynm.com      -> Render static frontend
www.cakedispensarynm.com  -> Render static frontend
api.cakedispensarynm.com  -> Render backend API
```

Typical records:

```text
Type   Name   Value
CNAME  www    cake-dispensary-web.onrender.com
CNAME  api    cake-dispensary-api.onrender.com
```

For the apex/root domain (`cakedispensarynm.com`), use the exact record Render provides. If GoDaddy does not support CNAME flattening/ALIAS/ANAME for the apex, use Render's provided A record target.

## 5. Clerk Production URLs

In Clerk, add the production domains before launch:

```text
https://cakedispensarynm.com
https://www.cakedispensarynm.com
```

Also confirm the admin staff email is included in `CLERK_ADMIN_EMAILS`.

## 6. Post-Deploy Smoke Test

Run these after DNS and Render deploys are live.

```bash
curl https://api.cakedispensarynm.com/api/health
```

Expected result:

```json
{"status":"ok","version":"1.0.0"}
```

Then verify in the browser:

- Home page loads on the custom domain.
- Menu loads live products.
- Cart can submit a pickup reservation.
- Staff receives the new reservation notification email.
- Customer receives the reservation received email.
- Admin can sign in with Clerk.
- Admin can confirm the reservation.
- Customer receives the confirmed pickup email.
- Admin notification banner shows pending pickup orders.

## 7. Launch Blockers To Clear

- Gmail SMTP login must pass with an App Password.
- Render backend custom domain must be connected before setting `VITE_API_BASE_URL` to `https://api.cakedispensarynm.com/api`.
- Clerk production domains must be allowed.
- Render persistent disk must be enabled on the backend service.
- BioTrack credentials must work from Render's deployed environment.
