"""GET /recommendations: ranked dishes that are actually on the menu.

Filters: service_date (default today in LA), meal_period,
dining_hall. `model` picks the recommender so we can compare them.
"""

from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.core.auth import CurrentUserId
from app.core.config import get_settings
from app.schemas.contracts import DiningHallSlug, MealPeriod, ModelName, RecommendationsResponse
from app.services.mock_data import load_mock

router = APIRouter(tags=["ml"])


@router.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations(
    user_id: CurrentUserId,
    service_date: date | None = None,
    meal_period: MealPeriod | None = None,
    dining_hall: DiningHallSlug | None = None,
    model: ModelName = "content",
    limit: int = Query(20, ge=1, le=100),
) -> RecommendationsResponse:
    if get_settings().use_mock_data:
        data = load_mock("recommendations")
        items = [
            i for i in data["items"] if dining_hall is None or i["appearances"][0]["dining_hall_slug"] == dining_hall
        ]
        return RecommendationsResponse(**{**data, "dining_hall": dining_hall, "items": items[:limit]})
    # TODO: load candidates (menu_appearances for the date/meal/hall), score with app/ml/, return top `limit`.
    raise HTTPException(501, "Recommendations not implemented yet")
