"""Controlled vocabularies shared by ingestion, ML, Food DNA and the frontend.

Values are lowercase snake_case. UCLA's icon titles (e.g. "Tree-nuts",
"Crustacean-shellfish", "Low-carbon") map onto these. Observed on 2026-10-15
across all four residential halls.
"""

DIETARY_TAGS = {"vegan", "vegetarian", "halal"}

ALLERGENS = {
    "dairy", "eggs", "fish", "crustacean_shellfish", "gluten", "wheat",
    "soy", "sesame", "peanut", "tree_nuts", "alcohol",
}  # fmt: skip

CARBON_FOOTPRINT = {"low", "high"}

MEAL_PERIODS = {"breakfast", "brunch", "lunch", "dinner", "extended_dinner", "late_night"}

# Team-assigned labels (UCLA doesn't publish these). Agree on the final lists
# as a team; keep them short so Food DNA has enough swipes per value to mean something.
CUISINES: set[str] = set()  # TODO
PROTEIN_CATEGORIES: set[str] = set()  # TODO
