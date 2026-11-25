"""HTML -> ParsedMenuItem / RecipeDetail.

Turns one UCLA dining hall page into a list of dishes the rest of the app can use.

Selectors checked on all 4 residential halls, 2026-10-15:
  station box           div.meal-station   id="breakfast-Freshly-Bowled"
  station name          .category-heading h2
  dish card             section.recipe-card
  dish name             .menu-item-title h3
  detail link           a.recipe-detail-link  href="/menu-item/?recipe=881"
                                              or    "/menu-item/?ingredient=8618"
  icons                 img.menu-meal-station__allergen-icon[title]
Known quirk: some cards are empty (no name, no link). Skip them.

"""

from datetime import date
from urllib.parse import parse_qs, urljoin, urlparse

from bs4 import BeautifulSoup

from app.services.ingestion.models import ParsedMenuItem, RecipeDetail

BASE_URL = "https://dining.ucla.edu"


def extract_source_key(href):
    """'/menu-item/?recipe=881' -> ("recipe", "881"). No id in the link -> (None, None)."""
    query = parse_qs(urlparse(href).query)

    if "recipe" in query:
        return ("recipe", query["recipe"][0])
    elif "ingredient" in query:
        return ("ingredient", query["ingredient"][0])
    else:
        return (None, None)


def parse_hall_page(html: str, hall_slug: str, service_date: date) -> list[ParsedMenuItem]:
    """One ParsedMenuItem for every real dish card on a hall's menu page."""
    soup = BeautifulSoup(html, "html.parser")
    results = []
    for station_div in soup.select("div.meal-station"):
        meal = station_div.get("id", "").split("-")[0]
        heading = station_div.select_one(".category-heading h2")
        station = heading.get_text(strip=True) if heading else ""

        for card in station_div.select("section.recipe-card"):
            name_tag = card.select_one(".menu-item-title h3")
            link = card.select_one("a.recipe-detail-link")

            if name_tag is None or link is None:
                continue

            name = name_tag.get_text(strip=True)
            href = link.get("href", "")
            source_type, source_id = extract_source_key(href)

            if not name or not source_id:
                continue

            icon_titles = []
            for img in card.select("img.menu-meal-station__allergen-icon[title]"):
                icon_titles.append(img["title"])

            results.append(
                ParsedMenuItem(
                    hall_slug=hall_slug,
                    service_date=service_date,
                    meal_period=meal,
                    station=station,
                    name=name,
                    source_type=source_type,
                    source_id=source_id,
                    icon_titles=icon_titles,
                    detail_url=urljoin(BASE_URL, href),
                )
            )
    return results


def parse_detail_page(html: str, source_type: str, source_id: str) -> RecipeDetail:
    """Protein, ingredients and nutrition from a dish's detail page. Not yet."""
    raise NotImplementedError("TODO")
