"""Tests for the content-based recommender (backend/app/ml/content_based.py).

Five fake dishes: three chicken dishes and two fruit dishes.
Every name starts with "Mock" so nobody mistakes them for real UCLA data.

Run one step at a time, e.g.:  pytest tests/test_content_based.py -k dish_text -v
"""

import pandas as pd

from app.ml.content_based import ContentBasedRecommender, dish_tags, dish_text

FOODS = pd.DataFrame(
    [
        {"id": "recipe:1", "name": "Mock Grilled Chicken Breast", "stations": ["Grill"],
         "dietary_tags": ["halal"], "allergens": [], "carbon_footprint": "low"},
        {"id": "recipe:2", "name": "Mock Chicken Teriyaki Bowl", "stations": ["Wok"],
         "dietary_tags": [], "allergens": ["soy"], "carbon_footprint": ""},
        {"id": "recipe:3", "name": "Mock Fresh Fruit Cup", "stations": ["Fruit"],
         "dietary_tags": ["vegan"], "allergens": [], "carbon_footprint": "low"},
        {"id": "recipe:4", "name": "Mock Melon Fruit Salad", "stations": ["Fruit"],
         "dietary_tags": ["vegan"], "allergens": [], "carbon_footprint": "low"},
        {"id": "recipe:5", "name": "Mock Chicken Tortilla Soup", "stations": ["Soups"],
         "dietary_tags": [], "allergens": ["dairy"], "carbon_footprint": ""},
    ]
)  # fmt: skip
NO_SWIPES = pd.DataFrame({"user_id": [], "food_id": [], "liked": []})


def history(liked=(), disliked=()):
    """One student's swipes as a DataFrame."""
    rows = [{"user_id": "u1", "food_id": f, "liked": True} for f in liked]
    rows += [{"user_id": "u1", "food_id": f, "liked": False} for f in disliked]
    return pd.DataFrame(rows, columns=["user_id", "food_id", "liked"])


# ---- Step 1 ----
def test_dish_text():
    assert dish_text(FOODS.iloc[0]) == "Mock Grilled Chicken Breast Grill"


# ---- Step 2 ----
def test_dish_tags():
    assert dish_tags(FOODS.iloc[0]) == ["diet:halal", "carbon:low"]
    assert dish_tags(FOODS.iloc[1]) == ["allergen:soy"]


# ---- Step 3 ----
def test_fit_makes_one_row_per_dish():
    model = ContentBasedRecommender().fit(FOODS, NO_SWIPES)
    assert model.X.shape[0] == 5
    assert model.row["recipe:3"] == 2


# ---- Step 4 ----
def test_profile_is_none_without_likes():
    model = ContentBasedRecommender().fit(FOODS, NO_SWIPES)
    assert model.build_profile(history(disliked=["recipe:3"])) is None


def test_profile_has_one_number_per_feature():
    model = ContentBasedRecommender().fit(FOODS, NO_SWIPES)
    profile = model.build_profile(history(liked=["recipe:1"], disliked=["recipe:3"]))
    assert profile.shape == (1, model.X.shape[1])


# ---- Step 5 ----
def test_cold_start_uses_popularity():
    model = ContentBasedRecommender().fit(FOODS, NO_SWIPES)
    scores = model.score(history(), ["recipe:4", "recipe:5"])
    assert list(scores) == [0.5, 0.5]


def test_learns_from_likes():
    model = ContentBasedRecommender().fit(FOODS, NO_SWIPES)
    student = history(liked=["recipe:1", "recipe:2"], disliked=["recipe:3"])
    scores = model.score(student, ["recipe:4", "recipe:5"])
    assert scores["recipe:5"] > scores["recipe:4"]  # chicken soup beats fruit salad
