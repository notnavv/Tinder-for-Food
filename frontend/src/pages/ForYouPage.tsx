import DishDetails from '../components/DishDetails'
import { matchesPreferences } from '../lib/preferences'
import { useEffect, useState } from 'react'
import { DemoNotice, FoodImage, PageHeader, PaperPanel, Tag } from '../components/ui'
import { useAppState } from '../lib/useAppState'
import { getRecommendations } from '../lib/api'
import type { RecommendationItem } from '../types/contracts'

export default function ForYouPage() {
  const { recordSwipe, likedIds, preferences, avoidances } = useAppState()
  const [items, setItems] = useState<RecommendationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = () => { setLoading(true); setError(null); getRecommendations({ limit: 12 }).then((result) => setItems(result.items)).catch((reason: unknown) => setError(String(reason))).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])
  return <section className="page-wrap"><PageHeader eyebrow="Picked for you" title="For You" description="Sample recommendations filtered by your saved dietary preferences." />{loading ? <p className="loading-mark">Reading your taste…</p> : error ? <div className="centered-state"><p className="form-error">Recommendations are unavailable.</p><button className="primary-button" onClick={load}>Try again</button></div> : <PaperPanel className="recommendation-panel">{!items.some(({ food }) => matchesPreferences(food, preferences, avoidances)) && <p>No dishes match your preferences. Adjust your settings to explore more.</p>}{items.filter(({ food }) => matchesPreferences(food, preferences, avoidances)).map((item) => { const food = item.food; const saved = likedIds.has(food.id); return <article className="recommendation-row" key={food.id}><FoodImage food={food} size="small" /><div className="recommendation-copy"><div className="row-heading"><h2>{food.name.replace(/^Mock /, '')}</h2><span className="match-score">Score {item.score.toFixed(2)}</span></div><p>{item.appearances[0]?.dining_hall_name ?? 'UCLA dining'} · {item.appearances[0]?.station ?? 'Today'}</p><div className="tag-list">{(food.dietary_tags ?? []).slice(0, 2).map((tag) => <Tag key={tag}>{tag}</Tag>)}</div><small>{item.explanation}</small><DishDetails food={food} /></div><button className={`save-button${saved ? ' saved' : ''}`} onClick={() => recordSwipe(food.id, !saved)} aria-label={saved ? `Remove ${food.name} from saved foods` : `Save ${food.name}`}>{saved ? '♥' : '♡'}</button></article> })}</PaperPanel>}<DemoNotice /></section>
}
