import type { Food } from '../types/contracts'
import type { TastePreference } from './appStateContext'

/** Filters only published tags and known allergens; never establishes allergy safety. */
export function matchesPreferences(food: Food, preferences: TastePreference[], avoidances: string) {
  const tags = food.dietary_tags ?? []
  if (preferences.includes('vegan') && !tags.includes('vegan')) return false
  if (preferences.includes('vegetarian') && !tags.some((tag) => tag === 'vegetarian' || tag === 'vegan')) return false
  if (preferences.includes('halal') && !tags.includes('halal')) return false
  const aliases: Record<string, string> = { peanuts: 'peanut', milk: 'dairy', nuts: 'tree_nuts', eggs: 'eggs' }
  const avoided = avoidances.toLowerCase().split(',').map((item) => item.trim().replace(/ /g, '_')).filter(Boolean)
  return !avoided.some((item) => food.allergens?.includes(aliases[item] ?? item))
}
