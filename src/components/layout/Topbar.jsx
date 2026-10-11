import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'

const breadcrumbs = {
  '/dashboard': 'Dashboard',
  '/tenants': 'Tenants',
  '/tenants/new': 'Add Tenant',
  '/reports': 'Reports',
}

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  const page = breadcrumbs[location.pathname] || 'Dashboard'

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
  }

  return (
    <header className="sticky top-0 z-20 h-[64px] bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-5 sm:px-6 lg:px-8">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
        >
          <MenuIcon />
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{page}</span>
      </div>

      {/* Right */}
      <div className="flex items-center">
        <div className="switch-wrapper" title="Toggle theme">
          <div className="switch-button-container">
            <input
              className="switch-checkbox"
              type="checkbox"
              checked={theme === 'light'}
              onChange={toggleTheme}
            />
            <div className="switch-button">
              <div className="switch-button-top">
                <svg className="switch-icon on" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44">
                  <path d="M19 3h6v38h-6z"/>
                </svg>
                <svg className="switch-icon off" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44 22C44 34.1503 34.1503 44 22 44C9.84974 44 0 34.1503 0 22C0 9.84974 9.84974 0 22 0C34.1503 0 44 9.84974 44 22ZM5.5 22C5.5 31.1127 12.8873 38.5 22 38.5C31.1127 38.5 38.5 31.1127 38.5 22C38.5 12.8873 31.1127 5.5 22 5.5C12.8873 5.5 5.5 12.8873 5.5 22Z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
