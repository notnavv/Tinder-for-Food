"""GET /food-dna: the user's taste profile.

Scores must come from the user's real swipes. Include `n` so the UI can show low-confidence values honestly.
"""

import pandas as pd
from fastapi import APIRouter

from app.core.auth import CurrentUserId
from app.core.config import get_settings
from app.core.supabase_client import get_supabase
from app.ml.food_dna import compute_food_dna
from app.schemas.contracts import FoodDnaResponse
from app.services.mock_data import load_mock

router = APIRouter(tags=["ml"])


@router.get("/food-dna", response_model=FoodDnaResponse)
def get_food_dna(user_id: CurrentUserId) -> FoodDnaResponse:
    if get_settings().use_mock_data:
        return FoodDnaResponse(**load_mock("food_dna"))
    db = get_supabase()
    history = []
    for offset in range(0, 100_000, 500):
        rows = (
            db.table("user_food_preferences")
            .select("food_id,liked")
            .eq("user_id", user_id)
            .order("food_id")
            .range(offset, offset + 499)
            .execute()
            .data
        )
        history.extend(rows)
        if len(rows) < 500:
            break
    ids = [row["food_id"] for row in history]
    foods = []
    for offset in range(0, len(ids), 100):
        foods.extend(
            db.table("foods")
            .select("id,cuisine,protein_category,dietary_tags,carbon_footprint")
            .in_("id", ids[offset : offset + 100])
            .execute()
            .data
        )
    return FoodDnaResponse(
        is_mock=False,
        swipe_count=len(history),
        dimensions=compute_food_dna(pd.DataFrame(history), pd.DataFrame(foods)),
    )
