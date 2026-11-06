"""Model B: content-based filtering.

Recommend dishes that are similar to the ones a student liked.
  1. Turn every dish into numbers: TF-IDF word weights + 0/1 tags.
  2. Taste profile = average of liked dishes - average of disliked dishes.
  3. Score = cosine similarity between the profile and each candidate dish.
No likes yet (cold start)? Fall back to popularity.

HOW TO USE THIS FILE
  Each STEP below has a GOAL, an EXAMPLE, and HINTS. Delete the
  `raise NotImplementedError` line and write your own code in its place.
  Plan it out loud in plain English first, then code it, then run the CHECK.
  Run the tests from the backend/ folder:  pytest tests/test_content_based.py -q
"""

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix, hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer

TAG_WEIGHT = 0.5  # how much tags count compared to words


def dish_text(food) -> str:
    """Words that describe a dish: its name plus the stations that serve it."""
    # STEP 1 -------------------------------------------------------------------
    # GOAL: return ONE string: the dish's name, then its station names,
    #       all separated by single spaces.
    #       `food` is one row of the dishes table. food["name"] is a string,
    #       food["stations"] is a LIST of strings.
    string = food["name"]+ str.join(food["stations"])
    return string
    # EXAMPLE: name "Mock Grilled Chicken Breast", stations ["Grill"]
    #          -> "Mock Grilled Chicken Breast Grill"
    # HINT 1: you can join strings together with +
    # HINT 2: how could you turn the list ["Grill", "Wok"] into "Grill Wok"?
    #         (look up Python's str.join)
    # CHECK: pytest tests/test_content_based.py -k dish_text   -> 1 passed
    raise NotImplementedError("Step 1")


def dish_tags(food) -> list[str]:
    """Yes/no facts from UCLA's icons, e.g. ["diet:vegan", "allergen:soy", "carbon:low"]."""
    # STEP 2 -------------------------------------------------------------------
    # GOAL: return a LIST of labels, built in this exact order:
    #       1) "diet:<tag>"     for every item in food["dietary_tags"]
    #       2) "allergen:<tag>" for every item in food["allergens"]
    #       3) "carbon:<value>" for food["carbon_footprint"], but ONLY if it
    #          isn't an empty string
    # EXAMPLE: dietary_tags ["halal"], allergens [], carbon_footprint "low"
    #          -> ["diet:halal", "carbon:low"]
    #          dietary_tags [], allergens ["soy"], carbon_footprint ""
    #          -> ["allergen:soy"]
    # HINT 1: an f-string builds text from a variable: f"diet:{t}"
    # HINT 2: start with an empty list and add to it, or use a list comprehension.
    # HINT 3: an empty string "" counts as False in an if-statement.
    # CHECK: pytest tests/test_content_based.py -k dish_tags   -> 1 passed
    raise NotImplementedError("Step 2")


class ContentBasedRecommender:
    name = "content"

    def fit(self, foods: pd.DataFrame, swipes: pd.DataFrame) -> "ContentBasedRecommender":
        # STEP 3 ---------------------------------------------------------------
        # GOAL: turn every dish into a row of numbers. Create these attributes
        #       (later steps and the tests use these exact names), then `return self`.
        #   self.food_ids    list of dish ids, in table order   e.g. ["recipe:1", "recipe:2", ...]
        #   self.row         dict: dish id -> its row number    e.g. {"recipe:1": 0, "recipe:2": 1, ...}
        #   self.tfidf       a TfidfVectorizer(stop_words="english")
        #   self.mlb         a MultiLabelBinarizer()
        #   self.X           the words table and the tags table glued side by side,
        #                    with the tags multiplied by TAG_WEIGHT
        #   self.popularity  pandas Series: dish id -> (likes + 1) / (swipes + 2)
        # EXAMPLE: with the 5 test dishes, self.X has 5 rows and self.row["recipe:3"] == 2
        # HINT 1: foods["id"] is the id column. enumerate(...) gives (position, item) pairs.
        # HINT 2: foods.apply(dish_text, axis=1) runs your Step 1 function on every row.
        #         The same trick works for dish_tags.
        # HINT 3: self.tfidf.fit_transform(texts) -> words table (one row per dish).
        #         self.mlb.fit_transform(tag_lists) -> 0/1 table. Wrap that one as
        #         csr_matrix(... .astype(float)) so it matches the words table.
        # HINT 4: hstack([table_a, table_b]).tocsr() glues two tables side by side.
        # HINT 5: swipes.groupby("food_id")["liked"].agg(["sum", "count"]) gives
        #         likes and swipe counts per dish. Then .reindex(self.food_ids)
        #         .fillna(0.5) gives every dish a value, even never-swiped ones.
        # CHECK: pytest tests/test_content_based.py -q   -> 3 passed
        raise NotImplementedError("Step 3")

    def build_profile(self, user_history: pd.DataFrame):
        """Average of liked dish vectors minus average of disliked ones. None if no likes."""
        # STEP 4 ---------------------------------------------------------------
        # GOAL: return ONE row of numbers that describes this student's taste:
        #       (average of the rows of self.X they liked)
        #     - (average of the rows of self.X they disliked)
        #       If they liked nothing, return None. There's no taste to describe yet.
        #       user_history has columns "food_id" and "liked" (True / False).
        # EXAMPLE: liked recipe:1, disliked recipe:3 -> an array with 1 row and
        #          the same number of columns as self.X
        # HINT 1: user_history.loc[user_history["liked"], "food_id"] gives the
        #         liked ids. The ~ symbol flips True/False ("not liked").
        # HINT 2: self.row[some_id] turns an id into a row number of self.X.
        # HINT 3: self.X[list_of_row_numbers].mean(axis=0) averages rows column by
        #         column. Wrap it in np.asarray(...) so you can subtract.
        # HINT 4: only subtract if there were any dislikes.
        # CHECK: pytest tests/test_content_based.py -q   -> 5 passed
        raise NotImplementedError("Step 4")

    def score(self, user_history: pd.DataFrame, candidate_food_ids: list[str]) -> pd.Series:
        # STEP 5 ---------------------------------------------------------------
        # GOAL: return a pandas Series with one score per candidate dish,
        #       indexed by the dish ids.
        #       - No taste profile (Step 4 returned None)? Cold start: return
        #         the popularity of the candidates.
        #       - Otherwise: the cosine similarity between the profile and each
        #         candidate's row of self.X.
        # EXAMPLE: a student who liked the chicken dishes and disliked the fruit
        #          cup should score Chicken Tortilla Soup above Melon Fruit Salad.
        # HINT 1: use your Step 4 method: self.build_profile(user_history)
        # HINT 2: self.popularity.loc[candidate_food_ids]
        # HINT 3: cosine_similarity(profile, some_rows_of_X) gives a 1 x N table;
        #         .ravel() flattens it into N numbers.
        # HINT 4: pd.Series(numbers, index=candidate_food_ids)
        # CHECK: pytest tests/test_content_based.py -q   -> 7 passed!
        raise NotImplementedError("Step 5")