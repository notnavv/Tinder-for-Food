"""The shared interface every recommender implements.

Why a shared interface: the evaluation harness (notebooks/, Week 8) needs to
swap models in and out and score them the same way. If popularity, content
and collaborative all look like this, one evaluation loop works for all of
them.

Data shapes (pandas DataFrames):

  foods:   one row per food. Columns match the `foods` table
           (id, name, ingredients_text, allergens, dietary_tags,
            carbon_footprint, cuisine, protein_category, ...)

  swipes:  one row per swipe event. Columns: user_id, food_id, liked (bool),
           created_at. For training, use the user_food_preferences view
           (latest opinion per user+food) unless you're studying change over time.
"""

from typing import Protocol

import pandas as pd


class Recommender(Protocol):
    name: str

    def fit(self, foods: pd.DataFrame, swipes: pd.DataFrame) -> "Recommender":
        """Learn anything global (feature vectors, popularity counts) from all data."""
        ...

    def score(self, user_history: pd.DataFrame, candidate_food_ids: list[str]) -> pd.Series:
        """Score candidates for ONE user.

        user_history: that user's swipes only (same columns as `swipes`).
            In evaluation this must contain ONLY the training swipes,
            never the held-out ones (that would be data leakage).
        Returns: Series indexed by food_id, higher = more likely to be liked.
        """
        ...
