import { useEffect, useMemo, useState, type ReactNode } from 'react'
import mockFoods from '../../../data/mock/foods.json'
import type { Food } from '../types/contracts'
import { USE_MOCKS } from './supabase'
import { AppStateContext, type AppStateValue, type TastePreference } from './appStateContext'

interface StoredState {
  likedIds: string[]
  swipedIds: string[]
  preferences: TastePreference[]
  avoidances: string
  displayName: string
}

const STORAGE_KEY = 'tinder-for-food-demo-state'
const DEFAULT_STATE: StoredState = {
  likedIds: [],
  swipedIds: [],
  preferences: [],
  avoidances: '',
  displayName: 'Food explorer',
}

function readStoredState(): StoredState {
  if (!USE_MOCKS) return DEFAULT_STATE
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? { ...DEFAULT_STATE, ...JSON.parse(value) } : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(readStoredState)
  const foods = mockFoods as Food[]

  useEffect(() => {
    try {
      if (USE_MOCKS) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Browsers with storage disabled still support this session.
    }
  }, [state])

  const value = useMemo<AppStateValue>(() => {
    const likedIds = new Set(state.likedIds)
    const swipedIds = new Set(state.swipedIds)
    return {
      isDemo: USE_MOCKS,
      foods,
      likedFoods: foods.filter((food) => likedIds.has(food.id)),
      likedIds,
      swipedIds,
      preferences: state.preferences,
      avoidances: state.avoidances,
      displayName: state.displayName,
      recordSwipe: (foodId, liked) => {
        setState((current) => ({
          ...current,
          swipedIds: [...new Set([...current.swipedIds, foodId])],
          likedIds: liked
            ? [...new Set([...current.likedIds, foodId])]
            : current.likedIds.filter((id) => id !== foodId),
        }))
      },
      removeLiked: (foodId) => setState((current) => ({ ...current, likedIds: current.likedIds.filter((id) => id !== foodId) })),
      savePreferences: (preferences, avoidances) => setState((current) => ({ ...current, preferences, avoidances })),
      saveProfile: (displayName) => setState((current) => ({ ...current, displayName })),
      resetDemo: () => setState(DEFAULT_STATE),
      restartDeck: () => setState((current) => ({ ...current, swipedIds: [] })),
    }
  }, [foods, state])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

