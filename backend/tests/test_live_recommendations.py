from app.api import recommendations
from app.core.auth import get_current_user_id
from app.core.config import get_settings
from app.main import app


def test_live_recommendations_rank_the_requested_hall_using_only_the_callers_swipes(client, monkeypatch):
    day = "2026-10-15"
    menu = [
        {
            "food_id": food_id,
            "dining_hall_slug": hall,
            "service_date": day,
            "meal_period": "lunch",
            "station": "Toppings" if food_id == "6" else None,
        }
        for food_id, hall in [
            ("1", "bruin-plate"),
            ("2", "bruin-plate"),
            ("3", "de-neve"),
            ("4", "bruin-plate"),
            ("5", "bruin-plate"),
            ("6", "bruin-plate"),
            ("7", "bruin-plate"),
            ("8", "bruin-plate"),
        ]
    ]
    foods = [
        {
            "id": food_id,
            "source_type": "ingredient" if food_id == "5" else "recipe",
            "source_id": food_id,
            "name": name,
            "allergens": [],
            "dietary_tags": [],
            "carbon_footprint": None,
        }
        for food_id, name in [
            ("1", "Melon"),
            ("2", "Chicken soup"),
            ("3", "Chicken stir fry"),
            ("4", "Cucumber"),
            ("5", "Pickled Radish"),
            ("6", "Chinese Cucumber Salad"),
            ("7", "Chicken sandwich"),
            ("8", "Baked salmon"),
        ]
    ]
    data = {
        "menu_appearances": menu,
        "foods_with_photo": foods,
        "user_food_preferences": [
            {"food_id": "3", "liked": True, "user_id": "caller"},
            {"food_id": "7", "liked": True, "user_id": "caller"},
            {"food_id": "8", "liked": False, "user_id": "caller"},
            {"food_id": "1", "liked": True, "user_id": "another-user"},
        ],
    }

    class Query:
        def __init__(self, rows):
            self.data = rows

        def select(self, _fields):
            return self

        def order(self, _field):
            return self

        def eq(self, field, value):
            self.data = [row for row in self.data if row[field] == value]
            return self

        def in_(self, field, values):
            self.data = [row for row in self.data if row[field] in values]
            return self

        def range(self, start, end):
            self.data = self.data[start : end + 1]
            return self

        def execute(self):
            return self

    class Supabase:
        def table(self, name):
            return Query(data[name])

    monkeypatch.setenv("USE_MOCK_DATA", "false")
    get_settings.cache_clear()
    monkeypatch.setattr(recommendations, "get_supabase", Supabase)
    monkeypatch.setitem(app.dependency_overrides, get_current_user_id, lambda: "caller")
    response = client.get("/recommendations", params={"service_date": day, "dining_hall": "bruin-plate"})
    assert response.status_code == 200
    payload = response.json()
    assert not payload["is_mock"]
    assert [item["food"]["id"] for item in payload["items"]] == ["2", "1"]


def test_dish_filter_excludes_standalone_components_but_keeps_prepared_dishes():
    assert not recommendations.is_dish("Black Pepper Strawberry Compote", "recipe")
    assert not recommendations.is_dish("Strawberry Compote & Red Wine", "recipe")
    assert not recommendations.is_dish("Orange Hibiscus Water", "recipe")
    assert not recommendations.is_dish("Cucumber", "recipe")
    assert recommendations.is_dish("Seared Tofu w/ Spicy Sauce", "recipe")
    assert recommendations.is_dish("Ginger Pancake w/ Banana Walnut Topping", "recipe")
    assert recommendations.is_dish("Chinese Cucumber Salad", "recipe")
