import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const generatePaymentPDF = (tenant, payments) => {
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text('Rent Payment Statement', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(`Tenant: ${tenant.full_name}`, 20, 40)
  doc.text(`House No: ${tenant.house_number}`, 20, 48)
  doc.text(`Monthly Rent: ₹${tenant.monthly_rent}`, 20, 56)
  
  const tableData = payments.map(p => [
    new Date(p.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    new Date(p.expected_date).toLocaleDateString('en-IN'),
    p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-IN') : '-',
    `₹${p.amount}`,
    p.paid_date ? (new Date(p.paid_date) > new Date(p.expected_date) ? 'Late' : 'Paid') : 'Pending'
  ])
  
  doc.autoTable({
    startY: 70,
    head: [['Month', 'Expected', 'Paid', 'Amount', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }
  })
  
  const totalPaid = payments.filter(p => p.paid_date).reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const totalPending = payments.filter(p => !p.paid_date).reduce((sum, p) => sum + parseFloat(p.amount), 0)
  
  const finalY = doc.lastAutoTable.finalY + 10
  doc.text(`Total Paid: ₹${totalPaid}`, 20, finalY)
  doc.text(`Total Pending: ₹${totalPending}`, 20, finalY + 8)
  
  doc.save(`${tenant.full_name}_statement.pdf`)
}
