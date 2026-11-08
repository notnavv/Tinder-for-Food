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

HOW TO USE THIS FILE
  The cleanup is done for you: the notebook leftovers are gone and your
  extract_source_key is kept as-is. Your job is parse_hall_page below.
  Read its GOAL, EXAMPLE and PLAN, talk it through with your partner, then
  delete the `raise NotImplementedError` line and write your code in its place.
  Run the test from the backend/ folder:  pytest tests/test_ingestion.py -q
  When it passes, delete these HOW TO USE notes and the PLAN/HINT comments.
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
    # GOAL: return a LIST of ParsedMenuItem objects, one per dish card, in the
    #       order they appear on the page. Each one must know its meal and station.
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

            results.append(ParsedMenuItem(hall_slug=hall_slug, service_date=service_date, meal_period=meal, station=station, name=name, source_type=source_type, source_id=source_id, icon_titles=icon_titles, detail_url=urljoin(BASE_URL, href),))
    return results





    # EXAMPLE: the test page (tests/fixtures/hall_page_sample.html) has 2 stations
    #          and 3 cards, one of them empty. You should return 2 items:
    #            meal "breakfast", station "Freshly Bowled", ("recipe", "881"),
    #              name "Tri-Tip, Red Potato, Egg, & Arugula Bowl",
    #              icon_titles ["High-carbon", "Eggs"]
    #            meal "lunch", station "Sushi", ("ingredient", "6869"), ...
    #
    # WHY THE NOTEBOOK VERSION DIDN'T WORK: it searched the whole page for links,
    # so a link never knew which meal or station it was in. Here you walk the
    # page from the outside in: station box -> dish card -> pieces of the card.
    #
    # PLAN (one line of English per step; turn each into 1-3 lines of code):
    #   1. Make the soup from html.
    #   2. Start an empty list for the results.
    #   3. Loop over every station box on the page.
    #        a. Work out the meal from the box's id.
    #        b. Work out the station name from the box's heading.
    #   4. Inside that loop, loop over the dish cards IN THIS BOX.
    #        a. Find the card's name (h3) and link. Missing either? Skip the card.
    #        b. Get (source_type, source_id) from the link's href. No id? Skip.
    #        c. Collect the icon titles into a list.
    #        d. Add one ParsedMenuItem to your list.
    #   5. Return the list.
    #
    # HINT 1: BeautifulSoup(html, "html.parser") makes the soup. .select("css")
    #         finds ALL matches (a list); .select_one("css") finds the first one,
    #         or None if there isn't one.
    # HINT 2: call .select on the box (not on soup) to search only inside it.
    # HINT 3: box.get("id", "") gives "breakfast-Freshly-Bowled". How do you keep
    #         only the part before the first "-"? (look up str.split)
    # HINT 4: some_tag.get_text(strip=True) gives a tag's text without extra spaces.
    #         link.get("href", "") gives the link's address.
    # HINT 5: `continue` jumps straight to the next card in the loop.
    # HINT 6: an image's title is img["title"]. A list comprehension or a loop
    #         with .append both work.
    # HINT 7: open models.py to see ParsedMenuItem's fields. Use names:
    #         ParsedMenuItem(hall_slug=hall_slug, service_date=service_date, ...)
    #         detail_url is the full address: urljoin(BASE_URL, href)
    #
    # CHECK: pytest tests/test_ingestion.py -q            -> 3 passed
    #        python -m scripts.ingest_menus --date 2026-10-15
    #          -> Bruin Plate 149, De Neve 130, Epicuria 111, Feast 43 items
    raise NotImplementedError("parse_hall_page")


def parse_detail_page(html: str, source_type: str, source_id: str) -> RecipeDetail:
    """Protein, ingredients and nutrition from a dish's detail page. Not yet."""
    raise NotImplementedError("TODO")