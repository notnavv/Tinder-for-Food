import { Navigate, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { useAppState } from '../lib/useAppState'
import { canLeaveDemo, leaveDemo, supabase } from '../lib/supabase'

const NAV = [
  { to: '/swipe', label: 'Deck', icon: '▣' },
  { to: '/for-you', label: 'For you', icon: '✦' },
  { to: '/liked', label: 'Saved', icon: '♡' },
  { to: '/dna', label: 'Food DNA', icon: null },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { isDemo, displayName } = useAppState()
  const minimal = ['/', '/login', '/onboarding'].includes(location.pathname)

  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  useEffect(() => {
    if (isDemo || !supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session))
    })
    return () => subscription.unsubscribe()
  }, [isDemo])

  if (!isDemo && location.pathname !== '/' && location.pathname !== '/login') {
    if (signedIn === null) return <main className="app-background"><p className="loading-mark">Checking sign-in…</p></main>
    if (!signedIn) return <Navigate to="/login" replace />
    if (!['/swipe', '/for-you', '/liked', '/dna', '/onboarding', '/profile'].includes(location.pathname)) return <Navigate to="/swipe" replace />
  }
  if (minimal) return <div className="app-background">{children}</div>

  return (
    <div className="app-background">
      <div className="app-frame">
        <header className="topbar">
          <NavLink to="/swipe" className="brand-mark" aria-label="Tinder for Food home">TFF<span>·</span></NavLink>
          <div className="topbar-actions">
            {isDemo && <span className="demo-pill">Demo mode</span>}
            {canLeaveDemo && <button type="button" className="text-button" onClick={leaveDemo}>Exit demo</button>}
            <NavLink to="/profile" className="avatar-link" aria-label="Open profile">{displayName.slice(0, 1).toUpperCase()}</NavLink>
          </div>
        <nav className="bottom-nav" aria-label="Main navigation">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">{item.icon ?? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M7 3c0 5 10 7 10 12 0 2.5-2.5 4-5 6M17 3c0 5-10 7-10 12 0 2.5 2.5 4 5 6M8 5h8M9 8h6M8 14h8M8 17h8" />
                </svg>
              )}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}
