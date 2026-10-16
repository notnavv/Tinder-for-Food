"""The mock files in data/mock/ must match the API contracts exactly."""

import pytest

from app.schemas.contracts import DeckResponse, Food, FoodDnaResponse, RecommendationsResponse
from app.services.mock_data import load_mock


@pytest.mark.parametrize(
    ("name", "schema"),
    [("deck", DeckResponse), ("recommendations", RecommendationsResponse), ("food_dna", FoodDnaResponse)],
)
def test_mock_file_matches_contract(name, schema):
    schema.model_validate(load_mock(name))


def test_mock_foods_match_contract():
    for food in load_mock("foods"):
        Food.model_validate(food)


def test_mock_endpoints_return_contract_shapes(client):
    assert len(client.get("/deck?limit=3").json()["items"]) == 3
    recs = client.get("/recommendations?dining_hall=bruin-plate").json()
    assert all(i["appearances"][0]["dining_hall_slug"] == "bruin-plate" for i in recs["items"])
    assert client.get("/food-dna").json()["swipe_count"] >= 0


def test_invalid_filter_is_rejected(client):
    assert client.get("/recommendations?dining_hall=not-a-hall").status_code == 422
