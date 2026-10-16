"""Manual, one-off check of how UCLA's menu pages are structured.

This is NOT the ingestion pipeline. It fetches one page per hall (a handful of
requests, spaced out), counts the HTML structures we rely on, and prints a
report. Use it to confirm the parser's assumptions still hold, e.g. after UCLA
changes their site.

    python -m scripts.inspect_menu_structure --date 2026-10-15
    python -m scripts.inspect_menu_structure --date 2026-10-15 --save-html

Saved HTML goes to data/raw/ (gitignored).
"""

import argparse
import re
import time
from collections import Counter
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from app.core.halls import RESIDENTIAL_HALLS

USER_AGENT = "TinderForFood-UCLA-StudentProject/0.1 (structure check; Art.Ificial at UCLA)"
DELAY_SECONDS = 3
RAW_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"


def inspect_page(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select("section.recipe-card")
    recipe_ids, icon_titles, missing = [], Counter(), Counter()
    for card in cards:
        link = card.select_one("a.recipe-detail-link")
        match = re.search(r"recipe=(\d+)", link["href"]) if link else None
        if match:
            recipe_ids.append(match.group(1))
        else:
            missing["recipe_id"] += 1
        if not card.select_one(".menu-item-title h3"):
            missing["name"] += 1
        for img in card.select("img.menu-meal-station__allergen-icon"):
            icon_titles[img.get("title", "?")] += 1

    meal_sections = [div["id"] for div in soup.select("div.anchor-float[id$='menu']")]
    stations = soup.select("div.meal-station")
    dates = [o["value"] for o in soup.select("#jump-to-date option") if o.get("value")]
    return {
        "meal_sections": meal_sections,
        "stations": len(stations),
        "cards": len(cards),
        "unique_recipe_ids": len(set(recipe_ids)),
        "missing": dict(missing),
        "icons": dict(icon_titles.most_common()),
        "date_options": dates,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--date", required=True, help="YYYY-MM-DD")
    parser.add_argument("--save-html", action="store_true")
    args = parser.parse_args()

    all_ids: dict[str, set[str]] = {}
    for i, hall in enumerate(RESIDENTIAL_HALLS):
        if i:
            time.sleep(DELAY_SECONDS)
        url = f"{hall.source_url}?date={args.date}"
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
        print(f"\n== {hall.name} ({resp.status_code}) {url}")
        resp.raise_for_status()
        if args.save_html:
            RAW_DIR.mkdir(parents=True, exist_ok=True)
            (RAW_DIR / f"{hall.slug}_{args.date}.html").write_text(resp.text, encoding="utf-8")
        report = inspect_page(resp.text)
        for key, value in report.items():
            print(f"  {key}: {value}")
        soup = BeautifulSoup(resp.text, "html.parser")
        all_ids[hall.slug] = {
            m.group(1) for a in soup.select("a.recipe-detail-link") if (m := re.search(r"recipe=(\d+)", a["href"]))
        }

    print("\n== Recipe IDs shared across halls")
    slugs = list(all_ids)
    for a_i, a in enumerate(slugs):
        for b in slugs[a_i + 1 :]:
            print(f"  {a} & {b}: {len(all_ids[a] & all_ids[b])}")


if __name__ == "__main__":
    main()
