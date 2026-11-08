"""Try the recommender on 301 real UCLA dishes (Oct 15, 2026).

Put ucla_dishes_2026-10-15.csv in data/raw/ first (it's gitignored), then:
    python -m scripts.try_recommender
"""

from pathlib import Path

import pandas as pd

from app.ml.content_based import ContentBasedRecommender

CSV = Path(__file__).resolve().parents[2] / "data" / "raw" / "ucla_dishes_2026-10-15.csv"

# Load the dishes and turn the "a|b|c" columns into Python lists
foods = pd.read_csv(CSV, dtype=str, keep_default_na=False).rename(columns={"food_id": "id"})
for col in ["dietary_tags", "allergens", "stations"]:
    foods[col] = foods[col].apply(lambda s: [x for x in s.split("|") if x])

model = ContentBasedRecommender().fit(foods, pd.DataFrame({"food_id": [], "liked": []}))

# A pretend student: likes two grilled chicken dishes, dislikes two fruits
liked = list(foods.loc[foods["name"].str.contains("Grilled Chicken"), "id"].head(2))
disliked = ["recipe:6445", "recipe:6440"]  # Cantaloupe, Pineapple
student = pd.DataFrame({"food_id": liked + disliked, "liked": [True] * len(liked) + [False] * len(disliked)})

# Only rank what's actually served at Bruin Plate dinner
tonight = foods[foods["hall_meals"].str.contains("bruin-plate:dinner") & ~foods["id"].isin(student["food_id"])]
scores = model.score(student, list(tonight["id"]))

top = scores.sort_values(ascending=False).head(5)
print("Liked:", ", ".join(foods.set_index("id").loc[liked, "name"]))
print("Top picks at Bruin Plate dinner:")
for food_id, score in top.items():
    print(f"  {score:.3f}  {foods.set_index('id').loc[food_id, 'name']}")
