import type { Food, FoodDnaDimension, FoodDnaResponse } from '../types/contracts'
import type { SwipeOpinion } from './appStateContext'

const dimensions = [
  { key: 'cuisine', label: 'Cuisines', values: (food: Food) => food.cuisine ? [food.cuisine] : [] },
  { key: 'protein_category', label: 'Proteins', values: (food: Food) => food.protein_category ? [food.protein_category] : [] },
  { key: 'dietary_tags', label: 'Dietary tags', values: (food: Food) => food.dietary_tags ?? [] },
  { key: 'carbon_footprint', label: 'Carbon footprint', values: (food: Food) => food.carbon_footprint ? [food.carbon_footprint] : [] },
]

export function demoFoodDna(history: SwipeOpinion[]): FoodDnaResponse {
  const signals: FoodDnaDimension[] = dimensions.map(({ key, label, values }) => {
    const counts = new Map<string, { n: number; balance: number }>()
    for (const { food, liked } of history) {
      for (const value of new Set(values(food))) {
        const count = counts.get(value) ?? { n: 0, balance: 0 }
        count.n += 1
        count.balance += liked ? 1 : -1
        counts.set(value, count)
      }
    }
    const scores = [...counts].map(([value, { n, balance }]) => ({ value, n, score: balance / n }))
      .sort((a, b) => b.n - a.n || a.value.localeCompare(b.value))
    return { key, label, scores }
  }).filter(dimension => dimension.scores.length > 0)
  return { is_mock: false, swipe_count: history.length, dimensions: signals }
}

function features(food: Food): Set<string> {
  const words = food.name.toLowerCase().match(/[a-z]{3,}/g) ?? []
  return new Set([
    ...words.filter(word => !['mock', 'with', 'and', 'the'].includes(word)),
    ...dimensions.flatMap(({ key, values }) => values(food).map(value => `${key}:${value}`)),
  ])
}

export function rankDemoMenu<T extends Food>(foods: T[], history: SwipeOpinion[]) {
  const seen = new Set(history.map(({ food }) => food.id))
  const signals = history.map(({ food, liked }) => ({ tags: features(food), liked }))
  return foods.filter(food => !seen.has(food.id)).map(food => {
    const tags = features(food)
    let balance = 0
    for (const signal of signals) {
      const shared = [...tags].filter(tag => signal.tags.has(tag)).length
      if (shared) balance += (signal.liked ? 1 : -1) * shared / Math.sqrt(tags.size * signal.tags.size)
    }
    return { food, score: signals.length ? balance / signals.length : 0 }
  }).sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
}
