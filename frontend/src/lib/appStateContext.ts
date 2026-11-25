import { createContext } from 'react'
import type { Food } from '../types/contracts'

export type TastePreference = 'vegetarian' | 'vegan' | 'high protein' | 'halal' | 'comfort food' | 'quick bites'

export interface AppStateValue {
  isDemo: boolean
  foods: Food[]
  likedFoods: Food[]
  likedIds: Set<string>
  swipedIds: Set<string>
  preferences: TastePreference[]
  avoidances: string
  displayName: string
  recordSwipe: (foodId: string, liked: boolean) => void
  removeLiked: (foodId: string) => void
  savePreferences: (preferences: TastePreference[], avoidances: string) => void
  saveProfile: (displayName: string) => void
  resetDemo: () => void
  restartDeck: () => void
}

export const AppStateContext = createContext<AppStateValue | null>(null)
