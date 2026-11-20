import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { cache } from "../services/dataCache";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import TenantForm from "../components/tenants/TenantForm";
import { generatePaymentPDF } from "../utils/pdfGenerator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    month: "",
    expected_date: "",
    paid_date: "",
    amount: "",
    payment_mode: "Cash",
    remarks: "",
  });

  useEffect(() => {
    fetchTenant();
    fetchPayments();
  }, [id]);

  useEffect(() => {
    if (formData.month && tenant && !editingPayment) {
      const [year, month] = formData.month.split('-')
      const day = tenant.rent_day || 1
      const d = String(day).padStart(2, '0')
      const m = String(parseInt(month)).padStart(2, '0')
      setFormData(prev => ({
        ...prev,
        expected_date: `${year}-${m}-${d}`,
        amount: tenant.monthly_rent,
      }))
    }
  }, [formData.month, tenant])

  const fetchTenant = async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    console.log("Fetched Tenant:", data);
    console.log("Tenant Fetch Error:", error);

    setTenant(data);
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("rent_payments")
      .select("*")
      .eq("tenant_id", id)
      .order("month", { ascending: false });

    console.log("Fetched Payments:", data);
    console.log("Fetch Error:", error);

    setPayments(data || []);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    console.log("Tenant ID:", id);
    console.log("Form Data:", formData);

    const { data, error } = await supabase
      .from("rent_payments")
      .insert([
        {
          tenant_id: id,
          month: `${formData.month}-01`,
          expected_date: formData.expected_date,
          paid_date: formData.paid_date || null,
          amount: Number(formData.amount),
          payment_mode: formData.payment_mode,
          remarks: formData.remarks,
        },
      ])
      .select();

    console.log("Insert Data:", data);
    console.log("Insert Error:", error);

    if (error) {
      alert("Insert failed. Check console.");
      return;
    }

    fetchPayments();
    cache.invalidate('payments')
    setShowPaymentForm(false);
    setFormData({
      month: "",
      expected_date: "",
      paid_date: "",
      amount: "",
      payment_mode: "Cash",
      remarks: "",
    });
  };

  const openEditPayment = (payment) => {
    setEditingPayment(payment);
    setFormData({
      month: payment.month ? payment.month.slice(0, 7) : "",
      expected_date: payment.expected_date,
      paid_date: payment.paid_date || "",
      amount: payment.amount || "",
      payment_mode: payment.payment_mode || "Cash",
      remarks: payment.remarks || "",
    });
    setShowPaymentForm(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();

    if (!formData.month) {
      alert("Month is required.");
      return;
    }
    if (!formData.expected_date) {
      alert("Expected Date is required.");
      return;
    }
    const amount = Number(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      alert("Amount must be a positive number.");
      return;
    }
    if (formData.paid_date && isNaN(new Date(formData.paid_date).getTime())) {
      alert("Paid Date is not valid.");
      return;
    }

    const { error } = await supabase
      .from("rent_payments")
      .update({
        month: `${formData.month}-01`,
        expected_date: formData.expected_date,
        paid_date: formData.paid_date || null,
        amount,
        payment_mode: formData.payment_mode,
        remarks: formData.remarks,
      })
      .eq("id", editingPayment.id);

    if (error) {
      alert("Update failed: " + error.message);
      return;
    }

    fetchPayments();
    cache.invalidate('payments')
    setShowPaymentForm(false);
    setEditingPayment(null);
    setFormData({
      month: "",
      expected_date: "",
      paid_date: "",
      amount: "",
      payment_mode: "Cash",
      remarks: "",
    });
  };

  const handleDeletePayment = async (payment) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    const { error } = await supabase
      .from("rent_payments")
      .delete()
      .eq("id", payment.id);

    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }

    fetchPayments();
    cache.invalidate('payments')
  };

  const handleUpdateTenant = async (updatedData) => {
    const { error } = await supabase
      .from("tenants")
      .update({
        full_name: updatedData.full_name,
        phone: updatedData.phone,
        aadhar_number: updatedData.aadhar_number || null,
        pan_number: updatedData.pan_number || null,
        house_number: updatedData.house_number,
        monthly_rent: Math.round(Number(updatedData.monthly_rent)),
        advance_amount: Math.round(Number(updatedData.advance_amount)) || 0,
        rent_day: updatedData.rent_day ? Math.round(Number(updatedData.rent_day)) : null,
        agreement_start_date: updatedData.agreement_start_date || null,
        rent_due_day: Math.round(Number(updatedData.rent_due_day)) || 0,
        family_details: updatedData.family_details,
      })
      .eq("id", id);

    if (error) {
      alert("Update failed: " + error.message);
      return;
    }

    fetchTenant();
    cache.invalidate('tenants')
    setShowEditForm(false);
  };

  // expected date for a given month = rent_date day applied to that month
  // deadline = expected date + rent_due_day grace days
  const getRentExpected = (year, month) => {
    const day = tenant.rent_day || 1
    const d = String(day).padStart(2, '0')
    const m = String(parseInt(month)).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const addDays = (dateStr, days) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d + days)
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
  }

  const getStatus = (payment) => {
    if (!payment.paid_date) return 'Pending'
    const expectedDate = payment.expected_date?.slice(0, 10)
    if (!expectedDate) return 'Pending'
    const deadline = addDays(expectedDate, tenant.rent_due_day || 0)
    const paidDate = payment.paid_date.slice(0, 10)
    if (paidDate <= expectedDate) return 'On Time'
    if (paidDate <= deadline) return 'Grace Period'
    return 'Late'
  }

  const getStatusColor = (status) => {
    if (status === 'On Time')      return 'text-green-600 bg-green-100 dark:bg-green-900/20'
    if (status === 'Grace Period') return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
    if (status === 'Late')         return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
    return 'text-red-600 bg-red-100 dark:bg-red-900/20'
  }

  const colorFamilies = [
    { bg: 'bg-indigo-600', c1: 'bg-indigo-400', c2: 'bg-violet-400', c3: 'bg-indigo-300', c4: 'bg-violet-500', inner: 'bg-indigo-800/60', shadow: 'shadow-indigo-200 dark:shadow-indigo-900/40', border: 'border-indigo-100 dark:border-indigo-900/50', title: 'text-indigo-600 dark:text-indigo-400' },
    { bg: 'bg-purple-600', c1: 'bg-purple-400', c2: 'bg-fuchsia-400', c3: 'bg-purple-300', c4: 'bg-fuchsia-500', inner: 'bg-purple-800/60', shadow: 'shadow-purple-200 dark:shadow-purple-900/40', border: 'border-purple-100 dark:border-purple-900/50', title: 'text-purple-600 dark:text-purple-400' },
    { bg: 'bg-emerald-600', c1: 'bg-emerald-400', c2: 'bg-teal-400', c3: 'bg-emerald-300', c4: 'bg-teal-500', inner: 'bg-emerald-800/60', shadow: 'shadow-emerald-200 dark:shadow-emerald-900/40', border: 'border-emerald-100 dark:border-emerald-900/50', title: 'text-emerald-600 dark:text-emerald-400' },
    { bg: 'bg-orange-500', c1: 'bg-orange-400', c2: 'bg-amber-400', c3: 'bg-orange-300', c4: 'bg-amber-500', inner: 'bg-orange-800/60', shadow: 'shadow-orange-200 dark:shadow-orange-900/40', border: 'border-orange-100 dark:border-orange-900/50', title: 'text-orange-600 dark:text-orange-400' },
  ]

  if (!tenant)
    return (
      <Layout>
        <div className="py-6">Loading...</div>
      </Layout>
    );

  const color = colorFamilies[tenant.full_name?.charCodeAt(0) % colorFamilies.length] || colorFamilies[0]

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/tenants")}
            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center transition-colors">
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="w-5 h-5 text-gray-700 dark:text-gray-300"
            />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {tenant.full_name}
          </h1>
        </div>

        {/* Tenant Info — press card style */}
        <div className={`relative overflow-hidden rounded-2xl shadow-lg ${color.shadow} border ${color.border} flex flex-col sm:flex-row min-h-[200px]`}>
          <div className={`relative overflow-hidden ${color.bg} sm:w-[200px] shrink-0 flex flex-col items-center justify-center py-8 px-6`}>
            <span className={`absolute rounded-full ${color.c1} opacity-70`} style={{ width: 130, height: 130, top: -35, right: -35, filter: 'blur(1px)' }} />
            <span className={`absolute rounded-full ${color.c2} opacity-60`} style={{ width: 80, height: 80, top: 30, right: 55, filter: 'blur(1px)' }} />
            <span className={`absolute rounded-full ${color.c3} opacity-50`} style={{ width: 45, height: 45, top: 80, right: -10, filter: 'blur(1px)' }} />
            <span className={`absolute rounded-full ${color.c4} opacity-40`} style={{ width: 90, height: 90, bottom: -25, left: -25, filter: 'blur(1px)' }} />
            <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-2xl font-bold mb-3">
              {tenant.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className={`relative z-10 ${color.inner} rounded-xl px-4 py-2 text-center w-full`}>
              <p className="text-white font-bold text-sm leading-tight">{tenant.full_name}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{tenant.house_number}</p>
            </div>
            <span className="relative z-10 mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Active Tenant
            </span>
          </div>

          {/* Right panel */}
          <div className="flex-1 bg-white dark:bg-gray-800 p-6">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${color.title} mb-4`}>Tenant Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
              {[
                { label: 'Phone',          value: tenant.phone || '—' },
                { label: 'Monthly Rent',   value: `₹${tenant.monthly_rent?.toLocaleString() || '—'}` },
                { label: 'Advance',        value: `₹${tenant.advance_amount?.toLocaleString() || '—'}` },
                { label: 'Rent Day',      value: tenant.rent_day ? `${tenant.rent_day}th of every month` : '—' },
                { label: 'Grace Period',   value: tenant.rent_due_day ? `${tenant.rent_due_day} days` : '—' },
                { label: 'Agreement Date', value: tenant.agreement_start_date ? new Date(tenant.agreement_start_date).toLocaleDateString('en-IN') : '—' },
                { label: 'Aadhar No.',     value: tenant.aadhar_number || '—' },
                { label: 'PAN No.',        value: tenant.pan_number || '—' },
                tenant.aadhar_file_url && { label: 'Aadhar File', value: <a href={tenant.aadhar_file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">View File</a> },
                tenant.pan_file_url    && { label: 'PAN File',    value: <a href={tenant.pan_file_url}    target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">View File</a> },
                tenant.family_details  && { label: 'Family',      value: tenant.family_details },
              ].filter(Boolean).map(item => (
                <div key={item.label}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-3 justify-center">
          <Button onClick={() => setShowEditForm(true)}>Edit Tenant</Button>
          <Button
            onClick={() => {
              setEditingPayment(null);
              setFormData({
                month: "",
                expected_date: "",
                paid_date: "",
                amount: "",
                payment_mode: "Cash",
                remarks: "",
              });
              setShowPaymentForm(true);
            }}>
            Add Payment
          </Button>
          <Button
            onClick={() => generatePaymentPDF(tenant, payments)}
            variant="secondary">
            Download Statement
          </Button>
        </div>

        <Card>
          <h2 className="text-lg font-bold mb-4 dark:text-white">Payment History</h2>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                  {['Month','Expected','Paid','Amount','Mode','Status',''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-sm text-gray-400">No payment records</td></tr>
                ) : payments.map((payment, i) => {
                  const status = getStatus(payment)
                  return (
                    <tr key={payment.id} className="border-b border-gray-100 dark:border-gray-700/60 last:border-0 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {new Date(payment.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {payment.expected_date ? (() => { const [y,m,d] = payment.expected_date.slice(0,10).split('-'); return `${d}/${m}/${y}` })() : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {payment.paid_date ? (() => { const [y,m,d] = payment.paid_date.slice(0,10).split('-'); return `${d}/${m}/${y}` })() : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap tabular-nums">
                        ₹{payment.amount?.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {payment.payment_mode}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === 'On Time' ? 'bg-green-500' : status === 'Grace Period' ? 'bg-yellow-400' : status === 'Late' ? 'bg-orange-400' : 'bg-red-500'
                          }`} />
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditPayment(payment)} title="Edit payment" className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button onClick={() => handleDeletePayment(payment)} title="Delete payment" className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal
          isOpen={showPaymentForm}
          onClose={() => setShowPaymentForm(false)}
          title={editingPayment ? "Edit Payment" : "Add Payment"}>
          <form
            onSubmit={editingPayment ? handleUpdatePayment : handleAddPayment}
            className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 ml-1">
                  Month *
                </label>
                <input
                  type="month"
                  required
                  className="input-field"
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({ ...formData, month: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 ml-1">
                  Expected Date
                </label>
                <input
                  type="text"
                  className="input-field bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                  value={
                    formData.expected_date
                      ? (() => { const [y,m,d] = formData.expected_date.slice(0,10).split('-'); return `${d}/${m}/${y}` })()
                      : '-'
                  }
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 ml-1">
                  Paid Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.paid_date}
                  onChange={(e) =>
                    setFormData({ ...formData, paid_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 ml-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    className="input-field pl-7"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder={tenant?.monthly_rent?.toString()}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 ml-1">
                  Payment Mode
                </label>
                <select
                  className="input-field"
                  value={formData.payment_mode}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_mode: e.target.value })
                  }>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 ml-1">
                Remarks
              </label>
              <textarea
                className="input-field"
                rows="2"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="px-4 py-2 text-sm">
                {editingPayment ? "Save Changes" : "Save Payment"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 text-sm">
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          title="Edit Tenant">
          <TenantForm
            tenant={tenant}
            onSubmit={handleUpdateTenant}
            onCancel={() => setShowEditForm(false)}
          />
        </Modal>
      </div>
    </Layout>
  );
}
