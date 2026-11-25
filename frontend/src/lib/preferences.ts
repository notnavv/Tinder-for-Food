import type { Food } from '../types/contracts'
import type { TastePreference } from './appStateContext'

const ALLERGEN_ALIASES: Record<string, string> = { peanuts: 'peanut', milk: 'dairy', nuts: 'tree_nuts' }

export function parseAvoidances(text: string): string[] {
  return [...new Set(text.toLowerCase().split(',')
    .map(item => item.trim().replace(/[\s-]+/g, '_'))
    .filter(Boolean)
    .map(item => ALLERGEN_ALIASES[item] ?? item))]
}

/** Filters only published tags and known allergens; never establishes allergy safety. */
export function matchesPreferences(food: Food, preferences: TastePreference[], avoidances: string) {
  const tags = food.dietary_tags ?? []
  if (preferences.includes('vegan') && !tags.includes('vegan')) return false
  if (preferences.includes('vegetarian') && !tags.some((tag) => tag === 'vegetarian' || tag === 'vegan')) return false
  if (preferences.includes('halal') && !tags.includes('halal')) return false
  return !parseAvoidances(avoidances).some(item => food.allergens?.includes(item))
}
