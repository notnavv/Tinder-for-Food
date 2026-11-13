"""Tests for app/services/ingestion/normalize.py (Track A, part 1).

Run from backend/:  pytest tests/test_normalize.py -q
"""

import pytest

from app.services.ingestion.normalize import classify_icons, normalize_meal_period


# ---------- normalize_meal_period ----------
@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("breakfast", "breakfast"),
        ("BREAKFAST", "breakfast"),
        ("Lunch", "lunch"),
        ("Extended Dinner", "extended_dinner"),
        ("late-night", "late_night"),
    ],
)
def test_meal_period(raw, expected):
    assert normalize_meal_period(raw) == expected


def test_unknown_meal_period_is_an_error():
    with pytest.raises(ValueError):
        normalize_meal_period("second breakfast")


# ---------- classify_icons ----------
def test_icons_from_the_sample_page():
    # The Tri-Tip Bowl in tests/fixtures/hall_page_sample.html
    assert classify_icons(["High-carbon", "Eggs"]) == (["eggs"], [], "high", [])


def test_vegan_soy_low_carbon():
    assert classify_icons(["Vegan", "Soy", "Low-carbon"]) == (["soy"], ["vegan"], "low", [])


def test_dashes_become_underscores():
    allergens, _, _, _ = classify_icons(["Tree-nuts", "Crustacean-shellfish"])
    assert allergens == ["tree_nuts", "crustacean_shellfish"]


def test_no_icons():
    assert classify_icons([]) == ([], [], None, [])


def test_unknown_icons_are_kept_for_a_warning():
    assert classify_icons(["Vegan", "Spicy"]) == ([], ["vegan"], None, ["Spicy"])


def test_every_icon_on_the_saved_pages_is_known():
    # All 16 icon titles seen on the 4 halls' pages, 2026-10-15.
    seen = [
        "Low-carbon", "Vegan", "Gluten", "Wheat", "Dairy", "Halal", "Soy", "Vegetarian",
        "Eggs", "Sesame", "Alcohol", "Tree-nuts", "Fish", "Crustacean-shellfish", "High-carbon", "Peanut",
    ]  # fmt: skip
    for title in seen:
        assert classify_icons([title])[3] == [], f"{title} should be recognised"