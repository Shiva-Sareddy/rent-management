import { useState, useEffect, useMemo } from "react";
import { supabase } from "../services/supabaseClient";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faMoneyBillWave,
  faCheckCircle,
  faClock,
  faPercentage,
  faCalendarAlt,
  faHome,
  faExclamationTriangle,
  faArrowUp,
  faArrowDown,
  faRupeeSign,
} from "@fortawesome/free-solid-svg-icons";

// Months for selector
const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// Generate years (current year - 2 to current year + 1)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </p>
        <p className="text-green-600 dark:text-green-400">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    paid: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      label: "Paid",
    },
    pending: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-700 dark:text-orange-400",
      label: "Pending",
    },
    overdue: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
      label: "Overdue",
    },
    due_soon: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      label: "Due Soon",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default function Dashboard() {
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [dateRange, setDateRange] = useState("current_month");

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [tenantsRes, paymentsRes] = await Promise.all([
        supabase.from("tenants").select("*").eq("user_id", user.id),
        supabase.from("rent_payments").select("*"),
      ]);

      setTenants(tenantsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Computed values based on filters
  const computedData = useMemo(() => {
    const monthKey = `${selectedYear}-${selectedMonth}`;
    const selectedMonthPayments = payments.filter((p) =>
      p.month?.startsWith(monthKey),
    );
    const selectedMonthDate = new Date(`${selectedYear}-${selectedMonth}-01`);

    // Get all payments for user's tenants
    const tenantIds = new Set(tenants.map((t) => t.id));
    const userPayments = payments.filter((p) => tenantIds.has(p.tenant_id));

    // KPI Calculations
    const totalTenants = tenants.length;
    const expectedRent = tenants.reduce(
      (sum, t) => sum + parseFloat(t.monthly_rent || 0),
      0,
    );
    const collectedThisMonth = selectedMonthPayments
      .filter((p) => p.paid_date)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingAmount = expectedRent - collectedThisMonth;
    const collectionRate =
      expectedRent > 0
        ? Math.round((collectedThisMonth / expectedRent) * 100)
        : 0;

    // Paid vs Pending tenants for selected month
    const paidTenants = [];
    const pendingTenants = [];

    tenants.forEach((tenant) => {
      const payment = selectedMonthPayments.find(
        (p) => p.tenant_id === tenant.id,
      );
      const dueDay = tenant.rent_due_day || 1;
      const currentDay = selectedMonthDate.getDate();
      const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const daysRemaining = dueDay - currentDay;

      if (payment?.paid_date) {
        paidTenants.push({
          ...tenant,
          amountPaid: payment.amount,
          paidDate: payment.paid_date,
          paymentMode: payment.payment_mode,
        });
      } else {
        let status = "pending";
        if (daysRemaining < 0) status = "overdue";
        else if (daysRemaining <= 3) status = "due_soon";

        pendingTenants.push({
          ...tenant,
          dueDay,
          daysRemaining,
          status,
        });
      }
    });

    // Upcoming dues (next 7 days)
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    const upcomingDues = pendingTenants
      .filter(
        (t) => t.dueDay >= today.getDate() && t.dueDay <= next7Days.getDate(),
      )
      .sort((a, b) => a.dueDay - b.dueDay);

    // Monthly collection trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = MONTHS[date.getMonth()].label.slice(0, 3);

      const monthPayments = userPayments.filter(
        (p) => p.month?.startsWith(monthKey) && p.paid_date,
      );
      const total = monthPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount || 0),
        0,
      );

      monthlyTrend.push({
        month: monthLabel,
        amount: total,
        fullMonth: MONTHS[date.getMonth()].label,
        year: date.getFullYear(),
      });
    }

    // Tenant status overview
    const tenantStatus = tenants.map((tenant) => {
      const payment = selectedMonthPayments.find(
        (p) => p.tenant_id === tenant.id,
      );
      const lastPayment = userPayments
        .filter((p) => p.tenant_id === tenant.id && p.paid_date)
        .sort((a, b) => new Date(b.paid_date) - new Date(a.paid_date))[0];

      let status = "pending";
      if (payment?.paid_date) status = "paid";
      else {
        const dueDay = tenant.rent_due_day || 1;
        const currentDay = selectedMonthDate.getDate();
        if (currentDay > dueDay) status = "overdue";
      }

      return {
        ...tenant,
        lastPaymentDate: lastPayment?.paid_date,
        status,
      };
    });

    return {
      totalTenants,
      expectedRent,
      collectedThisMonth,
      pendingAmount,
      collectionRate,
      paidTenants,
      pendingTenants,
      upcomingDues,
      monthlyTrend,
      tenantStatus,
    };
  }, [tenants, payments, selectedMonth, selectedYear]);

  // Handle date range quick filters
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const now = new Date();
    if (range === "current_month") {
      setSelectedMonth(String(now.getMonth() + 1).padStart(2, "0"));
      setSelectedYear(String(now.getFullYear()));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-6 space-y-6 pb-24 lg:pb-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Overview of your rent management
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="!p-5 sm:!p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter:
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDateRangeChange("current_month")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  dateRange === "current_month"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                Current Month
              </button>
              <button
                onClick={() => handleDateRangeChange("last_6_months")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  dateRange === "last_6_months"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                Last 6 Months
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 ml-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field !py-2 !text-sm w-auto">
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="input-field !py-2 !text-sm w-auto">
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Tenants */}
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Total Tenants
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {computedData.totalTenants}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>
          </Card>

          {/* Expected Rent */}
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Expected Rent
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {formatCurrency(computedData.expectedRent)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faMoneyBillWave}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
            </div>
          </Card>

          {/* Collected This Month */}
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Collected
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(computedData.collectedThisMonth)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
            </div>
          </Card>

          {/* Pending Amount */}
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {formatCurrency(computedData.pendingAmount)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faClock}
                  className="text-orange-600 dark:text-orange-400"
                />
              </div>
            </div>
          </Card>

          {/* Collection Rate */}
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Collection Rate
                </p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {computedData.collectionRate}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faPercentage}
                  className="text-indigo-600 dark:text-indigo-400"
                />
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(computedData.collectionRate, 100)}%`,
                  }}></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Paid vs Pending Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paid This Month */}
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Paid This Month
              </h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {computedData.paidTenants.length} Tenants
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {computedData.paidTenants.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                  No payments recorded this month
                </p>
              ) : (
                computedData.paidTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {tenant.full_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <FontAwesomeIcon icon={faHome} className="w-3 h-3" />
                          {tenant.house_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(tenant.amountPaid)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Date(tenant.paidDate).toLocaleDateString(
                            "en-IN",
                          )}
                        </p>
                        {tenant.paymentMode && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {tenant.paymentMode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Pending Payments */}
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Pending Payments
              </h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                {computedData.pendingTenants.length} Tenants
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {computedData.pendingTenants.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                  All payments completed!
                </p>
              ) : (
                computedData.pendingTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className={`p-3 rounded-lg border ${
                      tenant.status === "overdue"
                        ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20"
                        : tenant.status === "due_soon"
                          ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20"
                          : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700"
                    }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {tenant.full_name}
                          </p>
                          <StatusBadge status={tenant.status} />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <FontAwesomeIcon icon={faHome} className="w-3 h-3" />
                          {tenant.house_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(tenant.monthly_rent)}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            tenant.daysRemaining < 0
                              ? "text-red-500"
                              : tenant.daysRemaining <= 3
                                ? "text-yellow-500"
                                : "text-gray-500 dark:text-gray-400"
                          }`}>
                          {tenant.daysRemaining < 0
                            ? `${Math.abs(tenant.daysRemaining)} days overdue`
                            : tenant.daysRemaining === 0
                              ? "Due today"
                              : `${tenant.daysRemaining} days left`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming Dues & Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Due Dates */}
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Upcoming Dues (Next 7 Days)
              </h3>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-yellow-500"
              />
            </div>

            <div className="space-y-3">
              {computedData.upcomingDues.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                  No upcoming dues in the next 7 days
                </p>
              ) : (
                computedData.upcomingDues.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {tenant.full_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FontAwesomeIcon icon={faHome} className="w-3 h-3" />
                        {tenant.house_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(tenant.monthly_rent)}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Due: {tenant.dueDay}
                        {getOrdinalSuffix(tenant.dueDay)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Monthly Collection Trend Chart */}
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Monthly Collection Trend
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last 6 months
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={computedData.monthlyTrend}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {computedData.monthlyTrend.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === computedData.monthlyTrend.length - 1
                            ? "#4F46E5"
                            : "#A5B4FC"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Tenant Status Overview Table */}
        <Card className="!p-5 sm:!p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Tenant Status Overview
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {computedData.tenantStatus.length} total tenants
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Tenant Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                    House
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Monthly Rent
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Due Day
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Last Payment
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {computedData.tenantStatus.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {tenant.full_name}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {tenant.house_number}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(tenant.monthly_rent)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {tenant.rent_due_day || 1}
                      {getOrdinalSuffix(tenant.rent_due_day || 1)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {tenant.lastPaymentDate
                        ? new Date(tenant.lastPaymentDate).toLocaleDateString(
                            "en-IN",
                          )
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tenant.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {computedData.tenantStatus.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
              No tenants found
            </p>
          )}
        </Card>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Paid</p>
                <p className="text-2xl font-bold mt-1">
                  {computedData.paidTenants.length}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faArrowUp}
                className="text-green-200 text-xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Pending</p>
                <p className="text-2xl font-bold mt-1">
                  {
                    computedData.pendingTenants.filter(
                      (t) => t.status === "pending",
                    ).length
                  }
                </p>
              </div>
              <FontAwesomeIcon
                icon={faClock}
                className="text-orange-200 text-xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Overdue</p>
                <p className="text-2xl font-bold mt-1">
                  {
                    computedData.pendingTenants.filter(
                      (t) => t.status === "overdue",
                    ).length
                  }
                </p>
              </div>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-red-200 text-xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Due Soon</p>
                <p className="text-2xl font-bold mt-1">
                  {
                    computedData.pendingTenants.filter(
                      (t) => t.status === "due_soon",
                    ).length
                  }
                </p>
              </div>
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className="text-indigo-200 text-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper function for ordinal suffixes
function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
