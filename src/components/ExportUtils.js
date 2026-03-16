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
 */
export async function exportToPDF(entries, type = 'daily') {
  // ── Stats (exclude VOID from financials) ────────────────────────────────
  const active = entries.filter((e) => e.status !== 'VOID')
  const grossRevenue     = active.reduce((s, e) => s + e.accountAmount, 0)           // total billed
  const actualCollection = active.reduce((s, e) => s + e.advancePayment + e.collection, 0) // cash in hand
  const totalReceivables = active.reduce((s, e) => s + (e.currentBalance > 0 ? e.currentBalance : 0), 0) // still owed
  const totalCycles      = active.reduce((s, e) => s + e.cycles, 0)

  // Top customer (weekly only, non-void)
  let topCustomerRow = ''
  if (type === 'weekly' && active.length > 0) {
    const totals = {}
    active.forEach((e) => {
      totals[e.customerName] = (totals[e.customerName] || 0) + e.advancePayment + e.collection
    })
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]
    if (top) {
      topCustomerRow = `
        <div style="flex:1;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px;">Top Customer</div>
          <div style="font-size:13px;font-weight:700;color:#374151;">${top[0]}</div>
        </div>`
    }
  }

  // ── Dates ───────────────────────────────────────────────────────────────
  const today = new Date()
  const dateFmt = (d) => d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  const dateString = dateFmt(today)
  let dateRangeString = dateString
  if (type === 'weekly') {
    const lastWeek = new Date(today)
    lastWeek.setDate(today.getDate() - 7)
    dateRangeString = `${lastWeek.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${dateString}`
  }
  const title = type === 'daily' ? 'Daily Report' : 'Weekly Summary'
  const fileName = `CasaDeLab_${type}_${today.toISOString().split('T')[0]}.pdf`

  // ── Table rows ──────────────────────────────────────────────────────────
  const rows = entries.map((e) => {
    const dateStr = new Date(e.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
    const statusColors = {
      CLAIMED: '#1d4ed8',
      PAID:    '#065f46',
      READY:   '#065f46',
      BALANCE: '#92400e',
      UNPAID:  '#991b1b',
    }
    const statusLabel = {
      CLAIMED:'Claimed', PAID:'Paid', READY:'Paid', BALANCE:'Balance', UNPAID:'Unpaid'
    }
    const sColor = statusColors[e.status] || '#9ca3af'
    const sLabel = statusLabel[e.status] || e.status
    const svc   = SERVICE_LABELS[e.category] || e.category
    const balColor = e.currentBalance > 0 ? '#dc2626' : '#059669'
    
    let claimedDateStr = '-'
    if (e.status === 'CLAIMED' && e.claimedAt) {
      // Use a slightly shorter format: Mar 16, 5:20 PM
      claimedDateStr = new Date(e.claimedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }

    return `
      <tr>
        ${type === 'weekly' ? `<td style="padding:4px 8px">${dateStr}</td>` : ''}
        <td style="padding:4px 8px">${e.orNumber}</td>
        <td style="padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px">${e.customerName}</td>
        <td style="padding:4px 8px;text-align:right">${e.weight.toFixed(1)}kg</td>
        <td style="padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${svc}</td>
        <td style="padding:4px 8px;text-align:center">${e.cycles}</td>
        <td style="padding:4px 8px;text-align:right;color:${balColor};font-weight:600">P${e.currentBalance.toFixed(2)}</td>
        <td style="padding:4px 8px;text-align:right">P${e.advancePayment.toFixed(2)}</td>
        <td style="padding:4px 8px;text-align:right">P${e.collection.toFixed(2)}</td>
        <td style="padding:4px 8px;text-align:right;font-size:7px;color:#6b7280;white-space:nowrap">${claimedDateStr}</td>
        <td style="padding:4px 8px;text-align:center;">
          <span style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${sColor};">${sLabel}</span>
        </td>
      </tr>`
  }).join('')

  // ── HTML template ───────────────────────────────────────────────────────
  const html = `
    <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#111827;background:#fff;padding:32px 36px;width:794px;box-sizing:border-box;">
      <!-- Header -->
      <div style="border-bottom:2px solid #06b6d4;padding-bottom:14px;margin-bottom:18px;">
        <div style="font-size:20px;font-weight:700;color:#06b6d4;letter-spacing:-0.02em;margin-bottom:2px;">Casa de Labada</div>
        <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;">${title} &nbsp;/&nbsp; ${dateRangeString}</div>
      </div>

      <!-- Stats: 4 cards -->
      <div style="display:flex;gap:10px;margin-bottom:18px;">
        <div style="flex:1;padding:10px 12px;background:#ecfeff;border:1px solid #a5f3fc;border-radius:6px;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px;">Total Billed</div>
          <div style="font-size:14px;font-weight:700;color:#0891b2;">P${grossRevenue.toFixed(2)}</div>
        </div>
        <div style="flex:1;padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px;">Cash Collected</div>
          <div style="font-size:14px;font-weight:700;color:#1d4ed8;">P${actualCollection.toFixed(2)}</div>
        </div>
        <div style="flex:1;padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px;">Still Owed</div>
          <div style="font-size:14px;font-weight:700;color:#ea580c;">P${totalReceivables.toFixed(2)}</div>
        </div>
        <div style="flex:1;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px;">Service Volume</div>
          <div style="font-size:14px;font-weight:700;color:#374151;">${totalCycles} cycles</div>
        </div>
        ${topCustomerRow}
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#164e63;">
            ${type === 'weekly' ? '<th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:left">Date</th>' : ''}
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:left">OR#</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:left">Customer</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:right">Weight</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:left">Service</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:center">Cycles</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:right">Balance</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:right">Advance Pay</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:right">Collected</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:right">Claimed</th>
            <th style="padding:6px 8px;font-size:7px;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;font-weight:600;text-align:center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <!-- Footer -->
      <div style="margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:7px;color:#9ca3af;">Printed: ${today.toLocaleString('en-PH')}</div>
        <div style="font-size:7px;font-weight:700;color:#06b6d4;letter-spacing:.1em;">CASA DE LABADA v1.0.0</div>
      </div>
    </div>
  `

  // ── Render & download ───────────────────────────────────────────────────
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

    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })

    const pageW  = pdf.internal.pageSize.getWidth()
    const pageH  = pdf.internal.pageSize.getHeight()
    const imgW   = canvas.width  / 2   // ÷2 because scale:2
    const imgH   = canvas.height / 2

    const ratio     = pageW / imgW
    const scaledH   = imgH * ratio

    let yOffset = 0
    let isFirst  = true

    while (yOffset < scaledH) {
      if (!isFirst) pdf.addPage()
      isFirst = false

      // Draw: source slice from canvas, dest = full page width
      const srcY    = (yOffset / ratio) * 2   // back to canvas px (scale:2)
      const srcH    = Math.min((pageH / ratio) * 2, canvas.height - srcY)

      const slice   = document.createElement('canvas')
      slice.width   = canvas.width
      slice.height  = srcH
      slice.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, srcH * ratio / 2)
      yOffset += pageH
    }

    pdf.save(fileName)
  } finally {
    document.body.removeChild(container)
  }
}
