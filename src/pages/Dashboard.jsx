import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import Layout from '../components/layout/Layout'
import Card from '../components/ui/Card'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalExpected: 0,
    thisMonthCollected: 0,
    totalPending: 0
  })
  const [upcomingDues, setUpcomingDues] = useState([])

  useEffect(() => {
    fetchStats()
    fetchUpcomingDues()
  }, [])

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: tenants } = await supabase.from('tenants').select('*').eq('user_id', user.id)
    const { data: payments } = await supabase.from('rent_payments').select('*')
    
    const totalTenants = tenants?.length || 0
    const totalExpected = tenants?.reduce((sum, t) => sum + parseFloat(t.monthly_rent || 0), 0) || 0
    
    const thisMonth = new Date().toISOString().slice(0, 7)
    const thisMonthPayments = payments?.filter(p => p.month?.startsWith(thisMonth) && p.paid_date) || []
    const thisMonthCollected = thisMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    
    const pendingPayments = payments?.filter(p => !p.paid_date) || []
    const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

    setStats({ totalTenants, totalExpected, thisMonthCollected, totalPending })
  }

  const fetchUpcomingDues = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: tenants } = await supabase.from('tenants').select('*').eq('user_id', user.id)
    const { data: payments } = await supabase.from('rent_payments').select('*').is('paid_date', null).order('expected_date', { ascending: true }).limit(5)
    
    const duesWithTenant = payments?.map(p => {
      const tenant = tenants?.find(t => t.id === p.tenant_id)
      return { ...p, tenant }
    }).filter(p => p.tenant) || []
    
    setUpcomingDues(duesWithTenant)
  }

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <p className="text-sm text-gray-600">Total Tenants</p>
            <p className="text-2xl lg:text-3xl font-bold mt-2">{stats.totalTenants}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Monthly Expected</p>
            <p className="text-2xl lg:text-3xl font-bold mt-2">₹{stats.totalExpected}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">This Month Collected</p>
            <p className="text-2xl lg:text-3xl font-bold mt-2 text-green-600">₹{stats.thisMonthCollected}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Total Pending</p>
            <p className="text-2xl lg:text-3xl font-bold mt-2 text-red-600">₹{stats.totalPending}</p>
          </Card>
        </div>
        
        <Card>
          <h2 className="text-lg font-bold mb-4">Upcoming Dues</h2>
          {upcomingDues.length === 0 ? (
            <p className="text-gray-500 text-sm">No pending payments</p>
          ) : (
            <div className="space-y-3">
              {upcomingDues.map(due => (
                <div key={due.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{due.tenant?.full_name}</p>
                    <p className="text-sm text-gray-600">House: {due.tenant?.house_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">₹{due.amount}</p>
                    <p className="text-xs text-gray-500">{new Date(due.expected_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
