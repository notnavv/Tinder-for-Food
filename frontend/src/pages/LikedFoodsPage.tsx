import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DishDetails from '../components/DishDetails'
import { FoodImage, PageHeader, PaperPanel } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useAppState } from '../lib/useAppState'
import type { Food } from '../types/contracts'

async function loadSavedFoods(): Promise<Food[]> {
  if (!supabase) throw new Error('Supabase is unavailable.')
  const foods: Food[] = []
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.from('user_food_preferences')
      .select('food_id').eq('liked', true)
      .order('decided_at', { ascending: false }).order('food_id').range(offset, offset + 99)
    if (error) throw error
    const ids = (data ?? []).map(row => row.food_id as string)
    if (!ids.length) break
    const result = await supabase.from('foods_with_photo').select('*').in('id', ids)
    if (result.error) throw result.error
    const byId = new Map((result.data ?? []).map(row => [row.id, row as Food]))
    foods.push(...ids.flatMap(id => byId.get(id) ?? []))
    if (ids.length < 100) break
  }
  return foods
}

export default function LikedFoodsPage() {
  const { isDemo, likedFoods, removeLiked, recordSwipe } = useAppState()
  const [liveFoods, setLiveFoods] = useState<Food[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState(false)
  useEffect(() => {
    if (isDemo) return
    let active = true
    setLoadError(false)
    loadSavedFoods().then(foods => { if (active) setLiveFoods(foods) })
      .catch(() => { if (active) setLoadError(true) })
    return () => { active = false }
  }, [isDemo, attempt])

  async function remove(food: Food) {
    if (isDemo) { removeLiked(food.id); return }
    if (!supabase || pending) return
    setPending(true)
    setSaveError(false)
    try {
      const { error } = await supabase.from('swipe_events').insert({ food_id: food.id, liked: false, source: 'deck' })
      if (error) throw error
      recordSwipe(food.id, false)
      setLiveFoods(current => current?.filter(item => item.id !== food.id) ?? null)
    } catch {
      setSaveError(true)
    } finally {
      setPending(false)
    }
  }

  const foods = isDemo ? likedFoods : liveFoods
  return (
    <section className="page-wrap">
      <PageHeader eyebrow="Your collection" title="Liked foods" description="Dishes you saved for later." />
      {loadError ? <><p role="alert">Could not load your liked dishes.</p><button onClick={() => setAttempt(value => value + 1)}>Try again</button></>
        : foods === null ? <p className="loading-mark">Loading your liked dishes…</p>
        : <PaperPanel className="liked-panel">
          {foods.length ? foods.map(food => (
            <article className="liked-row" key={food.id}>
              <FoodImage food={food} size="small" />
              <div className="liked-copy"><h2>{food.name.replace(/^Mock /, '')}</h2><span className="saved-label">♡ Saved</span><DishDetails food={food} /></div>
              <button className="remove-button" disabled={pending} onClick={() => void remove(food)} aria-label={isDemo ? `Remove ${food.name} from saved foods` : `Change ${food.name} to a pass`} title={isDemo ? 'Remove from saved' : 'Change to pass'}>×</button>
            </article>
          )) : <div className="empty-state"><span className="empty-icon">♡</span><h2>No saved dishes yet</h2><p>Swipe right on a dish to start your collection.</p></div>}
        </PaperPanel>}
      {saveError && <p className="form-error" role="alert">Could not update your saved dish. Please retry.</p>}
      <Link className="secondary-button button-link full-width" to="/swipe">Back to swipe deck</Link>
    </section>
  )
}
