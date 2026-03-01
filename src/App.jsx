import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './services/supabaseClient'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tenants from './pages/Tenants'
import AddTenant from './pages/AddTenant'
import TenantDetail from './pages/TenantDetail'
import Reports from './pages/Reports'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/tenants" element={session ? <Tenants /> : <Navigate to="/login" />} />
        <Route path="/tenants/new" element={session ? <AddTenant /> : <Navigate to="/login" />} />
        <Route path="/tenants/:id" element={session ? <TenantDetail /> : <Navigate to="/login" />} />
        <Route path="/reports" element={session ? <Reports /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
