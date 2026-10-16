"""Model B: content-based filtering.

Suggested starting point:
  1. Food vectors: TF-IDF on ingredients_text + one-hot for dietary_tags,
     allergens, carbon_footprint, cuisine, protein_category.
  2. User vector: mean(liked food vectors) - mean(disliked food vectors).
  3. Score = cosine similarity(user vector, candidate food vector).
Fall back to popularity when the user has no swipes (cold start).
"""

import pandas as pd


class ContentBasedRecommender:
    name = "content"

    def fit(self, foods: pd.DataFrame, swipes: pd.DataFrame) -> "ContentBasedRecommender":
        raise NotImplementedError("TODO")

    def score(self, user_history: pd.DataFrame, candidate_food_ids: list[str]) -> pd.Series:
        raise NotImplementedError("TODO")
