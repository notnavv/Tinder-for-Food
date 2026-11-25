import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { AppStateProvider } from './lib/appState'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import SwipePage from './pages/SwipePage'
import ForYouPage from './pages/ForYouPage'
import FoodDNAPage from './pages/FoodDNAPage'
import LikedFoodsPage from './pages/LikedFoodsPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <AppStateProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/swipe" element={<SwipePage />} />
          <Route path="/for-you" element={<ForYouPage />} />
          <Route path="/dna" element={<FoodDNAPage />} />
          <Route path="/liked" element={<LikedFoodsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </AppShell>
    </AppStateProvider>
  )
}
