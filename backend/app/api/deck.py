"""GET /deck: the next cards a user should swipe on.

Which cards we show affects how fast the model learns, so this
is part of the experiment. Record the strategy name on every response; the
frontend copies it into swipe_events.deck_strategy.
"""

from fastapi import APIRouter, HTTPException, Query

from app.core.auth import CurrentUserId
from app.core.config import get_settings
from app.schemas.contracts import DeckResponse
from app.services.mock_data import load_mock

router = APIRouter(tags=["ml"])


@router.get("/deck", response_model=DeckResponse)
def get_deck(user_id: CurrentUserId, limit: int = Query(10, ge=1, le=50)) -> DeckResponse:
    if get_settings().use_mock_data:
        data = load_mock("deck")
        return DeckResponse(**{**data, "items": data["items"][:limit]})
    # TODO: call a deck strategy in app/ml/ (start with "random_available").
    raise HTTPException(501, "Deck strategy not implemented yet; frontend should use its Supabase fallback")
