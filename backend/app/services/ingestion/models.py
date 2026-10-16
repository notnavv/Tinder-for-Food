"""Plain data objects passed between pipeline stages."""

from dataclasses import dataclass, field
from datetime import date


@dataclass
class ParsedMenuItem:
    """One card on a hall's menu page, before normalization."""

    hall_slug: str
    service_date: date
    meal_period: str  # raw, e.g. "BREAKFAST"
    station: str | None  # e.g. "Freshly Bowled"
    name: str
    source_type: str  # "recipe" or "ingredient" (from ?recipe=123 / ?ingredient=456)
    source_id: str
    icon_titles: list[str] = field(default_factory=list)  # raw, e.g. ["Vegan", "Tree-nuts"]
    detail_url: str | None = None


@dataclass
class RecipeDetail:
    """Fields from a /menu-item/ detail page. Fetch once per new food, not every day."""

    source_type: str
    source_id: str
    ingredients_text: str | None
    allergens_text: str | None
    serving_size: str | None
    nutrition: dict[str, str] | None


@dataclass
class IngestionReport:
    """Written to the ingestion_runs table at the end of every run."""

    pages_fetched: int = 0
    items_parsed: int = 0
    foods_created: int = 0
    appearances_upserted: int = 0
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
