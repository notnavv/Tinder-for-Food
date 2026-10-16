import { NavLink, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Placeholder from './pages/Placeholder'

const NAV = [
  { to: '/swipe', label: 'Swipe' },
  { to: '/for-you', label: 'For You' },
  { to: '/dna', label: 'Food DNA' },
]

export default function App() {
  return (
    <div className="min-h-dvh pb-16">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={<Placeholder title="Sign in" area="Frontend" todo={['Email sign-in with supabase.auth (src/lib/supabase.ts)', 'Redirect to /onboarding if profile.onboarding_completed_at is null']} />}
        />
        <Route
          path="/onboarding"
          element={<Placeholder title="Onboarding" area="Frontend + design" todo={['Save dietary_restrictions + onboarding_cuisines to profiles', 'Set onboarding_completed_at']} />}
        />
        <Route
          path="/swipe"
          element={<Placeholder title="Swipe" area="Frontend + design" todo={['Load cards with getDeck() from src/lib/api.ts', 'Insert a NewSwipeEvent into swipe_events on each swipe', 'Design for image_url === null']} />}
        />
        <Route
          path="/for-you"
          element={<Placeholder title="For You" area="Frontend" todo={['getRecommendations({ dining_hall, meal_period })', 'Dining hall filter (4 residential halls)']} />}
        />
        <Route
          path="/dna"
          element={<Placeholder title="Food DNA" area="Design + ML" todo={['getFoodDna()', 'Visualize scores; dim low-n values']} />}
        />
        <Route path="*" element={<Placeholder title="Not found" area="—" todo={[]} />} />
      </Routes>

      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t bg-white py-3 text-sm">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'font-bold text-brand' : 'text-gray-500')}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
