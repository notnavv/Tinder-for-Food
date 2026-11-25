"""GET /recommendations: ranked dishes that are actually on the menu.

Filters: service_date (default today in LA), meal_period,
dining_hall. `model` picks the recommender so we can compare them.
"""

import json
import re
from collections import defaultdict
from datetime import date, datetime
from zoneinfo import ZoneInfo

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from app.core.auth import CurrentUserId
from app.core.config import REPO_ROOT, get_settings
from app.core.halls import RESIDENTIAL_HALLS
from app.core.supabase_client import get_supabase
from app.ml.content_based import ContentBasedRecommender
from app.schemas.contracts import DiningHallSlug, MealPeriod, ModelName, RecommendationItem, RecommendationsResponse
from app.services.mock_data import load_mock

router = APIRouter(tags=["ml"])
with (REPO_ROOT / "data" / "dish-eligibility.json").open(encoding="utf-8") as rules_file:
    dish_rules = json.load(rules_file)
COMPONENT_STATIONS = frozenset(dish_rules["component_stations"])
COMPONENT_NAMES = frozenset(dish_rules["component_names"])


def is_dish(name: str, source_type: str) -> bool:
    name = name.strip().lower()
    # A sauce or topping named after "with" is part of the dish.
    main_name = re.split(r"\s+(?:with|w/)\s+", name, maxsplit=1)[0]
    return (
        source_type == "recipe"
        and name not in COMPONENT_NAMES
        and not any(
            main_name == suffix or main_name.endswith(f" {suffix}") for suffix in dish_rules["component_suffixes"]
        )
    )


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
    if model == "collaborative":
        raise HTTPException(501, "Collaborative recommendations are unavailable")

    day = service_date or datetime.now(ZoneInfo("America/Los_Angeles")).date()
    response = RecommendationsResponse(
        is_mock=False, model=model, service_date=day, meal_period=meal_period, dining_hall=dining_hall, items=[]
    )
    db = get_supabase()
    menu = (
        db.table("menu_appearances")
        .select("food_id,dining_hall_slug,service_date,meal_period,station")
        .eq("service_date", day.isoformat())
        .order("id")
    )
    if dining_hall:
        menu = menu.eq("dining_hall_slug", dining_hall)
    if meal_period:
        menu = menu.eq("meal_period", meal_period)
    halls = {hall.slug: hall.name for hall in RESIDENTIAL_HALLS}
    appearances = defaultdict(list)
    for row in menu.execute().data:
        if (row["station"] or "").strip().lower() in COMPONENT_STATIONS:
            continue
        appearances[row["food_id"]].append({**row, "dining_hall_name": halls[row["dining_hall_slug"]]})
    if not appearances:
        return response

    history = []
    offset = 0
    while True:
        batch = (
            db.table("user_food_preferences")
            .select("food_id,liked")
            .eq("user_id", user_id)
            .order("food_id")
            .range(offset, offset + 499)
            .execute()
            .data
        )
        history.extend(batch)
        if len(batch) < 500:
            break
        offset += len(batch)
    reviewed = {row["food_id"] for row in history}
    ids = list(dict.fromkeys([*appearances, *(row["food_id"] for row in history)]))
    foods = {}
    for offset in range(0, len(ids), 100):
        rows = db.table("foods_with_photo").select("*").in_("id", ids[offset : offset + 100]).execute().data
        foods.update({row["id"]: row for row in rows if is_dish(row["name"], row["source_type"])})

    candidates = [food_id for food_id in appearances if food_id in foods and food_id not in reviewed]
    if not candidates:
        return response
    known_history = [row for row in history if row["food_id"] in foods]
    user_history = pd.DataFrame(known_history, columns=["food_id", "liked"]).astype({"liked": bool})
    fallback = model == "popularity" or not user_history["liked"].any()
    if fallback:
        # Only aggregate per-dish outcomes, never include other users in the taste profile.
        totals = defaultdict(int)
        likes = defaultdict(int)
        for offset in range(0, len(candidates), 100):
            batch = candidates[offset : offset + 100]
            page_start = 0
            while True:
                rows = (
                    db.table("user_food_preferences")
                    .select("food_id,liked")
                    .in_("food_id", batch)
                    .order("food_id")
                    .order("user_id")
                    .range(page_start, page_start + 499)
                    .execute()
                    .data
                )
                for row in rows:
                    totals[row["food_id"]] += 1
                    likes[row["food_id"]] += int(row["liked"])
                if len(rows) < 500:
                    break
                page_start += len(rows)
        scores = {food_id: (likes[food_id] + 1) / (totals[food_id] + 2) for food_id in candidates}
    else:
        features = pd.DataFrame(
            [
                {
                    **food,
                    "name": f"{food['name']} dish",
                    "stations": sorted({row["station"] for row in appearances[food_id] if row["station"]}),
                    "dietary_tags": food["dietary_tags"] or [],
                    "allergens": food["allergens"] or [],
                    "carbon_footprint": food["carbon_footprint"] or "",
                }
                for food_id, food in foods.items()
            ]
        )
        scores = ContentBasedRecommender().fit(features, user_history).score(user_history, candidates)

    ranked = sorted(candidates, key=lambda food_id: (-scores[food_id], foods[food_id]["name"], food_id))
    explanation = "Based on community swipes" if fallback else "Based on your likes and passes"
    response.items = [
        RecommendationItem(
            food=foods[food_id],
            score=float(scores[food_id]),
            appearances=appearances[food_id],
            explanation=explanation,
        )
        for food_id in ranked[:limit]
    ]
    return response
