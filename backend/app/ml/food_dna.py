"""Food DNA calculation.

Input:  one user's current preferences (user_food_preferences rows joined to foods).
Output: list of FoodDnaDimension (see app/schemas/contracts.py).

Suggested score per value (e.g. cuisine = "indian"):
    score = (likes - dislikes) / (likes + dislikes)      in [-1, 1]
    n     = likes + dislikes
Skip foods where the attribute is null (unlabeled), don't treat them as "none".
"""

import pandas as pd

from app.schemas.contracts import FoodDnaDimension


def compute_food_dna(user_preferences: pd.DataFrame, foods: pd.DataFrame) -> list[FoodDnaDimension]:
    raise NotImplementedError("TODO")
