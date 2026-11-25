"""Persist UCLA menu data without overwriting manually assigned labels."""

from dataclasses import asdict
from datetime import UTC, datetime

from app.core.supabase_client import get_supabase
from app.services.ingestion.models import IngestionReport, ParsedMenuItem
from app.services.ingestion.normalize import classify_icons, normalize_meal_period


def upsert_menu_items(items: list[ParsedMenuItem], report: IngestionReport) -> None:
    if not items:
        return

    foods = {}
    appearances = {}
    now = datetime.now(UTC).isoformat()
    for item in items:
        key = (item.source_type, item.source_id)
        service_date = item.service_date.isoformat()
        allergens, diets, carbon, unknown = classify_icons(item.icon_titles)
        for title in unknown:
            warning = f"Unrecognized menu icon: {title}"
            if warning not in report.warnings:
                report.warnings.append(warning)
        meal = normalize_meal_period(item.meal_period)
        foods[key] = {
            "source_type": item.source_type,
            "source_id": item.source_id,
            "name": item.name,
            "allergens": allergens,
            "dietary_tags": diets,
            "carbon_footprint": carbon,
            "last_seen_on": service_date,
        }
        appearances[(key, item.hall_slug, service_date, meal)] = {
            "dining_hall_slug": item.hall_slug,
            "service_date": service_date,
            "meal_period": meal,
            "station": item.station,
            "source_url": item.detail_url,
            "last_seen_at": now,
        }

    db = get_supabase()
    ids = {}
    for source_type in ("recipe", "ingredient"):
        keys = [key for key in foods if key[0] == source_type]
        for offset in range(0, len(keys), 100):
            batch = keys[offset : offset + 100]
            existing = (
                db.table("foods")
                .select("source_id,first_seen_on,last_seen_on")
                .eq("source_type", source_type)
                .in_("source_id", [key[1] for key in batch])
                .execute()
                .data
            )
            by_id = {row["source_id"]: row for row in existing}
            for key in batch:
                row = foods[key]
                old = by_id.get(key[1], {})
                day = row["last_seen_on"]
                row["first_seen_on"] = min(old.get("first_seen_on") or day, day)
                row["last_seen_on"] = max(old.get("last_seen_on") or day, day)
            rows = (
                db.table("foods")
                .upsert([foods[key] for key in batch], on_conflict="source_type,source_id")
                .execute()
                .data
            )
            ids.update({(row["source_type"], row["source_id"]): row["id"] for row in rows})
            report.foods_created += len(batch) - len(existing)

    rows = [{"food_id": ids[key[0]], **row} for key, row in appearances.items()]
    for offset in range(0, len(rows), 100):
        batch = rows[offset : offset + 100]
        db.table("menu_appearances").upsert(
            batch, on_conflict="food_id,dining_hall_slug,service_date,meal_period"
        ).execute()
        report.appearances_upserted += len(batch)


def record_run(report: IngestionReport, status: str) -> None:
    counts = asdict(report)
    warnings = counts.pop("warnings")
    errors = counts.pop("errors")
    get_supabase().table("ingestion_runs").insert(
        {
            "status": status,
            "finished_at": datetime.now(UTC).isoformat(),
            "counts": counts,
            "warnings": warnings,
            "errors": errors,
        }
    ).execute()
