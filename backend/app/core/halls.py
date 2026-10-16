"""The four residential dining halls in MVP scope.

This list must match the seed rows in supabase/migrations. `slug` is our stable
key; `source_url` is where UCLA publishes that hall's menu.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Hall:
    slug: str
    name: str
    source_url: str


RESIDENTIAL_HALLS: tuple[Hall, ...] = (
    Hall("bruin-plate", "Bruin Plate", "https://dining.ucla.edu/bruin-plate/"),
    Hall("de-neve", "De Neve Dining", "https://dining.ucla.edu/de-neve-dining/"),
    Hall("epicuria-covel", "Epicuria at Covel", "https://dining.ucla.edu/epicuria-at-covel/"),
    # UCLA's URL slug for Feast is "spice-kitchen"; this is not a typo.
    Hall("feast-rieber", "Feast at Rieber", "https://dining.ucla.edu/spice-kitchen/"),
)
