"""Food DNA calculation.

Input:  one user's current preferences (user_food_preferences rows joined to foods).
Output: list of FoodDnaDimension (see app/schemas/contracts.py).

Suggested score per value (e.g. cuisine = "indian"):
    score = (likes - dislikes) / (likes + dislikes)      in [-1, 1]
    n     = likes + dislikes
Skip foods where the attribute is null (unlabeled), don't treat them as "none".
"""

from collections import defaultdict

import pandas as pd

from app.schemas.contracts import FoodDnaDimension, FoodDnaScore


def compute_food_dna(user_preferences: pd.DataFrame, foods: pd.DataFrame) -> list[FoodDnaDimension]:
    if user_preferences.empty or foods.empty:
        return []
    joined = user_preferences.merge(foods, left_on="food_id", right_on="id")
    dimensions = []
    for key, label in (
        ("cuisine", "Cuisines"),
        ("protein_category", "Proteins"),
        ("dietary_tags", "Dietary tags"),
        ("carbon_footprint", "Carbon footprint"),
    ):
        counts = defaultdict(int)
        balance = defaultdict(int)
        for raw, liked in joined[[key, "liked"]].itertuples(index=False, name=None):
            values = raw if isinstance(raw, list) else [raw]
            for value in {item for item in values if isinstance(item, str) and item}:
                counts[value] += 1
                balance[value] += 1 if liked else -1
        if counts:
            dimensions.append(
                FoodDnaDimension(
                    key=key,
                    label=label,
                    scores=[
                        FoodDnaScore(value=value, n=counts[value], score=balance[value] / counts[value])
                        for value in sorted(counts, key=lambda value: (-counts[value], value))
                    ],
                )
            )
    return dimensions
