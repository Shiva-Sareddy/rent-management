import jsPDF from 'jspdf'
import 'jspdf-autotable'

const INDIGO   = [79, 70, 229]   // #4F46E5
const INDIGO_L = [238, 242, 255] // #EEF2FF
const GRAY_D   = [31, 41, 55]    // #1F2937
const GRAY_M   = [107, 114, 128] // #6B7280
const GRAY_L   = [243, 244, 246] // #F3F4F6
const WHITE    = [255, 255, 255]
const GREEN    = [22, 163, 74]
const RED      = [220, 38, 38]
const ORANGE   = [234, 88, 12]

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0)

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const getStatus = (p) => {
  if (!p.paid_date) return 'Pending'
  return new Date(p.paid_date) > new Date(p.expected_date) ? 'Late' : 'Paid'
}

export const generatePaymentPDF = (tenant, payments) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 210
  const H = doc.internal.pageSize.getHeight()  // 297

  // ── HEADER BAND ──────────────────────────────────────────────────────────
  doc.setFillColor(...INDIGO)
  doc.rect(0, 0, W, 38, 'F')

  // Logo circle
  doc.setFillColor(255, 255, 255, 0.15)
  doc.setDrawColor(...WHITE)
  doc.setLineWidth(0.5)
  doc.circle(18, 19, 9, 'S')
  doc.setTextColor(...WHITE)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('R', 18, 22.5, { align: 'center' })

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RentManager', 31, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Rent Payment Statement', 31, 23)

  // Statement date top-right
  doc.setFontSize(8)
  doc.text(`Generated: ${fmtDate(new Date())}`, W - 14, 16, { align: 'right' })
  doc.text(`Statement ID: RM-${Date.now().toString().slice(-6)}`, W - 14, 22, { align: 'right' })

  // ── TENANT INFO CARD ─────────────────────────────────────────────────────
  const cardY = 46
  doc.setFillColor(...GRAY_L)
  doc.roundedRect(14, cardY, W - 28, 46, 3, 3, 'F')
  doc.setDrawColor(220, 220, 230)
  doc.setLineWidth(0.3)
  doc.roundedRect(14, cardY, W - 28, 46, 3, 3, 'S')

  // Section label
  doc.setFillColor(...INDIGO)
  doc.roundedRect(14, cardY, 38, 7, 1, 1, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('TENANT DETAILS', 33, cardY + 4.8, { align: 'center' })

  // Info grid — 2 columns
  const infoLeft = [
    ['Full Name',    tenant.full_name || '—'],
    ['House No.',    tenant.house_number || '—'],
    ['Phone',        tenant.phone || '—'],
    ['Monthly Rent', fmt(tenant.monthly_rent)],
  ]
  const infoRight = [
    ['Advance Paid',    fmt(tenant.advance_amount)],
    ['Agreement Start', fmtDate(tenant.agreement_start_date)],
    ['Rent Due Day',    tenant.rent_due_day ? `${tenant.rent_due_day}th of month` : '—'],
    ['Aadhar No.',      tenant.aadhar_number || '—'],
  ]

  const rowH = 7.2
  const startY = cardY + 11

  infoLeft.forEach(([label, val], i) => {
    const y = startY + i * rowH
    doc.setTextColor(...GRAY_M)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text(label, 20, y)
    doc.setTextColor(...GRAY_D)
    doc.setFont('helvetica', 'bold')
    doc.text(String(val), 55, y)
  })

  infoRight.forEach(([label, val], i) => {
    const y = startY + i * rowH
    doc.setTextColor(...GRAY_M)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text(label, 112, y)
    doc.setTextColor(...GRAY_D)
    doc.setFont('helvetica', 'bold')
    doc.text(String(val), 148, y)
  })

  // ── PAYMENT TABLE ─────────────────────────────────────────────────────────
  const tableStartY = cardY + 54

  // Section label
  doc.setFillColor(...INDIGO)
  doc.roundedRect(14, tableStartY, 42, 7, 1, 1, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT HISTORY', 35, tableStartY + 4.8, { align: 'center' })

  const rows = payments.map((p, i) => {
    const status = getStatus(p)
    return [
      String(i + 1),
      fmtDate(p.month),
      fmtDate(p.expected_date),
      fmtDate(p.paid_date),
      fmt(p.amount),
      p.payment_mode || '—',
      p.remarks || '—',
      status,
    ]
  })

  doc.autoTable({
    startY: tableStartY + 9,
    head: [['#', 'Month', 'Expected Date', 'Paid Date', 'Amount', 'Mode', 'Remarks', 'Status']],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: GRAY_D,
      lineColor: [220, 220, 230],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: INDIGO,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 26 },
      3: { cellWidth: 26 },
      4: { halign: 'right', cellWidth: 22 },
      5: { cellWidth: 20 },
      6: { cellWidth: 'auto' },
      7: { halign: 'center', cellWidth: 18 },
    },
    alternateRowStyles: { fillColor: INDIGO_L },
    didParseCell(data) {
      if (data.column.index === 7 && data.section === 'body') {
        const s = data.cell.raw
        if (s === 'Paid')    { data.cell.styles.textColor = GREEN;  data.cell.styles.fontStyle = 'bold' }
        if (s === 'Late')    { data.cell.styles.textColor = ORANGE; data.cell.styles.fontStyle = 'bold' }
        if (s === 'Pending') { data.cell.styles.textColor = RED;    data.cell.styles.fontStyle = 'bold' }
      }
    },
    margin: { left: 14, right: 14 },
  })

  // ── SUMMARY FOOTER CARD ───────────────────────────────────────────────────
  const summaryY = doc.lastAutoTable.finalY + 8
  const totalPaid    = payments.filter(p => p.paid_date).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const totalPending = payments.filter(p => !p.paid_date).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const totalLate    = payments.filter(p => getStatus(p) === 'Late').length
  const paidCount    = payments.filter(p => p.paid_date).length

  // Summary band
  doc.setFillColor(...INDIGO)
  doc.roundedRect(14, summaryY, W - 28, 28, 3, 3, 'F')

  const cols = [
    { label: 'Total Records',   value: String(payments.length) },
    { label: 'Paid',            value: String(paidCount) },
    { label: 'Late Payments',   value: String(totalLate) },
    { label: 'Total Collected', value: fmt(totalPaid) },
    { label: 'Total Pending',   value: fmt(totalPending) },
  ]
  const colW = (W - 28) / cols.length

  cols.forEach((c, i) => {
    const x = 14 + i * colW + colW / 2
    // Divider
    if (i > 0) {
      doc.setDrawColor(255, 255, 255, 0.3)
      doc.setLineWidth(0.3)
      doc.line(14 + i * colW, summaryY + 5, 14 + i * colW, summaryY + 23)
    }
    doc.setTextColor(200, 210, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(c.label.toUpperCase(), x, summaryY + 11, { align: 'center' })
    doc.setTextColor(...WHITE)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(c.value, x, summaryY + 21, { align: 'center' })
  })

  // ── PAGE FOOTER ───────────────────────────────────────────────────────────
  doc.setFillColor(...GRAY_L)
  doc.rect(0, H - 12, W, 12, 'F')
  doc.setTextColor(...GRAY_M)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('This is a system-generated statement. No signature required.', W / 2, H - 5, { align: 'center' })
  doc.text(`RentManager  •  ${fmtDate(new Date())}`, 14, H - 5)
  doc.text('Page 1', W - 14, H - 5, { align: 'right' })

  doc.save(`${tenant.full_name.replace(/\s+/g, '_')}_Statement.pdf`)
}
