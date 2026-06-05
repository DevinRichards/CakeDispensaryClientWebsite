# Cake Dispensary Launch Checklist

Use this checklist to move from local build-ready code to a live Render + GoDaddy launch.

## Local Code Readiness

- [x] Production frontend build passes with `npm run build`.
- [x] Backend syntax checks pass.
- [x] Render Blueprint exists at `render.yaml`.
- [x] Render + GoDaddy launch guide exists at `RENDER_GODADDY_LAUNCH.md`.
- [x] Frontend supports production API base URL through `VITE_API_BASE_URL`.
- [x] Backend supports multiple production frontend origins through `FRONTEND_URLS`.
- [x] Backend supports Render persistent disk storage through `DATA_DIR`.
- [x] Latest pricing spreadsheet is converted into `backend/data/products-pricing-source.csv`.
- [x] BioTrack-only products not found in the spreadsheet are hidden from public menu and sent to admin review.

## GitHub / Source Control

- [x] Review current working tree.
- [x] Commit launch prep changes.
- [ ] Push repository to GitHub.
- [ ] Confirm Render can access the GitHub repository.

## Render Setup

- [ ] Create Render Blueprint from `render.yaml`.
- [ ] Confirm `cake-dispensary-api` service is created.
- [ ] Confirm `cake-dispensary-web` static site is created.
- [ ] Confirm backend persistent disk is attached at `/var/data/cake-dispensary`.
- [ ] Add backend environment variables in Render.
- [ ] Add frontend environment variables in Render.
- [ ] Deploy backend service successfully.
- [ ] Deploy frontend static site successfully.
- [ ] Confirm backend health check returns `{"status":"ok"}`.

## Backend Render Environment Variables

- [ ] `NODE_ENV=production`
- [ ] `DATA_DIR=/var/data/cake-dispensary`
- [ ] `FRONTEND_URL=https://cakedispensarynm.com`
- [ ] `FRONTEND_URLS=https://cakedispensarynm.com,https://www.cakedispensarynm.com`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_ADMIN_EMAILS`
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_SECURE=false`
- [ ] `EMAIL_USER=dispensarycake@gmail.com`
- [ ] `EMAIL_PASS` using Gmail App Password
- [ ] `STORE_EMAIL=dispensarycake@gmail.com`
- [ ] `BIOTRACK_API_URL=https://mcp-tracking.nmhealth.org/serverjson.asp`
- [ ] `BIOTRACK_ORDER_API_URL=https://api.nm.trace.biotrackthc.net`
- [ ] `BIOTRACK_LICENSE_NUMBER`
- [ ] `BIOTRACK_FACILITY_KEY`
- [ ] `BIOTRACK_USERNAME`
- [ ] `BIOTRACK_PASSWORD`
- [ ] `BIOTRACK_ORDER_LOCATION`

## Frontend Render Environment Variables

- [ ] `VITE_API_BASE_URL=https://api.cakedispensarynm.com/api`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY`

## Clerk Setup

- [ ] Add `https://cakedispensarynm.com` as a production URL.
- [ ] Add `https://www.cakedispensarynm.com` as a production URL.
- [ ] Confirm staff admin email is included in `CLERK_ADMIN_EMAILS`.
- [ ] Confirm customer sign-in/sign-up works in production.
- [ ] Confirm admin sign-in works in production.

## GoDaddy DNS

- [ ] Add/connect `cakedispensarynm.com` to Render frontend.
- [ ] Add/connect `www.cakedispensarynm.com` to Render frontend.
- [ ] Add/connect `api.cakedispensarynm.com` to Render backend.
- [ ] Update GoDaddy DNS records using Render-provided DNS targets.
- [ ] Wait for DNS propagation.
- [ ] Confirm HTTPS certificates are active in Render.

## Production Smoke Test

- [ ] Open home page on `https://cakedispensarynm.com`.
- [ ] Confirm menu loads live products.
- [ ] Confirm products have med/rec prices where visible.
- [ ] Confirm BioTrack-only spreadsheet-missing items are hidden publicly.
- [ ] Submit a test pickup reservation.
- [ ] Confirm staff receives reservation email.
- [ ] Confirm customer receives reservation received email.
- [ ] Confirm pending order appears in admin notification banner.
- [ ] Confirm staff can confirm the order.
- [ ] Confirm customer receives pickup confirmed email.
- [ ] Confirm staff can mark order completed.
- [ ] Confirm contact form sends staff email.
- [ ] Confirm mobile/tablet/desktop layout on production domain.

## Known Launch Blockers To Clear

- [ ] Gmail SMTP must pass using a Gmail App Password.
- [ ] BioTrack must work from the deployed Render backend.
- [ ] Render custom domains must be connected before final frontend `VITE_API_BASE_URL` is locked to `api.cakedispensarynm.com`.
- [ ] GoDaddy DNS propagation must complete.
