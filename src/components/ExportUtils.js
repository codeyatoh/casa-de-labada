import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const SERVICE_LABELS = {
  RC: 'Regular Clothes',
  HI: 'Household Items',
  C: 'Comforter',
}

/**
 * Generate and auto-download a PDF report.
 * Uses jsPDF + html2canvas — no print dialog, no browser UI headers.
 *
 * `entries` is already filtered to the target date/range by the caller.
 * All stats are computed from this exact filtered list for 100% accuracy.
 */
export async function exportToPDF(entries, type = 'daily', selectedDate = null, allTimeUnpaid = 0) {
  // ── Stats (exclude VOID from financials, compute from filtered list) ─────
  const active = entries.filter((e) => e.status !== 'VOID')

  // Helper: convert ISO string to local YYYY-MM-DD
  const toDS = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
  }

  // Determine the target date string and range for weekly
  const targetDateStr = selectedDate || toDS(new Date().toISOString())
  let startDateStr = targetDateStr
  if (type === 'weekly') {
    const d = new Date(targetDateStr)
    d.setDate(d.getDate() - 7)
    startDateStr = toDS(d.toISOString())
  }

  const inRange = (ds) => ds >= startDateStr && ds <= targetDateStr

  // 1. Total Billed: Gross for all rows shown (placed in range)
  const grossRevenue = active
    .filter((e) => inRange(e.dateString))
    .reduce((s, e) => s + e.accountAmount, 0)

  // 2. Loads: Cycles for orders placed in range
  const totalCycles = active
    .filter((e) => inRange(e.dateString))
    .reduce((s, e) => s + e.cycles, 0)

  // 3. Cash Received: ONLY cash actually received ON the target date/range
  //    Payment date priority:
  //    a) claimedAt  → for CLAIMED orders (paid when picked up)
  //    b) paidAt     → explicit payment timestamp (if stored)
  //    c) dateString → if order was placed IN range and status PAID (same-day settlement)
  //    d) updatedAt  → for cross-day settlements on old orders
  const actualCollection = active.reduce((s, e) => {
    const advancePart = inRange(e.dateString) ? e.advancePayment : 0

    let payDateStr = ''
    if (e.claimedAt) {
      payDateStr = toDS(e.claimedAt)       // (a) claimed = paid on claim day
    } else if (e.paidAt) {
      payDateStr = toDS(e.paidAt)           // (b) explicit paidAt field
    } else if (inRange(e.dateString)) {
      payDateStr = e.dateString             // (c) placed & settled same day
    } else if (e.updatedAt) {
      payDateStr = toDS(e.updatedAt)        // (d) cross-day payment via settle
    }

    const collectedPart = (e.collection > 0 && inRange(payDateStr)) ? e.collection : 0
    return s + advancePart + collectedPart
  }, 0)

  // 4. System Total Unpaid is passed directly via allTimeUnpaid param

  // ── Dates ────────────────────────────────────────────────────────────────
  const targetDate = selectedDate ? new Date(selectedDate) : new Date()
  const dateFmt = (d) => d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  const dateString = dateFmt(targetDate)
  let dateRangeString = dateString
  if (type === 'weekly') {
    const lastWeek = new Date(targetDate)
    lastWeek.setDate(targetDate.getDate() - 7)
    dateRangeString = `${lastWeek.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${dateString}`
  }
  const title = type === 'daily' ? 'Daily Report' : 'Weekly Summary'
  const dateIdentifier = targetDate.toISOString().split('T')[0]
  const fileName = `CasaDeLab_${type}_${dateIdentifier}.pdf`

  // ── Dynamic stat labels based on report type ─────────────────────────────
  const suffix = type === 'daily' ? 'For Today' : 'This Week'
  const billedTitle = `Total Billed ${suffix}`
  const cashTitle   = `Cash Received ${suffix}`
  const loadsTitle  = `Loads ${suffix}`
  const unpaidTitle = 'Total Unpaid (All-Time)'

  const billedDesc = type === 'daily' ? 'Gross billed today'         : 'Gross billed this week'
  const cashDesc   = type === 'daily' ? 'Cash collected today'       : 'Cash collected this week'
  const loadsDesc  = type === 'daily' ? 'Wash/dry cycles today'      : 'Wash/dry cycles this week'

  // ── Table rows ───────────────────────────────────────────────────────────
  const cardWidth = 'calc(25% - 7.5px)'

  const rows = entries.map((e) => {
    const placedStr  = new Date(e.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    const placedTime = new Date(e.createdAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
    const claimedStr = e.claimedAt
      ? new Date(e.claimedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) + ' ' +
        new Date(e.claimedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
      : '—'
    const isVoid = e.status === 'VOID'

    const statusColors = {
      CLAIMED: '#1d4ed8',
      PAID:    '#065f46',
      READY:   '#065f46',
      BALANCE: '#92400e',
      UNPAID:  '#991b1b',
      VOID:    '#9ca3af',
    }
    const statusLabel = {
      CLAIMED: 'Claimed', PAID: 'Paid', READY: 'Paid',
      BALANCE: 'Balance', UNPAID: 'Unpaid', VOID: 'Void',
    }
    const sColor   = statusColors[e.status] || '#9ca3af'
    const sLabel   = statusLabel[e.status] || e.status
    const svc      = SERVICE_LABELS[e.category] || e.category
    const balColor = isVoid ? '#9ca3af' : (e.currentBalance > 0 ? '#dc2626' : '#059669')
    const rowStyle = isVoid ? 'opacity:0.5;text-decoration:line-through;color:#6b7280;' : ''

    return `
      <tr style="${rowStyle}">
        ${type === 'weekly' ? `<td style="padding:4px 6px;font-size:8px;white-space:nowrap">${placedStr}</td>` : ''}
        <td style="padding:4px 8px">${e.orNumber}</td>
        <td style="padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px">${e.customerName}</td>
        <td style="padding:4px 6px;font-size:8px;white-space:nowrap">
          <div style="color:#374151">${placedStr}</div>
          <div style="color:#6b7280;font-size:7px">${placedTime}</div>
          ${e.status === 'CLAIMED' && e.claimedAt ? `<div style="color:#1d4ed8;font-size:7px;margin-top:1px">↩ ${claimedStr}</div>` : ''}
        </td>
        <td style="padding:4px 8px;text-align:right">${e.weight.toFixed(1)}kg</td>
        <td style="padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px">${svc}</td>
        <td style="padding:4px 8px;text-align:center">${e.cycles}</td>
        <td style="padding:4px 8px;text-align:right;color:${balColor};font-weight:600">₱${isVoid ? '0.00' : e.currentBalance.toFixed(2)}</td>
        <td style="padding:4px 8px;text-align:right">₱${e.advancePayment.toFixed(2)}</td>
        <td style="padding:4px 8px;text-align:right">₱${e.collection.toFixed(2)}</td>
        <td style="padding:4px 8px;text-align:center;">
          <span style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${sColor};">${sLabel}</span>
        </td>
      </tr>`
  }).join('')

  // ── HTML template ─────────────────────────────────────────────────────────
  const html = `
    <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#111827;background:#fff;padding:32px 36px;width:794px;box-sizing:border-box;">
      <!-- Header -->
      <div style="border-bottom:2px solid #059669;padding-bottom:14px;margin-bottom:18px;">
        <div style="font-size:20px;font-weight:700;color:#059669;letter-spacing:-0.02em;margin-bottom:2px;">Casa de Labada</div>
        <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;">${title} &nbsp;/&nbsp; ${dateRangeString}</div>
      </div>

      <!-- Stats: 4 Cards Grid -->
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px;">
        <div style="width:${cardWidth};padding:10px 12px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;box-sizing:border-box;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px;">${billedTitle}</div>
          <div style="font-size:14px;font-weight:700;color:#065f46;">₱${grossRevenue.toFixed(2)}</div>
          <div style="font-size:6.5px;color:#9ca3af;margin-top:2px;">${billedDesc}</div>
        </div>

        <div style="width:${cardWidth};padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;box-sizing:border-box;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px;">${cashTitle}</div>
          <div style="font-size:14px;font-weight:700;color:#1d4ed8;">₱${actualCollection.toFixed(2)}</div>
          <div style="font-size:6.5px;color:#9ca3af;margin-top:2px;">${cashDesc}</div>
        </div>

        <div style="width:${cardWidth};padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;box-sizing:border-box;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px;">${loadsTitle}</div>
          <div style="font-size:14px;font-weight:700;color:#374151;">${totalCycles} cycles</div>
          <div style="font-size:6.5px;color:#9ca3af;margin-top:2px;">${loadsDesc}</div>
        </div>

        <div style="width:${cardWidth};padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;box-sizing:border-box;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px;">${unpaidTitle}</div>
          <div style="font-size:14px;font-weight:700;color:#ea580c;">₱${allTimeUnpaid.toFixed(2)}</div>
          <div style="font-size:6.5px;color:#9ca3af;margin-top:2px;">All-time system unpaid balance</div>
        </div>
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#065f46;">
            ${type === 'weekly' ? '<th style="padding:6px 6px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:left">Date</th>' : ''}
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:left">OR#</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:left">Customer</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:left">Placed / Claimed</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:right">Weight</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:left">Service</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:center">Cycles</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:right">Balance</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:right">Advance Pay</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:right">Collected</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#d1fae5;font-weight:600;text-align:center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <!-- Footer -->
      <div style="margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:7px;color:#9ca3af;">Printed: ${(new Date()).toLocaleString('en-PH')}</div>
        <div style="font-size:7px;font-weight:700;color:#059669;letter-spacing:.1em;">CASA DE LABADA v1.0.0</div>
      </div>
    </div>
  `

  // ── Render & download ─────────────────────────────────────────────────────
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;top:-10000px;left:-10000px;z-index:-1;'
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const pdf   = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgW  = canvas.width  / 2
    const imgH  = canvas.height / 2

    const ratio   = pageW / imgW
    const scaledH = imgH * ratio

    let yOffset = 0
    let isFirst = true

    while (yOffset < scaledH) {
      if (!isFirst) pdf.addPage()
      isFirst = false

      const srcY  = (yOffset / ratio) * 2
      const srcH  = Math.min((pageH / ratio) * 2, canvas.height - srcY)

      const slice = document.createElement('canvas')
      slice.width  = canvas.width
      slice.height = srcH
      slice.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, srcH * ratio / 2)
      yOffset += pageH
    }

    pdf.save(fileName)
  } finally {
    document.body.removeChild(container)
  }
}
