import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader, PaperPanel, PrimaryButton } from '../components/ui'
import { useAppState } from '../lib/useAppState'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { displayName, saveProfile, resetDemo, avoidances } = useAppState()
  const [name, setName] = useState(displayName)
  const [saved, setSaved] = useState(false)
  function save() { saveProfile(name.trim() || 'Food explorer'); setSaved(true); window.setTimeout(() => setSaved(false), 1800) }
  return <section className="page-wrap">
    <PageHeader eyebrow="Personalize" title="Your profile" description="The details behind your food journey." />
    <PaperPanel className="profile-panel">
      <div className="profile-hero"><div className="profile-avatar large">{name.slice(0, 1).toUpperCase()}</div><div><h2>{name || 'Food explorer'}</h2><p>Demo visitor · no account</p></div></div>
      <label htmlFor="profile-name">Name</label><input id="profile-name" className="pill-input" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
      <label htmlFor="profile-email">Email</label><input id="profile-email" className="pill-input" value="Not signed in" disabled />
      <span className="strip-label">Avoidances</span><p className="profile-avoidances">{avoidances || 'Nothing saved yet'}</p>
    </PaperPanel>
    <PrimaryButton className="full-width" onClick={save}>Save profile</PrimaryButton>
    <p role="status">{saved ? 'Profile saved ✓' : ''}</p>
    <Link className="subtle-link centered-link" to="/settings">Open settings →</Link>
    <button className="exit-demo" onClick={() => { resetDemo(); setName('Food explorer'); setSaved(false) }}>Reset demo data</button>
    <button className="exit-demo" onClick={() => navigate('/')}>Exit demo</button>
  </section>
}
