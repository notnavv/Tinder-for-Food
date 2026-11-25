/**
 * Typed client for the FastAPI ML service. Shapes: src/types/contracts.ts.
 *
 * The client uses these data sources:
 *   1. Demo mode: reads the public menu when Supabase is configured, with sample data as a fallback.
 *   2. Recommendations and Food DNA: call FastAPI with the user's Supabase token.
 *   3. Live deck: reads available dishes from Supabase.
 */
import mockDeck from '../../../data/mock/deck.json'
import mockFoodDna from '../../../data/mock/food_dna.json'
import mockRecommendations from '../../../data/mock/recommendations.json'
import type {
  DeckResponse,
  DiningHallSlug,
  FoodDnaResponse,
  HealthResponse,
  MealPeriod,
  ModelName,
  RecommendationsResponse,
} from '../types/contracts'
import { getDeckFromSupabase } from './deckFallback'
import { supabase, USE_MOCKS } from './supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function apiGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value))
  }
  const headers: Record<string, string> = {}
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (session) headers.Authorization = `Bearer ${session.access_token}`

  const res = await fetch(`${API_URL}${path}${query.size ? `?${query}` : ''}`, { headers })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return (await res.json()) as T
}

export function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health')
}

export async function getDeck(limit = 10): Promise<DeckResponse> {
  if (!USE_MOCKS) return getDeckFromSupabase(limit)
  if (supabase) {
    try {
      const deck = await getDeckFromSupabase(limit, false)
      if (deck.items.length) return deck
    } catch (error) {
      console.warn('Public menu unavailable. Using the sample deck.', error)
    }
  }
  return { ...mockDeck, items: mockDeck.items.slice(0, limit) } as DeckResponse
}

export interface RecommendationQuery {
  service_date?: string
  meal_period?: MealPeriod
  dining_hall?: DiningHallSlug
  limit?: number
  model?: ModelName
}

export async function getRecommendations(q: RecommendationQuery = {}): Promise<RecommendationsResponse> {
  if (USE_MOCKS) return mockRecommendations as RecommendationsResponse
  const result = await apiGet<RecommendationsResponse>('/recommendations', { ...q })
  if (result.is_mock) throw new Error('Set USE_MOCK_DATA=false on the API to see live recommendations.')
  return result
}

export async function getFoodDna(): Promise<FoodDnaResponse> {
  if (USE_MOCKS) return mockFoodDna as FoodDnaResponse
  const result = await apiGet<FoodDnaResponse>('/food-dna')
  if (result.is_mock) throw new Error('Set USE_MOCK_DATA=false on the API to see your Food DNA.')
  return result
}
