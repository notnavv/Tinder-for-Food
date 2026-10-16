"""GET /food-dna: the user's taste profile.

Scores must come from the user's real swipes. Include `n` so the UI can show low-confidence values honestly.
"""

from fastapi import APIRouter, HTTPException

from app.core.auth import CurrentUserId
from app.core.config import get_settings
from app.schemas.contracts import FoodDnaResponse
from app.services.mock_data import load_mock

router = APIRouter(tags=["ml"])


@router.get("/food-dna", response_model=FoodDnaResponse)
def get_food_dna(user_id: CurrentUserId) -> FoodDnaResponse:
    if get_settings().use_mock_data:
        return FoodDnaResponse(**load_mock("food_dna"))
    # TODO: load this user's current preferences, call app/ml/food_dna.py.
    raise HTTPException(501, "Food DNA not implemented yet")
