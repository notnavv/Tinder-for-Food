/**
 * Fallback deck when the FastAPI ML service is unavailable.
 *
 * Deliberately simple: dishes on the menu in the next few days that this user
 * hasn't swiped yet, in random order. Cards served this way are tagged
 * strategy "supabase_fallback" so evaluation can tell them apart.
 */
import dishRules from '../../../data/dish-eligibility.json'
import type { DeckResponse, Food } from '../types/contracts'
import { supabase } from './supabase'

const LOOKAHEAD_DAYS = 3
const componentStations = new Set(dishRules.component_stations)
const componentNames = new Set(dishRules.component_names)

interface DeckAppearance {
  food_id: string
  station: string | null
  dining_halls: { name: string }
  foods: Pick<Food, 'name' | 'source_type'>
}

const laDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
})

function isoDate(date: Date): string {
  const parts = laDate.formatToParts(date)
  const value = (type: string) => parts.find(part => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export async function getDeckFromSupabase(limit = 10, includeSwipeHistory = true): Promise<DeckResponse> {
  if (!supabase) throw new Error('Supabase is not configured (see frontend/.env.example)')

  const today = new Date()
  const until = new Date(`${isoDate(today)}T12:00:00Z`)
  until.setUTCDate(until.getUTCDate() + LOOKAHEAD_DAYS)

  const seenIds = new Set<string>()
  if (includeSwipeHistory) {
    const { data, error } = await supabase.from('user_food_preferences').select('food_id')
    if (error) throw error
    for (const row of data ?? []) seenIds.add(row.food_id)
  }

  const hallsByFood = new Map<string, Set<string>>()
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('menu_appearances').select('food_id, station, foods!inner(name, source_type), dining_halls!inner(name)')
      .eq('foods.source_type', 'recipe')
      .gte('service_date', isoDate(today)).lte('service_date', isoDate(until))
      .order('id').range(offset, offset + 499)
    if (error) throw error
    const appearances = (data ?? []) as unknown as DeckAppearance[]
    for (const { food_id, station, foods, dining_halls } of appearances) {
      if (seenIds.has(food_id) || componentStations.has(station?.trim().toLowerCase() ?? '')) continue
      const name = foods.name.trim().toLowerCase()
      // A sauce or topping named after "with" is part of the dish.
      const mainName = name.split(/\s+(?:with|w\/)\s+/, 1)[0]
      if (componentNames.has(name) || dishRules.component_suffixes.some(
        suffix => mainName === suffix || mainName.endsWith(` ${suffix}`),
      )) continue
      const halls = hallsByFood.get(food_id) ?? new Set<string>()
      halls.add(dining_halls.name)
      hallsByFood.set(food_id, halls)
    }
    if (!data || data.length < 500) break
  }

  const candidates = [...hallsByFood.keys()]
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const foodId = candidates[i]
    candidates[i] = candidates[j]
    candidates[j] = foodId
  }
  const ids = candidates.slice(0, limit)
  if (!ids.length) return { is_mock: false, strategy: 'supabase_fallback', items: [] }
  const foods = new Map<string, Food>()
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data, error } = await supabase.from('foods_with_photo').select('*').in('id', ids.slice(offset, offset + 100))
    if (error) throw error
    for (const row of data ?? []) foods.set(row.id, row as Food)
  }
  const items = ids.flatMap(id => {
    const food = foods.get(id)
    return food ? [{ ...food, dining_hall_names: [...(hallsByFood.get(id) ?? [])].sort() }] : []
  })
  return { is_mock: false, strategy: 'supabase_fallback', items }
}
