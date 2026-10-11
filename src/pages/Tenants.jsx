import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { cache } from '../services/dataCache'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import { motion } from 'framer-motion'

const AVATAR_COLORS = [
  '#2563EB', '#0EA5E9', '#8B5CF6', '#059669',
  '#F97316', '#DC2626', '#6366F1', '#0891B2',
]

const getColor = (name) => AVATAR_COLORS[name?.charCodeAt(0) % AVATAR_COLORS.length] || '#6366F1'
const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0)

const EditIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const FILTERS = ['All', 'Active', 'Inactive']

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sortCol, setSortCol] = useState('full_name')
  const [sortDir, setSortDir] = useState('asc')
  const navigate = useNavigate()

  useEffect(() => { fetchTenants() }, [])

  const fetchTenants = async () => {
    const cached = cache.get('tenants')
    if (cached) { setTenants(cached); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('tenants').select('*').eq('user_id', user.id)
    const tenantData = data || []
    cache.set('tenants', tenantData)
    setTenants(tenantData)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this tenant?')) {
      await supabase.from('tenants').delete().eq('id', id)
      cache.invalidate('tenants', 'payments')
      fetchTenants()
    }
  }

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = tenants
    .filter(t => {
      const q = search.toLowerCase()
      const matchSearch = !q || t.full_name?.toLowerCase().includes(q) || t.phone?.includes(q) || t.house_number?.toLowerCase().includes(q)
      const matchFilter = filter === 'All' || (filter === 'Active' ? t.is_active !== false : t.is_active === false)
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      const av = a[sortCol] ?? '', bv = b[sortCol] ?? ''
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="ml-1 opacity-30 text-[10px]">↕</span>
    return <span className="ml-1 text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const cols = [
    { key: 'full_name', label: 'Tenant' },
    { key: 'house_number', label: 'Unit' },
    { key: 'phone', label: 'Phone' },
    { key: 'monthly_rent', label: 'Monthly Rent' },
    { key: 'rent_due_day', label: 'Due Day' },
  ]

  return (
    <Layout>
      <div className="space-y-5">

        {/* Page header */}
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-gray-900 dark:text-gray-100">Tenants</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all your tenants and their rental details.</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search tenants…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 text-xs font-semibold rounded-full border transition-all whitespace-nowrap ${
                  filter === f
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-500'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Add button */}
          <button
            onClick={() => navigate('/tenants/new')}
            className="ml-auto flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 transition-colors whitespace-nowrap"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Tenant
          </button>
        </div>

        {/* Table card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                  {cols.map(c => (
                    <th
                      key={c.key}
                      onClick={() => handleSort(c.key)}
                      className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 cursor-pointer select-none whitespace-nowrap hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      {c.label}<SortIcon col={c.key} />
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-sm text-gray-400">
                      {search ? 'No tenants match your search.' : 'No tenants yet. Add your first tenant.'}
                    </td>
                  </tr>
                ) : filtered.map((t, i) => {
                  const isActive = t.is_active !== false
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-100 dark:border-gray-700/60 last:border-0 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group"
                    >
                      {/* Tenant name + avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                            style={{ backgroundColor: getColor(t.full_name) }}
                          >
                            {initials(t.full_name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{t.full_name}</p>
                            {t.email && <p className="text-xs text-gray-400 whitespace-nowrap">{t.email}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {t.house_number || '—'}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {t.phone || '—'}
                      </td>

                      {/* Rent */}
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap tabular-nums">
                        {fmt(t.monthly_rent)}
                      </td>

                      {/* Due day */}
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {t.rent_due_day ? `${t.rent_due_day}${['st','nd','rd'][((t.rent_due_day+90)%100-10)%10-1]||'th'} of month` : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          isActive
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/tenants/${t.id}`)}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            aria-label="View tenant"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            aria-label="Delete tenant"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing {filtered.length} of {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => navigate('/tenants/new')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add new tenant
            </button>
          </div>
        </div>

      </div>
    </Layout>
  )
}
