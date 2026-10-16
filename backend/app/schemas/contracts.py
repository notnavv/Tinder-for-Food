"""API response contracts.

These mirror frontend/src/types/contracts.ts. Change both (plus data/mock/)
in the same PR. tests/test_contracts.py checks the mock files against these.
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

MealPeriod = Literal["breakfast", "brunch", "lunch", "dinner", "extended_dinner", "late_night"]
DiningHallSlug = Literal["bruin-plate", "de-neve", "epicuria-covel", "feast-rieber"]
ModelName = Literal["popularity", "content", "collaborative"]


class Food(BaseModel):
    id: str
    name: str
    source_type: Literal["recipe", "ingredient"]
    source_id: str
    ingredients_text: str | None = None
    allergens: list[str] | None = None
    dietary_tags: list[str] | None = None
    carbon_footprint: Literal["low", "high"] | None = None
    cuisine: str | None = None
    protein_category: str | None = None
    image_url: str | None = None


class MenuAppearance(BaseModel):
    dining_hall_slug: DiningHallSlug
    dining_hall_name: str
    service_date: date
    meal_period: MealPeriod
    station: str | None = None


class DeckResponse(BaseModel):
    is_mock: bool
    strategy: str
    items: list[Food]


class RecommendationItem(BaseModel):
    food: Food
    score: float
    appearances: list[MenuAppearance]
    explanation: str | None = None


class RecommendationsResponse(BaseModel):
    is_mock: bool
    model: ModelName
    service_date: date
    meal_period: MealPeriod | None = None
    dining_hall: DiningHallSlug | None = None
    items: list[RecommendationItem]


class FoodDnaScore(BaseModel):
    value: str
    score: float = Field(ge=-1, le=1)
    n: int = Field(ge=0)


class FoodDnaDimension(BaseModel):
    key: str
    label: str
    scores: list[FoodDnaScore]


class FoodDnaResponse(BaseModel):
    is_mock: bool
    swipe_count: int
    dimensions: list[FoodDnaDimension]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str
    use_mock_data: bool
    supabase_configured: bool
