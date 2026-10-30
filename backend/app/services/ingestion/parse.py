import json
from pathlib import Path
from urllib.parse import urljoin, urlparse, parse_qs
from bs4 import BeautifulSoup

MENU_URL = "https://dining.ucla.edu/menus-at-a-glance/"
SERVICE_DATE = "2026-10-24"  # CHANGE to the date displayed on your saved menu
print("Ready!", MENU_URL)

def extract_source_key(href):
    query = parse_qs(urlparse(href).query)

    if "recipe" in query:
        return ("recipe", query["recipe"][0])
    elif "ingredient" in query:
        return ("ingredient", query["ingredient"][0])
    else:
        return (None, None)

# Checkpoint: should return ('recipe', '881') and ('ingredient', '8618')
print(extract_source_key('/menu-item/?recipe=881'))
print(extract_source_key('/menu-item/?ingredient=8618'))

def extract_foods(soup):
    unique = {}
    for link in soup.select('a[href*="recipe="], a[href*="ingredient="]'):
        name = link.get_text(" ", strip=True)
        href = link.get("href", "")
        source_type, source_id = extract_source_key(href)
        if (name != "" and source_id != None):
          unique[(source_type, source_id)] = {"source_type": source_type, "source_id": source_id, "name": name}

    return list(unique.values())

foods = extract_foods(soup)
print("Unique foods:", len(foods))
print(foods[:2])

def extract_appearances(soup, service_date):
    appearances = []

    for link in soup.select('a[href*="recipe="], a[href*="ingredient="]'):
        href = link.get("href", "")
        source_type, source_id = extract_source_key(href)

        hall = link.find_parent(class_="hall")
        meal = link.find_parent(class_="meal")
        station = link.find_parent(class_="station")

        if not (source_id and hall and meal):
            continue

        dining_hall_slug = hall.get("data-hall")
        meal_period = meal.get("data-meal")

        station_name = None
        if station is not None:
            station_name = station.get("data-station")

        appearances.append({
            "source_type": source_type,
            "source_id": source_id,
            "dining_hall_slug": dining_hall_slug,
            "service_date": service_date,
            "meal_period": meal_period,
            "station": station_name,
            "source_url": urljoin(MENU_URL, href)
        })

    return appearances