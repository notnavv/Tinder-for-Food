import DishDetails from '../components/DishDetails'
import { Link } from 'react-router-dom'
import { FoodImage, PageHeader, PaperPanel } from '../components/ui'
import { useAppState } from '../lib/useAppState'

export default function LikedFoodsPage() {
  const { likedFoods, removeLiked } = useAppState()
  return (
    <section className="page-wrap">
      <PageHeader eyebrow="Your collection" title="Liked foods" description="Dishes you saved for later." />
      <PaperPanel className="liked-panel">
        {likedFoods.length ? likedFoods.map((food) => <article className="liked-row" key={food.id}><FoodImage food={food} size="small" /><div><h2>{food.name.replace(/^Mock /, '')}</h2><p>{food.cuisine ? `${food.cuisine} · UCLA dining` : 'UCLA dining'}</p><span className="saved-label">♡ Saved</span><DishDetails food={food} /></div><button className="remove-button" onClick={() => removeLiked(food.id)} aria-label={`Remove ${food.name} from saved foods`}>×</button></article>) : <div className="empty-state"><span className="empty-icon">♡</span><h2>No saved dishes yet</h2><p>Swipe right on a dish to start your collection.</p></div>}
      </PaperPanel>
      <Link className="secondary-button button-link full-width" to="/swipe">Back to swipe deck</Link>
    </section>
  )
}
