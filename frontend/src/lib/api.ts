/**
 * Typed client for the FastAPI ML service. Shapes: src/types/contracts.ts.
 *
 * Every function works in three modes:
 *   1. Mock mode (VITE_USE_MOCKS=true): returns data/mock JSON. No servers needed.
 *   2. Normal: calls FastAPI with the user's Supabase token.
 *   3. getDeck only: if FastAPI is down or errors, falls back to a simple
 *      Supabase query so swiping keeps working.
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
  if (USE_MOCKS) return mockDeck as DeckResponse
  try {
    return await apiGet<DeckResponse>('/deck', { limit })
  } catch (err) {
    console.warn('[getDeck] ML service unavailable, using Supabase fallback', err)
    return getDeckFromSupabase(limit)
  }
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
  return apiGet<RecommendationsResponse>('/recommendations', { ...q })
}

export async function getFoodDna(): Promise<FoodDnaResponse> {
  if (USE_MOCKS) return mockFoodDna as FoodDnaResponse
  return apiGet<FoodDnaResponse>('/food-dna')
}
