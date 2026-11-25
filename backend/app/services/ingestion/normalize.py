"""Raw parsed values -> database values.

  "BREAKFAST" / "Extended Dinner"   -> "breakfast" / "extended_dinner"  (app.core.vocab.MEAL_PERIODS)
  icon "Tree-nuts"                  -> allergen "tree_nuts"             (app.core.vocab.ALLERGENS)
  icon "Vegan"                      -> dietary tag "vegan"              (app.core.vocab.DIETARY_TAGS)
  icon "Low-carbon"                 -> carbon_footprint "low"
Unknown icon titles: keep going, but add a warning to the IngestionReport.

"""

from app.core.vocab import ALLERGENS, DIETARY_TAGS, MEAL_PERIODS


def to_key(raw: str) -> str:
    """'Tree-nuts' -> 'tree_nuts', 'Extended Dinner' -> 'extended_dinner'."""

    return raw.strip().lower().replace(" ", "_").replace("-", "_")


def normalize_meal_period(raw: str) -> str:
    meal = to_key(raw)

    if meal not in MEAL_PERIODS:
        raise ValueError(f"Unknown meal period: {raw!r}")

    return meal


def classify_icons(icon_titles: list[str]) -> tuple[list[str], list[str], str | None, list[str]]:
    """Return (allergens, dietary_tags, carbon_footprint, unknown_titles)."""

    allergens: list[str] = []
    dietary_tags: list[str] = []
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
