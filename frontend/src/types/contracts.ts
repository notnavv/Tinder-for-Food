/**
 * Shared data contracts.
 *
 * These mirror backend/app/schemas/contracts.py and the Supabase tables in
 * supabase/migrations. Field names are snake_case everywhere so rows from
 * Supabase and responses from FastAPI have the same shape.
 *
 * If you change a type here, change the Pydantic schema and the mock JSON
 * in data/mock/ in the same PR.
 */

export type MealPeriod =
  | 'breakfast'
  | 'brunch'
  | 'lunch'
  | 'dinner'
  | 'extended_dinner'
  | 'late_night'

export type DiningHallSlug = 'bruin-plate' | 'de-neve' | 'epicuria-covel' | 'feast-rieber'

export type ModelName = 'popularity' | 'content' | 'collaborative'

export interface DiningHall {
  slug: DiningHallSlug
  name: string
  source_url: string
}

/** A dish. One row per UCLA recipe/ingredient ID, no matter how often it's served. */
export interface Food {
  id: string
  name: string
  /** UCLA links items as ?recipe=123 or ?ingredient=456; together these are the dedup key. */
  source_type: 'recipe' | 'ingredient'
  source_id: string
  /** Copied word for word from UCLA. null = not collected yet. */
  ingredients_text: string | null
  /** UCLA allergen icons, e.g. "dairy", "tree_nuts". null = unknown, [] = UCLA showed none. */
  allergens: string[] | null
  /** UCLA diet icons: "vegan", "vegetarian", "halal". */
  dietary_tags: string[] | null
  carbon_footprint: 'low' | 'high' | null
  /** Team-assigned labels (UCLA doesn't publish these). null = not labeled yet. */
  cuisine: string | null
  protein_category: string | null
  /** Public URL of the primary approved photo, or null (show the no-photo card design). */
  image_url: string | null
}

/** When and where a dish is served. */
export interface MenuAppearance {
  dining_hall_slug: DiningHallSlug
  dining_hall_name: string
  service_date: string // YYYY-MM-DD
  meal_period: MealPeriod
  station: string | null
}

/** What the frontend inserts into the swipe_events table (user_id is filled in by the database). */
export interface NewSwipeEvent {
  food_id: string
  liked: boolean
  source: 'deck' | 'onboarding' | 'recommendations'
  /** Which strategy served this card, copied from DeckResponse.strategy. Needed for evaluation. */
  deck_strategy: string | null
}

// ---------- FastAPI responses ----------

export interface DeckResponse {
  is_mock: boolean
  /** e.g. "random_available", "supabase_fallback", "diverse_cold_start" */
  strategy: string
  items: Food[]
}

export interface RecommendationItem {
  food: Food
  score: number
  appearances: MenuAppearance[]
  explanation: string | null
}

export interface RecommendationsResponse {
  is_mock: boolean
  model: ModelName
  service_date: string
  meal_period: MealPeriod | null
  dining_hall: DiningHallSlug | null
  items: RecommendationItem[]
}

export interface FoodDnaScore {
  value: string
  /** -1 (always swiped left) to +1 (always swiped right) */
  score: number
  /** Number of swipes this score is based on. Show low-confidence styling when small. */
  n: number
}

export interface FoodDnaDimension {
  key: 'cuisine' | 'protein_category' | 'dietary_tags' | 'carbon_footprint' | string
  label: string
  scores: FoodDnaScore[]
}

export interface FoodDnaResponse {
  is_mock: boolean
  swipe_count: number
  dimensions: FoodDnaDimension[]
}

export interface HealthResponse {
  status: 'ok'
  version: string
  use_mock_data: boolean
  supabase_configured: boolean
}
