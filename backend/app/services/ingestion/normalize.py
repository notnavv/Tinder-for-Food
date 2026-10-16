"""Raw parsed values -> database values.

  "BREAKFAST" / "Extended Dinner"   -> "breakfast" / "extended_dinner"  (app.core.vocab.MEAL_PERIODS)
  icon "Tree-nuts"                  -> allergen "tree_nuts"             (app.core.vocab.ALLERGENS)
  icon "Vegan"                      -> dietary tag "vegan"              (app.core.vocab.DIETARY_TAGS)
  icon "Low-carbon"                 -> carbon_footprint "low"
Unknown icon titles: keep going, but add a warning to the IngestionReport.
"""


def normalize_meal_period(raw: str) -> str:
    raise NotImplementedError("TODO")


def classify_icons(icon_titles: list[str]) -> tuple[list[str], list[str], str | None, list[str]]:
    """Return (allergens, dietary_tags, carbon_footprint, unknown_titles)."""
    raise NotImplementedError("TODO")
