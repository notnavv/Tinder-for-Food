import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, PaperPanel, PrimaryButton } from '../components/ui'
import { canLeaveDemo, leaveDemo, supabase } from '../lib/supabase'
import { useAppState } from '../lib/useAppState'

export default function ProfilePage() {
  const { displayName, email, saveProfile, resetDemo, avoidances, isDemo } = useAppState()
  const [draft, setDraft] = useState<string>()
  const [feedback, setFeedback] = useState<'saving' | 'saved' | 'error'>()
  const name = draft ?? displayName

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('saving')
    try {
      await saveProfile(name.trim() || 'Food explorer')
      setDraft(undefined)
      setFeedback('saved')
    } catch {
      setFeedback('error')
    }
  }

  return (
    <section className="page-wrap account-page">
      <PageHeader eyebrow="Account" title="Your profile" />
      <div className="account-layout">
        <PaperPanel className="account-panel">
          <div className="profile-hero">
            <div className="profile-avatar large" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</div>
            <div><h2>{displayName}</h2><p>{isDemo ? 'Demo profile · saved on this device' : email}</p></div>
          </div>
          <form className="stack-form" onSubmit={save}>
            <label htmlFor="profile-name">Display name</label>
            <input id="profile-name" className="pill-input" maxLength={80} value={name} disabled={feedback === 'saving'} onChange={event => { setDraft(event.target.value); setFeedback(undefined) }} />
            <PrimaryButton disabled={feedback === 'saving' || name.trim() === displayName}>{feedback === 'saving' ? 'Saving…' : 'Save name'}</PrimaryButton>
            {feedback === 'saved' && <p className="form-notice" role="status">Name saved.</p>}
            {feedback === 'error' && <p className="form-error" role="alert">Could not save your name. Try again.</p>}
          </form>
        </PaperPanel>
        <PaperPanel className="account-panel">
          <h2>Dining preferences</h2>
          <p>{avoidances ? `Filtering out ${avoidances.replace(/_/g, ' ')}` : 'No allergens selected for filtering.'}</p>
          <Link className="subtle-link" to="/onboarding">Edit preferences</Link>
        </PaperPanel>
      </div>
      <div className="account-actions">
        {isDemo ? <>
          <button className="back-link" onClick={() => { resetDemo(); setDraft(undefined); setFeedback(undefined) }}>Reset demo data</button>
          {canLeaveDemo && <button className="back-link" onClick={leaveDemo}>Exit demo</button>}
        </> : <button className="back-link" onClick={() => { void supabase?.auth.signOut() }}>Sign out</button>}
      </div>
    </section>
  )
}
