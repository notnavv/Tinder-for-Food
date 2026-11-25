import { createContext } from 'react'
import type { Food } from '../types/contracts'

export const TASTE_PREFERENCES = ['vegetarian', 'vegan', 'high protein', 'halal', 'comfort food', 'quick bites'] as const
export type TastePreference = typeof TASTE_PREFERENCES[number]

export interface SwipeOpinion { food: Food; liked: boolean }

export interface AppStateValue {
  isDemo: boolean
  foods: Food[]
  likedFoods: Food[]
  likedIds: Set<string>
  swipeOpinions: SwipeOpinion[]
  saveFood: (food: Food) => void
  swipedIds: Set<string>
  preferences: TastePreference[]
  avoidances: string
  displayName: string
  email: string | null
  recordSwipe: (foodId: string, liked: boolean, food?: Food) => void
  removeLiked: (foodId: string) => void
  savePreferences: (preferences: TastePreference[], avoidances: string) => Promise<void>
  saveProfile: (displayName: string) => Promise<void>
  resetDemo: () => void
  restartDeck: () => void
}

export const AppStateContext = createContext<AppStateValue | null>(null)
