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
from bs4 import BeautifulSoup, NavigableString

from app.services.ingestion.models import ParsedMenuItem, RecipeDetail


def parse_hall_page(html: str, hall_slug: str, service_date: date) -> list[ParsedMenuItem]:
    soup = BeautifulSoup(html, "html.parser")         
    items = []

    for box in soup.select("div.meal-station"):        
        meal = box.get("id", "").split("-")[0]        

        heading = box.select_one(".category-heading h2")   
        station = heading.get_text(strip=True) if heading else ""

        for card in box.select("section.recipe-card"):     
            h3 = card.find("h3")
            link = card.find("a", href=True)
            if h3 is None or link is None:                 
                continue
            source_key = extract_source_key(link["href"])
            if source_key is None:
                continue

            items.append(ParsedMenuItem(                
                hall_slug=hall_slug,
                service_date=service_date,
                meal=meal,
                station=station,
                name=h3.get_text(strip=True),
                source_key=source_key,
                detail_url=urljoin("https://dining.ucla.edu", link["href"]),
            ))

    return items

def parse_detail_page(html: str, source_type: str, source_id: str) -> RecipeDetail:
    raise NotImplementedError("TODO")
