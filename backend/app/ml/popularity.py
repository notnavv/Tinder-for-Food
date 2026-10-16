"""Model A: popularity baseline.

Rank foods by smoothed like-rate across ALL users, e.g. a Bayesian average:
    score = (likes + a) / (likes + dislikes + a + b)
so a food with 1/1 likes doesn't beat one with 40/50. Choose a and b
(the prior) and be ready to justify them.

Every user gets the same ranking. That's the point: personalized models
have to beat this to count as learning anything.
"""

import pandas as pd


class PopularityRecommender:
    name = "popularity"

    def fit(self, foods: pd.DataFrame, swipes: pd.DataFrame) -> "PopularityRecommender":
        raise NotImplementedError("TODO")

    def score(self, user_history: pd.DataFrame, candidate_food_ids: list[str]) -> pd.Series:
        raise NotImplementedError("TODO")
