import { useEffect, useState } from 'react'
import { DemoNotice, PageHeader, PaperPanel, Tag } from '../components/ui'
import { getFoodDna } from '../lib/api'
import type { FoodDnaDimension, FoodDnaResponse } from '../types/contracts'

function scoreLabel(score: number) {
  if (score >= 0.55) return 'Love'
  if (score >= 0.15) return 'Like'
  if (score <= -0.35) return 'Skip'
  return 'Neutral'
}

function Dimension({ dimension }: { dimension: FoodDnaDimension }) {
  return <section className="dna-dimension"><div className="dna-dimension-heading"><h2>{dimension.label}</h2><span>{dimension.scores.length} signals</span></div>{dimension.scores.map((score) => { const width = Math.round(Math.abs(score.score) * 100); const positive = score.score >= 0; return <div className={`dna-score${score.n < 3 ? ' low-confidence' : ''}`} key={score.value}><div className="dna-score-label"><strong>{score.value.replace(/_/g, ' ')}</strong><span>{scoreLabel(score.score)} · {score.n} swipes{score.n < 3 ? " · low confidence" : ""}</span></div><div className="score-track"><span className={`score-bar ${positive ? 'positive' : 'negative'}`} style={{ width: `${width}%` }} /></div><span className={`score-number ${positive ? 'positive-text' : 'negative-text'}`}>{score.score > 0 ? '+' : ''}{score.score.toFixed(2)}</span></div> })}</section>
}

export default function FoodDNAPage() {
  const [data, setData] = useState<FoodDnaResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  function loadData() {
    setError(null)
    setData(null)
    getFoodDna().then(setData).catch((reason: unknown) => setError(String(reason)))
  }
  useEffect(() => { loadData() }, [])
  return <section className="page-wrap dna-page"><PageHeader eyebrow="Your taste profile" title="Food DNA" description="Explore taste signals from the returned profile. Demo values are static and do not change with your swipes." />{error ? <div className="centered-state"><p className="form-error">Your Food DNA is unavailable right now.</p><p className="muted-copy">{error}</p><button className="primary-button" onClick={loadData}>Try again</button></div> : !data ? <p className="loading-mark">Decoding your cravings…</p> : data.swipe_count < 5 ? <PaperPanel className="dna-empty"><span className="empty-icon">◌</span><h2>Your profile is still taking shape.</h2><p>Swipe on a few more dishes and we’ll start spotting the patterns in your taste.</p></PaperPanel> : <><PaperPanel className="dna-summary"><div><span className="summary-number">{data.swipe_count}</span><span className="summary-label">swipes analyzed</span></div><div className="summary-copy"><strong>{data.is_mock ? "Example taste profile" : "Your taste profile"}</strong><p>Positive scores show flavors you tend to enjoy. Smaller samples are marked as low confidence.</p></div></PaperPanel><PaperPanel className="dna-panel"><div className="dna-panel-title"><div><span className="strip-label">Your signals</span><h2>What’s in your DNA?</h2></div><Tag tone="coral">{data.is_mock ? 'Sample profile' : 'Live profile'}</Tag></div>{data.dimensions.map((dimension) => <Dimension key={dimension.key} dimension={dimension} />)}</PaperPanel><DemoNotice /></>}</section>
}
