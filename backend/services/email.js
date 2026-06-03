/**
 * Email Notification Service (Nodemailer)
 * Sends alerts to the store when reservations or contact forms come in,
 * and confirmation emails to customers when their reservation is confirmed.
 */

const nodemailer = require('nodemailer')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Create a transporter. Returns null if email isn't configured. */
function createTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('[Email] Not configured — email notifications disabled')
    return null
  }

  return nodemailer.createTransporter({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeHtmlWithBreaks(value) {
  return escapeHtml(value).replace(/\n/g, '<br/>')
}

function normalizeEmailAddress(value) {
  const email = String(value || '').trim().toLowerCase()
  return EMAIL_RE.test(email) ? email : null
}

function safeHeaderText(value, maxLength = 160) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

/** Format a single item line including variant and substitution info */
function formatItemHtml(item, sub) {
  const displayName = item.variant ? `${item.name} (${item.variant})` : item.name
  const safeDisplayName = escapeHtml(displayName)
  if (sub) {
    return `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:14px;">
        <span>
          ${item.qty}× <span style="text-decoration:line-through;color:#9ca3af;">${safeDisplayName}</span>
          <span style="color:#7c3aed;margin-left:6px;">→ ${escapeHtml(sub.substituteWith)}</span>
          ${sub.reason ? `<span style="color:#9ca3af;font-size:12px;"> (${escapeHtml(sub.reason)})</span>` : ''}
        </span>
        <span style="font-weight:bold;">$${(item.price * item.qty).toFixed(2)}</span>
      </div>`
  }
  return `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:14px;">
      <span>${item.qty}× ${safeDisplayName}</span>
      <span style="font-weight:bold;">$${(item.price * item.qty).toFixed(2)}</span>
    </div>`
}

function formatItemText(item, sub) {
  const displayName = item.variant ? `${item.name} (${item.variant})` : item.name
  if (sub) return `  • ${item.qty}x ${displayName} → ${sub.substituteWith}${sub.reason ? ` (${sub.reason})` : ''} — $${(item.price * item.qty).toFixed(2)}`
  return `  • ${item.qty}x ${displayName} — $${(item.price * item.qty).toFixed(2)}`
}

/** Send a reservation alert to the store when a new order comes in */
async function sendReservationAlert(reservation) {
  const transporter = createTransporter()
  if (!transporter) return

  const storeEmail = process.env.STORE_EMAIL || process.env.EMAIL_USER
  const customerEmail = normalizeEmailAddress(reservation.email)
  const substitutions = reservation.substitutions || []

  const itemListText = reservation.items
    .map((i, idx) => formatItemText(i, substitutions.find((s) => s.itemIndex === idx)))
    .join('\n')

  const itemListHtml = reservation.items
    .map((i, idx) => formatItemHtml(i, substitutions.find((s) => s.itemIndex === idx)))
    .join('')

  const total = reservation.items
    .reduce((sum, i) => sum + i.price * i.qty, 0)
    .toFixed(2)

  try {
    // ── Staff alert ──────────────────────────────────────────────────────────
    await transporter.sendMail({
      from:    `"Cake Dispensary Website" <${process.env.EMAIL_USER}>`,
      to:      storeEmail,
      subject: `🎂 New Web Reservation — ${safeHeaderText(reservation.name)} | ${safeHeaderText(reservation.pickupDate, 32)}`,
      text: `
NEW RESERVATION SUBMITTED
─────────────────────────────
Customer: ${reservation.name}
Phone:    ${reservation.phone}
Email:    ${reservation.email}
Pickup:   ${reservation.pickupDate} — ${reservation.pickupTime}
─────────────────────────────
ITEMS:
${itemListText}
─────────────────────────────
Est. Total: $${total}
Submitted:  ${new Date(reservation.createdAt).toLocaleString()}
Reservation ID: ${reservation.id}
─────────────────────────────
Log in to the admin panel to confirm or cancel this reservation.
When confirmed, the order will be pushed to Biotrack as a pending sale.
      `.trim(),
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0e0e10;padding:24px;border-radius:8px 8px 0 0;">
            <h2 style="color:#ff7cf5;margin:0 0 4px;">🎂 New Web Reservation</h2>
            <p style="color:#adaaad;margin:0;font-size:13px;">Submitted via cakedispensarynm.com — awaiting confirmation</p>
          </div>
          <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:120px;">Customer</td><td style="font-weight:bold;">${escapeHtml(reservation.name)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Phone</td><td>${escapeHtml(reservation.phone)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Email</td><td>${escapeHtml(reservation.email)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Pickup Date</td><td style="font-weight:bold;color:#ff7cf5;">${escapeHtml(reservation.pickupDate)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Pickup Time</td><td>${escapeHtml(reservation.pickupTime)}</td></tr>
            </table>
            <h3 style="margin:0 0 12px;font-size:15px;">Reserved Items</h3>
            ${itemListHtml}
            <div style="display:flex;justify-content:space-between;padding:12px 0;font-weight:bold;font-size:16px;">
              <span>Estimated Total</span>
              <span style="color:#ff7cf5;">$${total}</span>
            </div>
            <p style="background:#fef9c3;padding:12px;border-radius:6px;font-size:13px;color:#854d0e;margin-top:8px;">
              ⚠️ No payment collected. Confirm in the admin panel to push this order to Biotrack.
            </p>
            <p style="font-size:12px;color:#9ca3af;margin-top:16px;">Reservation ID: ${reservation.id}</p>
          </div>
        </div>
      `,
    })

    // ── Customer "received" email ─────────────────────────────────────────────
    if (customerEmail) {
      await transporter.sendMail({
        from:    `"Cake Dispensary" <${process.env.EMAIL_USER}>`,
        to:      customerEmail,
        subject: `Your Cake Dispensary Reservation — ${safeHeaderText(reservation.pickupDate, 32)}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#0e0e10;padding:24px;border-radius:8px 8px 0 0;">
              <h2 style="color:#ff7cf5;margin:0;">🎂 Cake Dispensary</h2>
              <p style="color:#adaaad;margin:8px 0 0;">Your reservation has been received!</p>
            </div>
            <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <p>Hi ${escapeHtml(reservation.name)},</p>
              <p>We've received your reservation request for <strong>${escapeHtml(reservation.pickupDate)}</strong> at ${escapeHtml(reservation.pickupTime)}. Our team will review and confirm it shortly — you'll get another email when it's confirmed.</p>
              <div style="background:#f9fafb;padding:16px;border-radius:6px;margin:16px 0;">
                <h3 style="margin:0 0 12px;font-size:15px;">Your Items</h3>
                ${reservation.items.map((i) => {
                  const name = i.variant ? `${i.name} (${i.variant})` : i.name
                  return `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;"><span>${i.qty}× ${escapeHtml(name)}</span><span>$${(i.price * i.qty).toFixed(2)}</span></div>`
                }).join('')}
                <div style="display:flex;justify-content:space-between;padding:8px 0 0;font-weight:bold;"><span>Estimated Total</span><span>$${total}</span></div>
              </div>
              <p style="font-size:13px;color:#6b7280;">No payment is required now — all transactions are handled in-store at pickup. Please bring a valid photo ID (must be 21+).</p>
              <p>Questions? Reply to this email or use the contact form on our website.</p>
              <p>See you soon!<br/>— The Cake Dispensary Team</p>
            </div>
          </div>
        `,
      })
    }

    console.log(`[Email] Reservation alert sent for ${reservation.id}`)
  } catch (err) {
    console.error('[Email] sendReservationAlert failed:', err.message)
  }
}

/**
 * Send a confirmation email to the customer when staff confirm their reservation.
 * Also includes any substitutions made by staff.
 */
async function sendConfirmationEmail(reservation) {
  const transporter = createTransporter()
  if (!transporter) return
  const customerEmail = normalizeEmailAddress(reservation.email)
  if (!customerEmail) return

  const substitutions = reservation.substitutions || []
  const total = reservation.items
    .reduce((sum, i) => sum + i.price * i.qty, 0)
    .toFixed(2)

  const itemListHtml = reservation.items
    .map((i, idx) => formatItemHtml(i, substitutions.find((s) => s.itemIndex === idx)))
    .join('')

  const hasSubstitutions = substitutions.length > 0

  try {
    await transporter.sendMail({
      from:    `"Cake Dispensary" <${process.env.EMAIL_USER}>`,
      to:      customerEmail,
      subject: `✅ Reservation Confirmed — Cake Dispensary ${safeHeaderText(reservation.pickupDate, 32)}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0e0e10;padding:24px;border-radius:8px 8px 0 0;">
            <h2 style="color:#ff7cf5;margin:0;">🎂 Cake Dispensary</h2>
            <p style="color:#adaaad;margin:8px 0 0;">Your reservation is confirmed!</p>
          </div>
          <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin-bottom:20px;">
              <p style="margin:0;font-weight:bold;color:#15803d;">✅ Your order is confirmed and ready for pickup.</p>
            </div>
            <p>Hi ${escapeHtml(reservation.name)},</p>
            <p>Your reservation for <strong>${escapeHtml(reservation.pickupDate)}</strong> at <strong>${escapeHtml(reservation.pickupTime)}</strong> has been confirmed. We'll have everything ready for you.</p>

            ${hasSubstitutions ? `
            <div style="background:#faf5ff;border:1px solid #e9d5ff;padding:12px 16px;border-radius:6px;margin-bottom:16px;font-size:13px;color:#6b21a8;">
              <strong>Note from our staff:</strong> One or more items in your order were substituted due to availability. Updated items are shown below.
            </div>` : ''}

            <div style="background:#f9fafb;padding:16px;border-radius:6px;margin-bottom:16px;">
              <h3 style="margin:0 0 12px;font-size:15px;">Your Items</h3>
              ${itemListHtml}
              <div style="display:flex;justify-content:space-between;padding:12px 0 0;font-weight:bold;font-size:15px;">
                <span>Estimated Total</span>
                <span style="color:#ff7cf5;">$${total}</span>
              </div>
            </div>

            <table style="width:100%;background:#f9fafb;border-radius:6px;padding:16px;margin-bottom:16px;border-collapse:collapse;">
              <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:100px;">Pickup Date</td><td style="font-weight:bold;">${escapeHtml(reservation.pickupDate)}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Pickup Time</td><td>${escapeHtml(reservation.pickupTime)}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Location</td><td>1020 W Maloney Ave, Gallup, NM 87301</td></tr>
            </table>

            <p style="font-size:13px;color:#6b7280;">Remember to bring a valid photo ID — you must be 21+ to enter. No payment required until you're in store.</p>
            <p>Questions? Reply to this email or use the contact form on our website.</p>
            <p>Can't make it? Contact us and we'll take care of it.</p>
            <p>See you soon!<br/>— The Cake Dispensary Team</p>
          </div>
        </div>
      `,
    })
    console.log(`[Email] Confirmation email sent for ${reservation.id}`)
  } catch (err) {
    console.error('[Email] sendConfirmationEmail failed:', err.message)
  }
}

/** Send a contact form submission alert to the store */
async function sendContactAlert(submission) {
  const transporter = createTransporter()
  if (!transporter) return

  const storeEmail = process.env.STORE_EMAIL || process.env.EMAIL_USER
  const replyTo = normalizeEmailAddress(submission.email) || undefined

  try {
    await transporter.sendMail({
      from:    `"Cake Dispensary Website" <${process.env.EMAIL_USER}>`,
      to:      storeEmail,
      replyTo,
      subject: `📬 New Contact Message — ${safeHeaderText(submission.subject)} (${safeHeaderText(submission.name)})`,
      text: `
NEW CONTACT FORM SUBMISSION
─────────────────────────────
Name:    ${submission.name}
Email:   ${submission.email}
Phone:   ${submission.phone || 'N/A'}
Subject: ${submission.subject}
─────────────────────────────
Message:
${submission.message}
─────────────────────────────
Submitted: ${new Date(submission.createdAt).toLocaleString()}
      `.trim(),
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0e0e10;padding:24px;border-radius:8px 8px 0 0;">
            <h2 style="color:#00eefc;margin:0;">📬 New Contact Message</h2>
          </div>
          <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <table style="width:100%;margin-bottom:20px;">
              <tr><td style="color:#6b7280;width:80px;padding:4px 0;font-size:14px;">Name</td><td style="font-weight:bold;">${escapeHtml(submission.name)}</td></tr>
              <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Email</td><td>${replyTo ? `<a href="mailto:${escapeHtml(replyTo)}">${escapeHtml(replyTo)}</a>` : escapeHtml(submission.email)}</td></tr>
              <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Phone</td><td>${escapeHtml(submission.phone || 'N/A')}</td></tr>
              <tr><td style="color:#6b7280;padding:4px 0;font-size:14px;">Subject</td><td style="font-weight:bold;">${escapeHtml(submission.subject)}</td></tr>
            </table>
            <div style="background:#f9fafb;padding:16px;border-radius:6px;">
              <h3 style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Message</h3>
              <p style="margin:0;line-height:1.6;">${escapeHtmlWithBreaks(submission.message)}</p>
            </div>
            <p style="font-size:12px;color:#9ca3af;margin-top:16px;">Reply to this email to respond directly to ${escapeHtml(submission.name)}.</p>
          </div>
        </div>
      `,
    })
    console.log(`[Email] Contact alert sent for ${submission.id}`)
  } catch (err) {
    console.error('[Email] sendContactAlert failed:', err.message)
  }
}

module.exports = { sendReservationAlert, sendConfirmationEmail, sendContactAlert }
