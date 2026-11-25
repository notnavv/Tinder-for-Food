import { useCallback, useEffect, useRef, useState } from 'react'
import DishDetails from '../components/DishDetails'
import { Link } from 'react-router-dom'
import { DemoNotice, FoodImage, PageHeader, PaperPanel, PrimaryButton, SecondaryButton, Tag } from '../components/ui'
import { useAppState } from '../lib/useAppState'
import { getDeck } from '../lib/api'
import type { Food } from '../types/contracts'
import { matchesPreferences } from '../lib/preferences'

export default function SwipePage() {
  const { recordSwipe, likedIds, preferences, avoidances, swipedIds, restartDeck, isDemo } = useAppState()
  const [deck, setDeck] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dragX, setDragX] = useState(0)
  const [pointerStart, setPointerStart] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const loadDeck = useCallback(() => {
    setLoading(true)
    setError(null)
    getDeck(20).then((result) => { setDeck(result.items) }).catch((reason: unknown) => setError(String(reason))).finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadDeck() }, [loadDeck])

  const current = deck.find((food) => !swipedIds.has(food.id) && matchesPreferences(food, preferences, avoidances))
  function submit(liked: boolean) {
    if (!current || lock.current) return
    if (!isDemo) { setError('Live swipe saving is not connected yet. Use demo mode to explore saving dishes.'); return }
    lock.current = true
    setBusy(true)
    setDragX(liked ? 130 : -130)
    timer.current = setTimeout(() => {
      recordSwipe(current.id, liked)
      setDragX(0)
      setBusy(false)
      lock.current = false
    }, 180)
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat || (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, button, a'))) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.preventDefault()
      if (event.key === 'ArrowLeft') submit(false)
      if (event.key === 'ArrowRight') submit(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (loading) return <section className="page-wrap centered-state"><p className="loading-mark">Finding your next bite…</p></section>
  if (error) return <section className="page-wrap centered-state"><p className="form-error">We couldn’t load the deck.</p><p className="muted-copy">{error}</p><PrimaryButton onClick={loadDeck}>Try again</PrimaryButton></section>
  if (!current) return <section className="page-wrap centered-state"><PageHeader eyebrow="Deck complete" title="You’re all caught up." description="No unseen dishes match your preferences. Revisit saved picks or adjust your filters." /><Link className="primary-button button-link" to="/liked">See saved foods</Link><SecondaryButton onClick={restartDeck}>Start over</SecondaryButton><Link to="/settings">Adjust preferences</Link></section>

  const tags = [...(current.dietary_tags ?? []), current.cuisine].filter(Boolean).slice(0, 3)
  return (
    <section className="page-wrap deck-page">
      <div className="deck-topline"><span className="deck-history">{likedIds.size} saved</span><Link to="/profile" className="deck-profile">{preferences.length ? 'Your deck' : 'Food explorer'} ↗</Link></div>
      <PageHeader eyebrow="Today’s deck" title="Swipe Deck" description="Teach us what you’re craving." />
      <PaperPanel className="swipe-card-wrap">
        <div className="swipe-card" style={{ transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)` }} onPointerCancel={() => { setDragX(0); setPointerStart(null) }} onPointerDown={(event) => { if (busy) return; setPointerStart(event.clientX); event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={(event) => { if (pointerStart !== null) setDragX(event.clientX - pointerStart) }} onPointerUp={() => { if (Math.abs(dragX) > 90) submit(dragX > 0); else setDragX(0); setPointerStart(null) }}>
          <div className="swipe-feedback like-feedback" style={{ opacity: Math.min(1, Math.max(0, dragX / 90)) }}>LIKE</div><div className="swipe-feedback pass-feedback" style={{ opacity: Math.min(1, Math.max(0, -dragX / 90)) }}>PASS</div>
          <span className="handwritten-title">{current.name.replace(/^Mock /, '').split(' ').slice(0, 3).join(' ')}</span>
          <FoodImage key={current.id} food={current} />
          <div className="swipe-card-details">{tags.map((tag) => <Tag key={tag} tone="coral">{tag}</Tag>)}<p>{current.allergens?.length ? `Contains: ${current.allergens.join(', ')}` : 'No listed allergens in this sample'}</p></div>
        </div>
      </PaperPanel>
      <div className="swipe-actions">
        <button disabled={busy} className="round-action pass" onClick={() => submit(false)} aria-label="Pass on this dish">
          <span className="mobile-pass-icon" aria-hidden="true">×</span>
          <svg className="desktop-pass-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5C8 0 2 3 2 8c0 5 10 12 10 12S22 13 22 8c0-5-6-8-10-3Z" />
            <path d="m12 5-2 5 4 2-3 4 1 4" />
          </svg>
        </button>
        <button disabled={busy} className="round-action like" onClick={() => submit(true)} aria-label="Like this dish">♡</button>
      </div>
      <p className="keyboard-hint">Drag the card, tap a button, or use ← → on your keyboard.</p>
      <DishDetails food={current} /><DemoNotice />
    </section>
  )
}
