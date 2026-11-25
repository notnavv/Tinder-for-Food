import { useEffect, useState } from 'react'
import DishDetails from '../components/DishDetails'
import { FoodImage, PageHeader, PaperPanel, Tag } from '../components/ui'
import { getDeck, getRecommendations } from '../lib/api'
import { rankDemoMenu } from '../lib/demoTaste'
import { matchesPreferences } from '../lib/preferences'
import { useAppState } from '../lib/useAppState'
import type { DeckResponse, DiningHallSlug, RecommendationItem } from '../types/contracts'

const HALLS: Record<DiningHallSlug, string> = {
  'bruin-plate': 'Bruin Plate',
  'de-neve': 'De Neve Dining',
  'epicuria-covel': 'Epicuria at Covel',
  'feast-rieber': 'Feast at Rieber',
}

export default function ForYouPage() {
  const { likedIds, preferences, avoidances, isDemo, swipeOpinions, saveFood, removeLiked } = useAppState()
  const [items, setItems] = useState<RecommendationItem[]>([])
  const [menu, setMenu] = useState<DeckResponse>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hall, setHall] = useState<DiningHallSlug | ''>('')
  const [attempt, setAttempt] = useState(0)
  const liveHall = isDemo ? '' : hall
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    const request = isDemo
      ? getDeck(Infinity).then(result => { if (active) setMenu(result) })
      : getRecommendations({ limit: 12, dining_hall: liveHall || undefined })
          .then(result => { if (active) setItems(result.items) })
    request.catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [liveHall, attempt, isDemo])

  const visible = isDemo
    ? rankDemoMenu((menu?.items ?? []).filter(food =>
        (!hall || food.dining_hall_names?.includes(HALLS[hall])) && matchesPreferences(food, preferences, avoidances)
      ), swipeOpinions).slice(0, 12).map(({ food, score }) => ({
        food,
        score,
        location: food.dining_hall_names?.join(' · '),
        explanation: null,
      }))
    : items.filter(({ food }) => matchesPreferences(food, preferences, avoidances)).map(item => ({
        ...item,
        location: [...new Set(item.appearances.map(appearance => appearance.dining_hall_name))].join(' · '),
      }))

  return (
    <section className="page-wrap">
      <PageHeader eyebrow="Picked for you" title="For You" description={isDemo ? 'Your swipes help rank dishes from the upcoming menu.' : 'Recommendations from today’s UCLA dining menus'} />
      <label className="hall-filter"><span>Dining hall</span><select value={hall} onChange={event => setHall(event.target.value as DiningHallSlug | '')}>
        <option value="">All halls</option>
        {Object.entries(HALLS).map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
      </select></label>
      {loading ? <p className="loading-mark">Reading your taste…</p> : error ? (
        <div className="centered-state">
          <p className="form-error">Recommendations are unavailable.</p>
          <button className="primary-button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
        </div>
      ) : (
        <PaperPanel className="recommendation-panel">
          {!visible.length && <div className="empty-state"><h2>No matching dishes</h2><p>Try another dining hall or check your preferences.</p></div>}
          {visible.map(({ food, location, score, explanation }) => {
            const saved = likedIds.has(food.id)
            return (
              <article className="recommendation-row" key={food.id}>
                <FoodImage food={food} size="small" />
                <div className="recommendation-copy">
                  <div className="row-heading">
                    <h2>{food.name.replace(/^Mock /, '')}</h2>
                    {(!isDemo || swipeOpinions.length > 0) && <span className="match-score">Score {score.toFixed(2)}</span>}
                  </div>
                  <p>{location ?? 'UCLA dining'}</p>
                  {Boolean(food.dietary_tags?.length) && <div className="tag-list">{food.dietary_tags?.slice(0, 2).map(tag => <Tag key={tag}>{tag}</Tag>)}</div>}
                  {explanation && explanation !== 'Based on your likes and passes' && <small>{explanation}</small>}
                  <DishDetails food={food} />
                </div>
                {isDemo && <button className={`save-button${saved ? ' saved' : ''}`} onClick={() => saved ? removeLiked(food.id) : saveFood(food)} aria-label={saved ? `Remove ${food.name} from saved foods` : `Save ${food.name}`}>{saved ? '♥' : '♡'}</button>}
              </article>
            )
          })}
        </PaperPanel>
      )}
      {isDemo && menu?.is_mock && <p className="demo-notice">Sample dishes · Ranked using swipes on this device.</p>}
    </section>
  )
}
