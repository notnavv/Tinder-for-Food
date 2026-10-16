/**
 * Fallback deck when the FastAPI ML service is unavailable.
 *
 * Deliberately simple: dishes on the menu in the next few days that this user
 * hasn't swiped yet, in random order. Cards served this way are tagged
 * strategy "supabase_fallback" so evaluation can tell them apart.
 */
import type { DeckResponse, Food } from '../types/contracts'
import { supabase } from './supabase'

const LOOKAHEAD_DAYS = 3

function isoDate(d: Date): string {
  // Local date, not UTC, so "today" matches Los Angeles time for users in LA.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getDeckFromSupabase(limit = 10): Promise<DeckResponse> {
  if (!supabase) throw new Error('Supabase is not configured (see frontend/.env.example)')

  const today = new Date()
  const until = new Date(today)
  until.setDate(today.getDate() + LOOKAHEAD_DAYS)

  // Foods served soon (inner join on menu_appearances).
  const { data: foods, error } = await supabase
    .from('foods_with_photo')
    .select('*, menu_appearances!inner(service_date)')
    .gte('menu_appearances.service_date', isoDate(today))
    .lte('menu_appearances.service_date', isoDate(until))
    .limit(200)
  if (error) throw error

  // What this user has already swiped (RLS only returns their own rows).
  const { data: seen, error: seenError } = await supabase.from('user_food_preferences').select('food_id')
  if (seenError) throw seenError
  const seenIds = new Set((seen ?? []).map((row) => row.food_id as string))

  const unseen = new Map<string, Food>()
  for (const row of foods ?? []) {
    if (seenIds.has(row.id)) continue
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { menu_appearances, ...food } = row
    unseen.set(food.id, food as Food)
  }

  const items = [...unseen.values()].sort(() => Math.random() - 0.5).slice(0, limit)
  return { is_mock: false, strategy: 'supabase_fallback', items }
}
