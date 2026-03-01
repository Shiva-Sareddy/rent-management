import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'
import Button from '../ui/Button'
import PaymentTable from '../payments/PaymentTable'
import RentForm from '../payments/RentForm'
import Modal from '../ui/Modal'
import { generatePaymentPDF } from '../../utils/pdfGenerator'

export default function TenantDetails({ tenant }) {
  const [payments, setPayments] = useState([])
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [tenant.id])

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('rent_payments')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('month', { ascending: false })
    setPayments(data || [])
  }

  const handleAddPayment = async (payment) => {
    await supabase.from('rent_payments').insert([{ ...payment, tenant_id: tenant.id }])
    fetchPayments()
    setShowPaymentForm(false)
  }

  const handleExportPDF = () => {
    generatePaymentPDF(tenant, payments)
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-xl lg:text-2xl font-bold mb-4">{tenant.full_name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">House:</span> {tenant.house_number}</div>
          <div><span className="font-medium">Phone:</span> {tenant.phone}</div>
          <div><span className="font-medium">Monthly Rent:</span> ₹{tenant.monthly_rent}</div>
          <div><span className="font-medium">Advance:</span> ₹{tenant.advance_amount}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => setShowPaymentForm(true)}>Add Payment</Button>
        <Button onClick={handleExportPDF} variant="secondary">Export PDF</Button>
      </div>

      <PaymentTable payments={payments} />

      <Modal isOpen={showPaymentForm} onClose={() => setShowPaymentForm(false)} title="Add Payment">
        <RentForm onSubmit={handleAddPayment} onCancel={() => setShowPaymentForm(false)} />
      </Modal>
    </div>
  )
}
