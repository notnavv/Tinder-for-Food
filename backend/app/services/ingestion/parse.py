"""HTML -> ParsedMenuItem / RecipeDetail.

Selectors validated on all 4 residential halls, 2026-10-15:
  meal period section   div.anchor-float#breakfastmenu / #lunchmenu / #dinnermenu
  station               div.meal-station  (heading: .category-heading h2)
  dish card             section.recipe-card
  dish name             .menu-item-title h3
  detail link           a.recipe-detail-link  href="/menu-item/?recipe=881"
                                              or    "/menu-item/?ingredient=8618"
  icons                 img.menu-meal-station__allergen-icon[title]
Known quirks: some cards are empty (no name, no link). Skip them and add a warning.
"""

from datetime import date

from app.services.ingestion.models import ParsedMenuItem, RecipeDetail


def parse_hall_page(html: str, hall_slug: str, service_date: date) -> list[ParsedMenuItem]:
    raise NotImplementedError("TODO: see tests/test_ingestion.py for the expected output")


def parse_detail_page(html: str, source_type: str, source_id: str) -> RecipeDetail:
    raise NotImplementedError("TODO")
