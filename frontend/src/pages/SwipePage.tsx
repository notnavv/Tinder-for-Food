import { useCallback, useEffect, useRef, useState } from 'react'
import DishDetails from '../components/DishDetails'
import { Link } from 'react-router-dom'
import { FoodImage, PageHeader, PrimaryButton, SecondaryButton, Tag } from '../components/ui'
import { useAppState } from '../lib/useAppState'
import { getDeck } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { DeckFood } from '../types/contracts'
import { matchesPreferences } from '../lib/preferences'

const EXIT_MS = 220

export default function SwipePage() {
  const { recordSwipe, likedIds, preferences, avoidances, swipedIds, restartDeck, isDemo } = useAppState()
  const [deck, setDeck] = useState<DeckFood[]>([])
  const [sampleDeck, setSampleDeck] = useState(false)
  const [strategy, setStrategy] = useState<string>()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [exit, setExit] = useState<'left' | 'right' | null>(null)
  const pointer = useRef<{ id: number, startX: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)

  const loadDeck = useCallback(() => {
    setLoading(true)
    setError(null)
    getDeck(20).then((result) => { setDeck(result.items); setStrategy(result.strategy); setSampleDeck(result.is_mock) }).catch((reason: unknown) => setError(String(reason))).finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadDeck() }, [loadDeck])

  const current = deck.find((food) => !swipedIds.has(food.id) && matchesPreferences(food, preferences, avoidances))
  async function submit(liked: boolean) {
    if (!current || lock.current) return
    lock.current = true
    setBusy(true)
    setSaveError(null)
    // Fly the card off screen first, so every swipe finishes the motion it started.
    setDragging(false)
    setExit(liked ? 'right' : 'left')
    await new Promise((resolve) => window.setTimeout(resolve, EXIT_MS))
    if (!isDemo && supabase) {
      try {
        const { error } = await supabase.from('swipe_events').insert({
          food_id: current.id,
          liked,
          source: 'deck',
          deck_strategy: strategy,
        })
        if (error) throw error
      } catch {
        setSaveError('Could not save this swipe. Sign in again if your session expired, then retry.')
        setExit(null)
        setDragX(0)
        setBusy(false)
        lock.current = false
        return
      }
    }
    recordSwipe(current.id, liked, isDemo ? current : undefined)
    // Show the next card in the centre straight away, without sliding it back in.
    setDragging(true)
    setExit(null)
    setDragX(0)
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setDragging(false)))
    setBusy(false)
    lock.current = false
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!current || loading || error || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.preventDefault()
      if (event.key === 'ArrowLeft') submit(false)
      if (event.key === 'ArrowRight') submit(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (loading) return <section className="page-wrap centered-state"><p className="loading-mark">Finding your next bite…</p></section>
  if (error) return <section className="page-wrap centered-state"><p className="form-error">We couldn’t load the deck.</p><p className="muted-copy">{error}</p><PrimaryButton onClick={loadDeck}>Try again</PrimaryButton></section>
  if (!current) return <section className="page-wrap centered-state"><PageHeader eyebrow="Deck complete" title="You’re all caught up." description={isDemo ? "No unseen dishes match your preferences. Revisit saved picks or adjust your filters." : "No unreviewed dishes are available on the upcoming menus."} />{isDemo && <Link className="primary-button button-link" to="/liked">See saved foods</Link>}<SecondaryButton onClick={isDemo ? restartDeck : loadDeck}>{isDemo ? 'Start over' : 'Load more dishes'}</SecondaryButton>{isDemo && <Link to="/settings">Adjust preferences</Link>}</section>

  const tags = [...(current.dietary_tags ?? []), current.cuisine].filter(Boolean).slice(0, 3)
  return (
    <section className="page-wrap deck-page">
      <div className="deck-topline"><span className="deck-history">{likedIds.size} saved</span>{isDemo && <Link to="/profile" className="deck-profile">{preferences.length ? 'Your deck' : 'Food explorer'} ↗</Link>}</div>
      <PageHeader eyebrow="Today’s deck" title="Swipe Deck" description="Teach us what you’re craving." />
      <section
        className="paper-panel swipe-card-wrap"
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0 || lock.current) return
          pointer.current = { id: event.pointerId, startX: event.clientX }
          setDragging(true)
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={event => {
          if (pointer.current?.id === event.pointerId) setDragX(event.clientX - pointer.current.startX)
        }}
        onLostPointerCapture={event => {
          if (pointer.current?.id !== event.pointerId) return
          pointer.current = null
          setDragging(false)
          setDragX(0)
        }}
        onPointerUp={event => {
          if (pointer.current?.id !== event.pointerId) return
          const distance = event.clientX - pointer.current.startX
          pointer.current = null
          setDragging(false)
          const threshold = Math.min(90, Math.max(44, event.currentTarget.clientWidth * 0.18))
          if (Math.abs(distance) >= threshold) void submit(distance > 0)
          else setDragX(0)
        }}
      >
        <div
          className="swipe-card"
          style={{
            transform: exit ? `translateX(${exit === 'right' ? '' : '-'}130vw) rotate(${exit === 'right' ? 24 : -24}deg)` : `translateX(${dragX}px) rotate(${dragX / 18}deg)`,
            transition: dragging ? 'none' : `transform ${EXIT_MS}ms ease-out`,
          }}
        >
          <div className="swipe-feedback like-feedback" style={{ opacity: Math.min(1, Math.max(0, dragX / 90)) }}>LIKE</div><div className="swipe-feedback pass-feedback" style={{ opacity: Math.min(1, Math.max(0, -dragX / 90)) }}>PASS</div>
          <span className="handwritten-title">{current.name.replace(/^Mock /, '')}</span>
          <p className="dish-halls">
            {current.dining_hall_names?.length
              ? `${sampleDeck ? 'Sample · ' : ''}${current.dining_hall_names.join(' · ')}`
              : sampleDeck ? 'Sample dish' : 'Dining hall unavailable'}
          </p>
          <FoodImage key={current.id} food={current} />
          <div className="swipe-card-details">{tags.map((tag) => <Tag key={tag} tone="coral">{tag}</Tag>)}<p>{current.allergens?.length ? `Contains: ${current.allergens.join(', ').replace(/_/g, ' ')}` : current.allergens === null ? 'Allergen information unavailable' : 'No allergens listed'}</p></div>
        </div>
      </section>
      <div className="swipe-actions">
        <button disabled={busy} className="round-action pass" onClick={() => submit(false)} aria-label="Pass on this dish">
          <svg className="mobile-pass-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          <svg className="desktop-pass-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5C8 0 2 3 2 8c0 5 10 12 10 12S22 13 22 8c0-5-6-8-10-3Z" />
            <path d="m12 5-2 5 4 2-3 4 1 4" />
          </svg>
        </button>
        <button disabled={busy} className="round-action like" onClick={() => submit(true)} aria-label="Like this dish">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11Z" /></svg>
        </button>
      </div>
      <p className="keyboard-hint">Swipe the card or use the buttons.<span className="physical-keyboard-hint"> Keyboard: ← to pass, → to like.</span></p>
      {saveError && <p role="alert" className="form-error">{saveError}</p>}
      <DishDetails food={current} />
      {isDemo && <p className="demo-notice" role="status">
        {sampleDeck
          ? 'Sample deck · No current UCLA menu could be loaded.'
          : 'UCLA dining menu · Demo swipes are saved on this device.'}
      </p>}
    </section>
  )
}
