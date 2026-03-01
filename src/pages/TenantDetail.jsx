import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { generatePaymentPDF } from "../utils/pdfGenerator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faMinusSquare,
  faPlusSquare,
} from "@fortawesome/free-solid-svg-icons";

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [minimizeTenantInfo, setMinimizeTenantInfo] = useState(false);
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

  // Auto-populate Expected Date and Amount when month is selected
  useEffect(() => {
    if (formData.month && tenant) {
      const [year, month] = formData.month.split("-");
      const dueDay = tenant.rent_due_day || 1;
      const expectedDate = new Date(year, parseInt(month) - 1, dueDay);
      const expectedDateStr = expectedDate.toISOString().split("T")[0];

      setFormData((prev) => ({
        ...prev,
        expected_date: expectedDateStr,
        amount: tenant.monthly_rent,
      }));
    }
  }, [formData.month, tenant]);

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

  const getStatus = (payment) => {
    if (!payment.paid_date) return "Pending";
    return new Date(payment.paid_date) > new Date(payment.expected_date)
      ? "Late"
      : "Paid";
  };

  const getStatusColor = (status) => {
    if (status === "Paid") return "text-green-600 bg-green-100";
    if (status === "Late") return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  if (!tenant)
    return (
      <Layout>
        <div className="py-6">Loading...</div>
      </Layout>
    );

  // Tenant info rows
  const tenantInfo = [
    { label: "Name", value: tenant.full_name },
    { label: "House No", value: tenant.house_number },
    { label: "Phone", value: tenant.phone || "-" },
    {
      label: "Monthly Rent",
      value: `₹${tenant.monthly_rent?.toLocaleString() || "-"}`,
    },
    {
      label: "Advance",
      value: `₹${tenant.advance_amount?.toLocaleString() || "-"}`,
    },
    {
      label: "Agreement Date",
      value: tenant.agreement_start_date
        ? new Date(tenant.agreement_start_date).toLocaleDateString("en-IN")
        : "-",
    },
    { label: "Rent Due Day", value: tenant.rent_due_day || "-" },
    { label: "Aadhar Number", value: tenant.aadhar_number || "-" },
    {
      label: "Aadhar File",
      value: tenant.aadhar_file_url ? (
        <a
          href={tenant.aadhar_file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline">
          View File
        </a>
      ) : (
        "-"
      ),
    },
    { label: "PAN Number", value: tenant.pan_number || "-" },
    {
      label: "PAN File",
      value: tenant.pan_file_url ? (
        <a
          href={tenant.pan_file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline">
          View File
        </a>
      ) : (
        "-"
      ),
    },
  ];

  return (
    <Layout>
      <div className="py-14 px-4 sm:px-6 space-y-6">
        {/* Header with back button */}
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

        {/* Tenant Information - Card style for mobile, table for desktop */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold dark:text-white">
              Tenant Information
            </h2>
            <button
              onClick={() => setMinimizeTenantInfo(!minimizeTenantInfo)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <FontAwesomeIcon
                icon={minimizeTenantInfo ? faPlusSquare : faMinusSquare}
                className="w-5 h-5"
              />
            </button>
          </div>

          {!minimizeTenantInfo && (
            <>
              {/* Desktop - Table style */}
              <div className="hidden sm:block overflow-x-auto hide-scrollbar">
                <table className="w-full">
                  <tbody>
                    {tenantInfo.map((item, index) => (
                      <tr
                        key={item.label}
                        className={
                          index % 2 === 0
                            ? "bg-gray-100 dark:bg-gray-700/50"
                            : "bg-white dark:bg-gray-800"
                        }>
                        <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300 w-40">
                          {item.label}
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 dark:text-gray-100">
                          {item.value}
                        </td>
                      </tr>
                    ))}
                    {tenant.family_details && (
                      <tr className="bg-gray-100 dark:bg-gray-700/50">
                        <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">
                          Family Details
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                          {tenant.family_details}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile - Card style */}
              <div className="sm:hidden space-y-3">
                {tenantInfo.map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {item.value}
                    </span>
                  </div>
                ))}
                {tenant.family_details && (
                  <div className="flex flex-col p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                    <span className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Family Details
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {tenant.family_details}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>

        <div className="flex flex-row gap-3 justify-center">
          <Button onClick={() => setShowPaymentForm(true)}>Add Payment</Button>
          <Button
            onClick={() => generatePaymentPDF(tenant, payments)}
            variant="secondary">
            Download Statement
          </Button>
        </div>

        {/* Payment History - Table design for all screen sizes */}
        <Card>
          <h2 className="text-lg font-bold mb-4 dark:text-white">
            Payment History
          </h2>

          {/* Table - Works on all screen sizes with horizontal scroll */}
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[600px]">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="py-3 px-3 text-left text-xs sm:text-sm font-medium">
                    Month
                  </th>
                  <th className="py-3 px-3 text-left text-xs sm:text-sm font-medium">
                    Expected
                  </th>
                  <th className="py-3 px-3 text-left text-xs sm:text-sm font-medium">
                    Paid
                  </th>
                  <th className="py-3 px-3 text-left text-xs sm:text-sm font-medium">
                    Amount
                  </th>
                  <th className="py-3 px-3 text-left text-xs sm:text-sm font-medium">
                    Mode
                  </th>
                  <th className="py-3 px-3 text-left text-xs sm:text-sm font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => {
                  const status = getStatus(payment);
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {new Date(payment.month).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2 px-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(payment.expected_date).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>
                      <td className="py-2 px-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {payment.paid_date
                          ? new Date(payment.paid_date).toLocaleDateString(
                              "en-IN",
                            )
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        ₹{payment.amount?.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {payment.payment_mode}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              No payment records
            </p>
          )}
        </Card>

        <Modal
          isOpen={showPaymentForm}
          onClose={() => setShowPaymentForm(false)}
          title="Add Payment">
          <form onSubmit={handleAddPayment} className="space-y-4">
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
                      ? new Date(formData.expected_date).toLocaleDateString(
                          "en-IN",
                        )
                      : "-"
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
                Save Payment
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
      </div>
    </Layout>
  );
}
