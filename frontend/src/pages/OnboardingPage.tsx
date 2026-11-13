import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaperPanel, PageHeader, PrimaryButton, SecondaryButton } from '../components/ui'
import { type TastePreference } from '../lib/appStateContext'
import { useAppState } from '../lib/useAppState'

const OPTIONS: TastePreference[] = ['vegetarian', 'vegan', 'high protein', 'halal', 'comfort food', 'quick bites']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { preferences: savedPreferences, avoidances: savedAvoidances, savePreferences } = useAppState()
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState<TastePreference[]>(savedPreferences)
  const [avoidances, setAvoidances] = useState(savedAvoidances)

  function toggle(option: TastePreference) {
    setPreferences((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option])
  }

  function continueToDeck() {
    savePreferences(preferences, avoidances)
    if (step === 1) setStep(2)
    else navigate('/swipe')
  }

  if (step === 2) {
    return (
      <section className="page-wrap onboarding-page">
        <button className="back-link" onClick={() => setStep(1)}>← Back</button>
        <PageHeader eyebrow="Step 2 of 2" title={<>Swipe your way<br />to dinner.</>} description="A quick tour before your first deck." />
        <PaperPanel className="how-panel">
          {[
            ['01', 'See a dish', 'Browse food from UCLA dining spots.'],
            ['02', 'Make your pick', 'Swipe right to like, left to pass.'],
            ['03', 'Save favorites', 'Find liked foods when you’re hungry.'],
          ].map(([number, title, copy]) => <div className="how-row" key={number}><span className="step-number">{number}</span><div><h2>{title}</h2><p>{copy}</p></div></div>)}
        </PaperPanel>
        <PrimaryButton className="full-width" onClick={continueToDeck}>Start swiping</PrimaryButton>
      </section>
    )
  }

  return (
    <section className="page-wrap onboarding-page">
      <button className="back-link" onClick={() => setStep(2)}>Skip for now</button>
      <PageHeader eyebrow="Step 1 of 2" title="What sounds good?" description="Choose a few favorites. Change them later." />
      <PaperPanel className="preference-panel">
        <div className="preference-grid">
          {OPTIONS.map((option) => <button key={option} className={`preference-chip${preferences.includes(option) ? ' selected' : ''}`} onClick={() => toggle(option)} aria-pressed={preferences.includes(option)}>{option}</button>)}
        </div>
        <label htmlFor="avoidances" className="strip-label">Anything to avoid?</label>
        <input id="avoidances" className="pill-input" placeholder="e.g. peanuts, dairy" value={avoidances} onChange={(event) => setAvoidances(event.target.value)} />
        <p className="muted-copy">Use commas between avoidances. Filters use listed tags and allergens only; verify ingredients with dining staff. High protein, comfort food, and quick bites are saved as taste preferences for future recommendations.</p>
      </PaperPanel>
      <PrimaryButton className="full-width" onClick={continueToDeck}>Continue</PrimaryButton>
      <SecondaryButton className="full-width" onClick={() => navigate('/')}>I’ll do this later</SecondaryButton>
    </section>
  )
}
