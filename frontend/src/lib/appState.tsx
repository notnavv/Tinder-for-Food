import { useEffect, useMemo, useState, type ReactNode } from 'react'
import mockFoods from '../../../data/mock/foods.json'
import type { Food } from '../types/contracts'
import { parseAvoidances } from './preferences'
import { supabase, USE_MOCKS } from './supabase'
import { AppStateContext, TASTE_PREFERENCES, type AppStateValue, type SwipeOpinion, type TastePreference } from './appStateContext'

interface StoredState {
  likedIds: string[]
  savedMenuFoods: Record<string, Food>
  swipedIds: string[]
  swipeOpinions: Record<string, SwipeOpinion>
  preferences: TastePreference[]
  avoidances: string
  displayName: string
}

const STORAGE_KEY = 'tinder-for-food-demo-state'
const DEFAULT_STATE: StoredState = {
  likedIds: [],
  savedMenuFoods: {},
  swipedIds: [],
  swipeOpinions: {},
  preferences: [],
  avoidances: '',
  displayName: 'Food explorer',
}

function readStoredState(): StoredState {
  if (!USE_MOCKS) return DEFAULT_STATE
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return DEFAULT_STATE
    const stored = JSON.parse(value) as Partial<StoredState>
    const state = { ...DEFAULT_STATE, ...stored }
    if (!stored.swipeOpinions) {
      const known = new Map([...mockFoods as Food[], ...Object.values(state.savedMenuFoods)].map(food => [food.id, food]))
      state.swipeOpinions = Object.fromEntries(state.swipedIds.flatMap(id => {
        const food = known.get(id)
        return food ? [[id, { food, liked: state.likedIds.includes(id) }]] : []
      }))
    }
    return state
  } catch {
    return DEFAULT_STATE
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(readStoredState)
  const [email, setEmail] = useState<string | null>(null)
  const foods = mockFoods as Food[]

  useEffect(() => {
    try {
      if (USE_MOCKS) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Browsers with storage disabled still support this session.
    }
  }, [state])

  useEffect(() => {
    if (USE_MOCKS || !supabase) return
    let userId: string | undefined
    const db = supabase
    let active = true
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      if (userId !== session?.user.id) {
        userId = session?.user.id
        setEmail(session?.user.email ?? null)
        setState(DEFAULT_STATE)
        const id = userId
        if (id) {
          void db.from('profiles').select('display_name,dietary_restrictions').eq('id', id).single().then(({ data, error }) => {
            if (error || !active || id !== userId) return
            const restrictions = data.dietary_restrictions as string[]
            setState(current => ({
              ...current,
              displayName: data.display_name || DEFAULT_STATE.displayName,
              preferences: TASTE_PREFERENCES.filter(item => restrictions.includes(item)),
              avoidances: restrictions.filter(item => item.startsWith('avoid:')).map(item => item.slice(6)).join(', '),
            }))
          })
        }
      }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const value = useMemo<AppStateValue>(() => {
    const likedIds = new Set(state.likedIds)
    const swipedIds = new Set(state.swipedIds)
    return {
      isDemo: USE_MOCKS,
      foods,
      likedFoods: [...new Map([...foods, ...Object.values(state.savedMenuFoods)].map(food => [food.id, food])).values()].filter(food => likedIds.has(food.id)),
      likedIds,
      swipedIds,
      swipeOpinions: Object.values(state.swipeOpinions),
      saveFood: (food) => setState(current => ({
        ...current,
        savedMenuFoods: { ...current.savedMenuFoods, [food.id]: food },
        likedIds: [...new Set([...current.likedIds, food.id])],
      })),
      preferences: state.preferences,
      avoidances: state.avoidances,
      displayName: state.displayName,
      email,
      recordSwipe: (foodId, liked, food) => {
        setState((current) => ({
          ...current,
          swipeOpinions: food ? { ...current.swipeOpinions, [foodId]: { food, liked } } : current.swipeOpinions,
          savedMenuFoods: food && liked ? { ...current.savedMenuFoods, [foodId]: food } : current.savedMenuFoods,
          swipedIds: [...new Set([...current.swipedIds, foodId])],
          likedIds: liked
            ? [...new Set([...current.likedIds, foodId])]
            : current.likedIds.filter((id) => id !== foodId),
        }))
      },
      removeLiked: (foodId) => setState((current) => ({ ...current, likedIds: current.likedIds.filter((id) => id !== foodId) })),
      savePreferences: async (preferences, avoidances) => {
        if (!USE_MOCKS && supabase) {
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) throw new Error('Sign in to save your preferences.')
          const { error } = await supabase.from('profiles').update({
            dietary_restrictions: [...preferences, ...parseAvoidances(avoidances).map(item => `avoid:${item}`)],
            onboarding_completed_at: new Date().toISOString(),
          }).eq('id', user.id).select('id').single()
          if (error) throw error
        }
        setState(current => ({ ...current, preferences, avoidances }))
      },
      saveProfile: async (displayName) => {
        if (!USE_MOCKS && supabase) {
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) throw new Error('Sign in to update your profile.')
          const { error } = await supabase.from('profiles').update({ display_name: displayName })
            .eq('id', user.id).select('id').single()
          if (error) throw error
        }
        setState(current => ({ ...current, displayName }))
      },
      resetDemo: () => setState(DEFAULT_STATE),
      restartDeck: () => setState((current) => ({ ...current, swipedIds: [] })),
    }
  }, [email, foods, state])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

