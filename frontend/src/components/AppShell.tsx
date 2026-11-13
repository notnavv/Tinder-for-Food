import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAppState } from '../lib/useAppState'
import { enterDemo } from '../lib/supabase'

const NAV = [
  { to: '/swipe', label: 'Deck', icon: '▣' },
  { to: '/for-you', label: 'For you', icon: '✦' },
  { to: '/liked', label: 'Saved', icon: '♡' },
  { to: '/dna', label: 'Food DNA', icon: '◌' },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { isDemo, displayName } = useAppState()
  const minimal = ['/', '/login', '/onboarding'].includes(location.pathname)

  if (!isDemo && !['/', '/login'].includes(location.pathname)) {
    return <main className="app-background"><section className="page-wrap centered-state">
      <h1>Live dining is still being connected</h1>
      <p>Your account session is separate from the demo. Swipe saving, preferences, and profiles currently work in demo mode only.</p>
      <button className="primary-button" onClick={enterDemo}>Explore demo</button>
      <NavLink to="/login">Back to sign in</NavLink>
    </section></main>
  }
  if (minimal) return <div className="app-background">{children}</div>

  return (
    <div className="app-background">
      <div className="app-frame">
        <header className="topbar">
          <NavLink to="/swipe" className="brand-mark" aria-label="Tinder for Food home">TFF<span>·</span></NavLink>
          <div className="topbar-actions">
            {isDemo && <span className="demo-pill">Demo mode</span>}
            <NavLink to="/profile" className="avatar-link" aria-label="Open profile">{displayName.slice(0, 1).toUpperCase()}</NavLink>
          </div>
        </header>
        <main className="app-main">{children}</main>
        <nav className="bottom-nav" aria-label="Main navigation">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
