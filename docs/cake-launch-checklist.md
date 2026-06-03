## Cake Launch Checklist

This checklist covers the remaining work needed to align the Cake site with the combined quote and make launch readiness explicit.

### Fixed In Code

- Contact form now requires `name`, `phone`, `email`, `subject`, and `message`.
- Deals API now respects `startDate` and `endDate` windows when determining whether a promotion is active.
- Deals UI now shows the full run window when both dates are present.

### Still Needs Client-Provided Content

- Staff information for the About page.
- Defined start and end dates for any time-limited deals and promotions.
- Final approved prices for live NM Trace products that do not currently have a reliable price source.
- Optional client-supplied product photos and richer product descriptions where generic placeholders are not acceptable.

### Still Needs Launch QA

- Cross-browser testing in Chrome, Safari, Firefox, and Edge.
- Mobile and tablet device testing.
- Accessibility review against WCAG 2.1 AA.
- Performance audit.
- One real end-to-end pickup creation test in BioTrack.
- Production deployment verification, DNS/go-live verification, and post-launch smoke testing.

### Still Needs Production Configuration

- Clerk publishable/secret keys and final `CLERK_ADMIN_EMAILS` staff allowlist.
- Legacy `ADMIN_PASSWORD` and `JWT_SECRET` only if Clerk is intentionally disabled.
- Final email credentials for transactional messages.
- Production `FRONTEND_URL` and HTTPS-enabled hosting.
