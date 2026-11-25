from datetime import date
from urllib.parse import parse_qs, urljoin, urlparse

from bs4 import BeautifulSoup

from app.services.ingestion.models import ParsedMenuItem, RecipeDetail

BASE_URL = "https://dining.ucla.edu"


def extract_source_key(href):
    query = parse_qs(urlparse(href).query)

    if "recipe" in query:
        return ("recipe", query["recipe"][0])
    elif "ingredient" in query:
        return ("ingredient", query["ingredient"][0])
    else:
        return (None, None)


def parse_hall_page(html: str, hall_slug: str, service_date: date) -> list[ParsedMenuItem]:
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
    raise NotImplementedError("TODO")
