"""Menu ingestion command.

Default is SAFE: reads saved HTML from data/raw/ and writes nothing.

    # Parse saved pages (from inspect_menu_structure --save-html), print results
    python -m scripts.ingest_menus --date 2026-10-15

    # Also write to Supabase
    python -m scripts.ingest_menus --date 2026-10-15 --write

    # Live fetch (needs ALLOW_UCLA_SCRAPING=true in backend/.env as well)
    python -m scripts.ingest_menus --date 2026-10-15 --allow-network --write

Do NOT schedule this to run unattended until the team lead confirms UCLA
permission.
"""

import argparse
import sys
from datetime import date
from pathlib import Path

from app.core.halls import RESIDENTIAL_HALLS
from app.services.ingestion.fetch import PoliteFetcher, ScrapingDisabledError
from app.services.ingestion.models import IngestionReport
from app.services.ingestion.parse import parse_hall_page
from app.services.ingestion.upsert import record_run, upsert_menu_items

RAW_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest UCLA residential dining menus")
    parser.add_argument("--date", type=date.fromisoformat, required=True, help="YYYY-MM-DD")
    parser.add_argument("--hall", choices=[h.slug for h in RESIDENTIAL_HALLS], help="Only this hall")
    parser.add_argument("--allow-network", action="store_true", help="Fetch live pages (gated)")
    parser.add_argument("--write", action="store_true", help="Write to Supabase (default: dry run)")
    args = parser.parse_args()

    halls = [h for h in RESIDENTIAL_HALLS if args.hall in (None, h.slug)]
    report = IngestionReport()

    fetcher = None
    if args.allow_network:
        try:
            fetcher = PoliteFetcher(allow_network=True)
        except ScrapingDisabledError as e:
            print(f"Refusing to fetch: {e}", file=sys.stderr)
            return 2

    all_items = []
    for hall in halls:
        if fetcher:
            html = fetcher.get(f"{hall.source_url}?date={args.date}")
        else:
            saved = RAW_DIR / f"{hall.slug}_{args.date}.html"
            if not saved.exists():
                report.warnings.append(f"No saved HTML at {saved}")
                continue
            html = saved.read_text(encoding="utf-8")
        report.pages_fetched += 1
        items = parse_hall_page(html, hall.slug, args.date)
        report.items_parsed += len(items)
        all_items.extend(items)
        print(f"{hall.name}: {len(items)} items")

    if args.write:
        upsert_menu_items(all_items, report)
        record_run(report, "success" if not report.errors else "partial")
    else:
        print("Dry run: nothing written. Pass --write to save to Supabase.")

    for w in report.warnings:
        print(f"WARNING: {w}", file=sys.stderr)
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
