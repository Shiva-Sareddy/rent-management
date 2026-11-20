import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../services/supabaseClient'
import { cache } from '../services/dataCache'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import { motion } from 'framer-motion'

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' },{ value: '12', label: 'December' },
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i)

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0)

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// rent_day = integer 1–31, the fixed day of month rent is due
const getRentExpected = (tenant, year, month) => {
  const day = tenant.rent_day || 1
  const m = String(parseInt(month)).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}
const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}
const getDeadline = (tenant, year, month) => {
  return addDays(getRentExpected(tenant, year, month), tenant.rent_due_day || 0)
}

export default function Dashboard() {
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
    setUserEmail(profile?.username || user?.email?.split('@')[0] || 'there')

    const cachedTenants = cache.get('tenants')
    const cachedPayments = cache.get('payments')

    if (cachedTenants && cachedPayments) {
      setTenants(cachedTenants)
      setPayments(cachedPayments)
      setLoading(false)
      return
    }

    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from('tenants').select('*').eq('user_id', user.id),
      supabase.from('rent_payments').select('*'),
    ])
    const tenantData = t || []
    const paymentData = p || []
    cache.set('tenants', tenantData)
    cache.set('payments', paymentData)
    setTenants(tenantData)
    setPayments(paymentData)
    setLoading(false)
  }

  const data = useMemo(() => {
    const monthKey = `${selectedYear}-${selectedMonth}`
    const monthPayments = payments.filter(p => p.month?.startsWith(monthKey))
    const tenantIds = new Set(tenants.map(t => t.id))

    const expectedRent = tenants.reduce((s, t) => s + parseFloat(t.monthly_rent || 0), 0)
    const collected = monthPayments.filter(p => p.paid_date).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
    const pending = expectedRent - collected
    const rate = expectedRent > 0 ? Math.round((collected / expectedRent) * 100) : 0

    const paidTenants = []
    const pendingTenants = []
    const today = new Date()

    tenants.forEach(tenant => {
      const payment = monthPayments.find(p => p.tenant_id === tenant.id)

      if (payment?.paid_date) {
        const paidDate = payment.paid_date.slice(0, 10)
        const expectedDate = payment.expected_date?.slice(0, 10) || getRentExpected(tenant, selectedYear, selectedMonth)
        const deadline = addDays(expectedDate, tenant.rent_due_day || 0)
        const paidStatus = paidDate <= expectedDate ? 'On Time'
          : paidDate <= deadline ? 'Grace Period'
          : 'Late'
        paidTenants.push({ ...tenant, payment, paidStatus })
      } else {
        const todayStr = today.toISOString().slice(0, 10)
        const deadline = getDeadline(tenant, selectedYear, selectedMonth)
        const isOverdue = todayStr > deadline
        pendingTenants.push({ ...tenant, isOverdue })
      }
    })

    // Last 6 months trend
    const trend = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const total = payments.filter(p => tenantIds.has(p.tenant_id) && p.month?.startsWith(key) && p.paid_date)
        .reduce((s, p) => s + parseFloat(p.amount || 0), 0)
      trend.push({ label: MONTHS[d.getMonth()].label.slice(0, 3), amount: total, isCurrent: i === 0 })
    }
    const maxTrend = Math.max(...trend.map(t => t.amount), 1)

    return { expectedRent, collected, pending, rate, paidTenants, pendingTenants, trend, maxTrend }
  }, [tenants, payments, selectedMonth, selectedYear])

  const monthLabel = `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
  const userName = userEmail || 'there'

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="space-y-6">

        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-[28px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {getGreeting()}, {userName}.
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Here's what's happening with your properties today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="input-field !py-2 !px-4 !text-xs w-auto">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="input-field !py-2 !px-4 !text-xs w-auto">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => navigate('/tenants/new')} className="btn-primary !py-2 !px-5 !text-xs whitespace-nowrap">
              + Add Tenant
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              label: 'Total Tenants', value: tenants.length,
              sub: `${data.paidTenants.length} paid this month`,
              circles: [
                { size: 110, pos: 'top-[-30px] right-[-30px]', color: 'bg-indigo-400' },
                { size: 70,  pos: 'top-[20px] right-[50px]',  color: 'bg-violet-300' },
                { size: 40,  pos: 'top-[60px] right-[-10px]', color: 'bg-indigo-200' },
              ],
              shadow: 'shadow-indigo-200 dark:shadow-indigo-900/40',
            },
            {
              label: 'Expected Rent', value: fmt(data.expectedRent),
              sub: `Due ${monthLabel}`,
              circles: [
                { size: 110, pos: 'top-[-30px] right-[-30px]', color: 'bg-purple-400' },
                { size: 70,  pos: 'top-[20px] right-[50px]',  color: 'bg-fuchsia-300' },
                { size: 40,  pos: 'top-[60px] right-[-10px]', color: 'bg-purple-200' },
              ],
              shadow: 'shadow-purple-200 dark:shadow-purple-900/40',
            },
            {
              label: 'Collected', value: fmt(data.collected),
              sub: `${data.rate}% collection rate`,
              circles: [
                { size: 110, pos: 'top-[-30px] right-[-30px]', color: 'bg-emerald-400' },
                { size: 70,  pos: 'top-[20px] right-[50px]',  color: 'bg-teal-300' },
                { size: 40,  pos: 'top-[60px] right-[-10px]', color: 'bg-green-200' },
              ],
              shadow: 'shadow-emerald-200 dark:shadow-emerald-900/40',
            },
            {
              label: 'Pending', value: fmt(data.pending),
              sub: `${data.pendingTenants.length} tenants pending`,
              circles: [
                { size: 110, pos: 'top-[-30px] right-[-30px]', color: 'bg-orange-400' },
                { size: 70,  pos: 'top-[20px] right-[50px]',  color: 'bg-amber-300' },
                { size: 40,  pos: 'top-[60px] right-[-10px]', color: 'bg-orange-200' },
              ],
              shadow: 'shadow-orange-200 dark:shadow-orange-900/40',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg ${stat.shadow}`}
            >
              {stat.circles.map((c, ci) => (
                <span key={ci} className={`absolute rounded-full opacity-80 ${c.color} ${c.pos}`} style={{ width: c.size, height: c.size, filter: 'blur(1px)' }} />
              ))}
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">{stat.label}</p>
                <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-none">{stat.value}</p>
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Chart + summary */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
          >
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Collection Overview</h2>
            <p className="text-sm text-gray-400 mt-1">Track your rent collection over time.</p>
            <div className="mt-4 mb-3">
              <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{fmt(data.collected)}</p>
              {data.rate > 0 && <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded mt-1 inline-block">+{data.rate}% collected</span>}
            </div>
            <div className="flex items-end gap-3 h-40 mt-5">
              {data.trend.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.amount > 0 ? `₹${Math.round(t.amount / 1000)}k` : ''}
                  </span>
                  <div className="w-full rounded-t transition-all duration-700" style={{ height: `${Math.max((t.amount / data.maxTrend) * 110, t.amount > 0 ? 8 : 4)}px`, backgroundColor: t.isCurrent ? '#635bff' : '#c7d2fe' }} />
                  <span className="text-xs text-gray-400">{t.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
          >
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">This Month</h2>
            <p className="text-sm text-gray-400 mt-1">Payment status breakdown.</p>
            <div className="mt-5">
              <p className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{data.paidTenants.length}</p>
              <span className="text-sm text-gray-400">tenants paid</span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { label: 'On Time',      count: data.paidTenants.filter(t => t.paidStatus === 'On Time').length,      color: 'bg-green-500' },
                { label: 'Grace Period', count: data.paidTenants.filter(t => t.paidStatus === 'Grace Period').length, color: 'bg-yellow-400' },
                { label: 'Late',         count: data.paidTenants.filter(t => t.paidStatus === 'Late').length,         color: 'bg-orange-400' },
                { label: 'Overdue',      count: data.pendingTenants.filter(t => t.isOverdue).length,                  color: 'bg-red-500' },
                { label: 'Pending',      count: data.pendingTenants.filter(t => !t.isOverdue).length,                 color: 'bg-gray-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-gray-100 dark:border-gray-700 pt-4 flex justify-between text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                Paid tenants
              </div>
              <span className="font-semibold text-green-600">
                {tenants.length > 0 ? `${Math.round((data.paidTenants.length / tenants.length) * 100)}%` : '0%'}
              </span>
            </div>
          </motion.div>
        </section>

        {/* Paid / Unpaid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Paid</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{data.paidTenants.length} tenant{data.paidTenants.length !== 1 ? 's' : ''} paid</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">{monthLabel}</span>
            </div>
            <div className="space-y-1">
              {data.paidTenants.length === 0 ? (
                <p className="text-center py-8 text-xs text-gray-400">No payments recorded yet</p>
              ) : data.paidTenants.map(t => {
                const statusStyle = {
                  'On Time':      'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
                  'Grace Period': 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
                  'Late':         'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
                }[t.paidStatus] || ''
                return (
                  <div key={t.id} onClick={() => navigate(`/tenants/${t.id}`)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-600 dark:text-green-400">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{t.full_name}</p>
                      <p className="text-[11px] text-gray-400">{t.house_number}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fmt(t.payment?.amount)}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle}`}>{t.paidStatus}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Unpaid</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{data.pendingTenants.length} tenant{data.pendingTenants.length !== 1 ? 's' : ''} pending</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">{monthLabel}</span>
            </div>
            <div className="space-y-1">
              {data.pendingTenants.length === 0 ? (
                <p className="text-center py-8 text-xs text-gray-500">All tenants have paid!</p>
              ) : data.pendingTenants.map(t => {
                const s = t.isOverdue
                  ? { dot: 'bg-red-500',    badge: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',       label: 'Overdue' }
                  : { dot: 'bg-orange-400', badge: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400', label: 'Pending' }
                return (
                  <div key={t.id} onClick={() => navigate(`/tenants/${t.id}`)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{t.full_name}</p>
                      <p className="text-[11px] text-gray-400">{t.house_number}</p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fmt(t.monthly_rent)}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </section>

      </div>
    </Layout>
  )
}
