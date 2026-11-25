import { Link } from 'react-router-dom'
import { FoodImage, PaperPanel, SecondaryButton, SectionLabel } from '../components/ui'
import { useAppState } from '../lib/useAppState'
import { enterDemo } from '../lib/supabase'

export default function HomePage() {
  const { foods, isDemo } = useAppState()
  const pick = isDemo ? foods[0] : undefined
  return (
    <section className="welcome-page page-wrap">
      <SectionLabel>UCLA dining swipe</SectionLabel>
      <h1>Good food.<br />Good company.</h1>
      <p className="welcome-copy">Discover what you want to eat, one swipe at a time.</p>
      {pick && <PaperPanel className="today-card"><span className="strip-label">Today’s pick</span><FoodImage food={pick} /><h2>Find your next favorite</h2><p>Swipe to discover a dish you love</p></PaperPanel>}
      <Link className="primary-button button-link full-width" to={isDemo ? "/onboarding" : "/login"}>Get started</Link>
      <Link className="signin-prompt" to="/login">Already have an account? <span>Sign in</span></Link>
      <SecondaryButton className="full-width welcome-demo" onClick={enterDemo}>Explore demo</SecondaryButton>
    </section>
  )
}
