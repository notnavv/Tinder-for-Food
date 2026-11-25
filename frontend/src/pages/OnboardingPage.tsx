import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaperPanel, PageHeader, PrimaryButton, SecondaryButton } from '../components/ui'
import { TASTE_PREFERENCES, type TastePreference } from '../lib/appStateContext'
import { useAppState } from '../lib/useAppState'
import { parseAvoidances } from '../lib/preferences'


const ALLERGENS = [
  ['dairy', 'Dairy', '🥛'],
  ['eggs', 'Eggs', '🥚'],
  ['fish', 'Fish', '🐟'],
  ['crustacean_shellfish', 'Crustacean shellfish', '🦐'],
  ['gluten', 'Gluten', '🍞'],
  ['wheat', 'Wheat', '🌾'],
  ['soy', 'Soy', '🫘'],
  ['sesame', 'Sesame', '🫘'],
  ['peanut', 'Peanuts', '🥜'],
  ['tree_nuts', 'Tree nuts', '🌰'],
  ['alcohol', 'Alcohol', '🍷'],
] as const

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { preferences: savedPreferences, avoidances: savedAvoidances, savePreferences } = useAppState()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState<TastePreference[]>(savedPreferences)
  const [avoidances, setAvoidances] = useState(() => parseAvoidances(savedAvoidances))

  useEffect(() => {
    setPreferences(savedPreferences)
    setAvoidances(parseAvoidances(savedAvoidances))
  }, [savedPreferences, savedAvoidances])

  function toggle(option: TastePreference) {
    setPreferences((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option])
  }

  async function continueToDeck() {
    if (step === 2) { navigate('/swipe'); return }
    setPending(true)
    setError(false)
    try {
      await savePreferences(preferences, avoidances.join(', '))
      setStep(2)
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
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
          {TASTE_PREFERENCES.map((option) => <button key={option} className={`preference-chip${preferences.includes(option) ? ' selected' : ''}`} onClick={() => toggle(option)} aria-pressed={preferences.includes(option)}>{option}</button>)}
        </div>
        <fieldset className="allergen-options">
          <legend className="strip-label">Allergens to filter out</legend>
          <div className="preference-grid">
            {ALLERGENS.map(([key, label, icon]) => {
              const selected = avoidances.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  className={`preference-chip allergen-chip${selected ? ' selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => setAvoidances(current => selected ? current.filter(item => item !== key) : [...current, key])}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              )
            })}
          </div>
          <p className="muted-copy">Filters use UCLA’s listed allergens. Check with dining staff about allergies.</p>
        </fieldset>
      </PaperPanel>
      {error && <p className="form-error" role="alert">Could not save your preferences. Please try again.</p>}
      <PrimaryButton className="full-width" disabled={pending} onClick={continueToDeck}>{pending ? 'Saving…' : 'Continue'}</PrimaryButton>
      <SecondaryButton className="full-width" onClick={() => navigate('/')}>I’ll do this later</SecondaryButton>
    </section>
  )
}
