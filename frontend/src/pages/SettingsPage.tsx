import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, PaperPanel, PrimaryButton } from '../components/ui'
import { type TastePreference } from '../lib/appStateContext'
import { useAppState } from '../lib/useAppState'

const OPTIONS: TastePreference[] = ['vegetarian', 'vegan', 'high protein', 'halal']

export default function SettingsPage() {
  const { preferences, avoidances, savePreferences } = useAppState()
  const [selected, setSelected] = useState(preferences)
  const [avoid, setAvoid] = useState(avoidances)
  const [saved, setSaved] = useState(false)
  useEffect(() => { setSelected(preferences); setAvoid(avoidances) }, [preferences, avoidances])
  function save() { savePreferences(selected, avoid); setSaved(true); window.setTimeout(() => setSaved(false), 2200) }
  return <section className="page-wrap"><PageHeader eyebrow="Personalize" title="Your settings" description="Tune the defaults behind your deck." /><PaperPanel className="settings-panel"><span className="strip-label">Dietary preferences</span>{OPTIONS.map((option) => <button className="setting-row" key={option} onClick={() => setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option])} aria-pressed={selected.includes(option)}><span>{option}</span><span className={`toggle${selected.includes(option) ? ' on' : ''}`} /></button>)}<label htmlFor="settings-avoid" className="strip-label">Avoidances</label><input id="settings-avoid" className="pill-input" placeholder="Peanuts, dairy" value={avoid} onChange={(event) => setAvoid(event.target.value)} /></PaperPanel><PrimaryButton className="full-width" onClick={save}>{saved ? 'Changes saved ✓' : 'Save changes'}</PrimaryButton><Link className="subtle-link centered-link" to="/profile">Edit profile →</Link></section>
}
