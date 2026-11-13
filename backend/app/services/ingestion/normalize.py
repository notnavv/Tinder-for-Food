"""Raw parsed values -> database values.

  "BREAKFAST" / "Extended Dinner"   -> "breakfast" / "extended_dinner"  (app.core.vocab.MEAL_PERIODS)
  icon "Tree-nuts"                  -> allergen "tree_nuts"             (app.core.vocab.ALLERGENS)
  icon "Vegan"                      -> dietary tag "vegan"              (app.core.vocab.DIETARY_TAGS)
  icon "Low-carbon"                 -> carbon_footprint "low"
Unknown icon titles: keep going, but add a warning to the IngestionReport.

HOW TO USE THIS FILE (Track A, part 1)
  Three small functions. For each one: read the GOAL and EXAMPLE, say your plan
  out loud, delete the `raise NotImplementedError` line, and write your code there.
  Run from backend/:  pytest tests/test_normalize.py -q
  When everything passes, delete these HOW TO USE notes and every GOAL/HINT comment.
  Ruff will say some imports are unused until your code uses them. That's expected:
  do NOT run `ruff check --fix` before you're done, or it deletes imports you need.
"""

from app.core.vocab import ALLERGENS, DIETARY_TAGS, MEAL_PERIODS


def to_key(raw: str) -> str:
    """'Tree-nuts' -> 'tree_nuts', 'Extended Dinner' -> 'extended_dinner'."""
    # STEP 1 -------------------------------------------------------------------
    # GOAL: turn any UCLA label into our style: lowercase, no spaces around it,
    #       and "-" or " " inside it become "_".
    # EXAMPLE: "Tree-nuts" -> "tree_nuts"   " Extended Dinner " -> "extended_dinner"
    # HINT 1: strings have .strip(), .lower() and .replace(old, new).
    # HINT 2: you can chain them: raw.strip().lower()...

    
    return raw.strip().lower().replace(" ", '_').replace("-", "_")


def normalize_meal_period(raw: str) -> str:
    # STEP 2 -------------------------------------------------------------------
    # GOAL: return our meal name, e.g. "BREAKFAST" -> "breakfast".
    #       If the result isn't one of MEAL_PERIODS, raise a ValueError, so a
    #       typo never sneaks into the database.
    # EXAMPLE: "Extended Dinner" -> "extended_dinner"   "second breakfast" -> ValueError
    # HINT 1: use your Step 1 function.
    # HINT 2: `if meal not in MEAL_PERIODS: raise ValueError(f"Unknown meal period: {raw!r}")`
    # CHECK: pytest tests/test_normalize.py -k meal   -> 6 passed
    meal = to_key(raw)

    if meal not in MEAL_PERIODS:
      raise ValueError(f"Unknown meal period: {raw!r}")

    return meal


def classify_icons(icon_titles: list[str]) -> tuple[list[str], list[str], str | None, list[str]]:
    """Return (allergens, dietary_tags, carbon_footprint, unknown_titles)."""
    # STEP 3 -------------------------------------------------------------------
    # GOAL: sort a dish's icon titles into four buckets and return all four:
    #         allergens       e.g. ["eggs", "tree_nuts"]   (in vocab.ALLERGENS)
    #         dietary_tags    e.g. ["vegan"]               (in vocab.DIETARY_TAGS)
    #         carbon_footprint  "low", "high", or None     (from "Low-carbon" / "High-carbon")
    #         unknown_titles  anything else, AS UCLA WROTE IT, e.g. ["Spicy"]
    # EXAMPLE: ["High-carbon", "Eggs"]          -> (["eggs"], [], "high", [])
    #          ["Vegan", "Soy", "Low-carbon"]   -> (["soy"], ["vegan"], "low", [])
    #          ["Vegan", "Spicy"]               -> ([], ["vegan"], None, ["Spicy"])

    allergens: list[str] = []
    dietary_tags: list[str] =[]
    carbon_footprint: str | None = None
    unknown_titles: list[str] = []

    for title in icon_titles:
        key = to_key(title)
        if key == "low_carbon":
            carbon_footprint = "low"
        elif key == "high_carbon":
            carbon_footprint = "high"
        elif key in ALLERGENS:
            allergens.append(key)
        elif key in DIETARY_TAGS:
            dietary_tags.append(key)
        else:
            unknown_titles.append(title)

    return allergens, dietary_tags, carbon_footprint, unknown_titles
    



  
    # HINT 1: start with three empty lists and carbon_footprint = None.
    # HINT 2: loop over icon_titles; turn each into a key with to_key().
    # HINT 3: check carbon first ("low_carbon" / "high_carbon"), then
    #         `key in ALLERGENS`, then `key in DIETARY_TAGS`, else unknown.
    # HINT 4: keep the original title (not the key) in the unknown list.
    # HINT 5: return them in this exact order, as a tuple: return a, b, c, d
    # CHECK: pytest tests/test_normalize.py -q   -> 12 passed
