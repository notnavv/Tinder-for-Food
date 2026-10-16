"""Write parsed menus to Supabase.

Rules:
  - foods: upsert on (source_type, source_id). Never create a second row for the same dish.
    Don't overwrite team-assigned cuisine/protein_category.
  - menu_appearances: upsert on (food_id, dining_hall_slug, service_date, meal_period);
    update last_seen_at. Never delete old appearances: they're our menu history.
  - Only fetch detail pages for foods whose ingredients_text is still null.
  - Insert one ingestion_runs row per run with the IngestionReport.
Uses the service-role client (app.core.supabase_client.get_supabase).
"""

from app.services.ingestion.models import IngestionReport, ParsedMenuItem


def upsert_menu_items(items: list[ParsedMenuItem], report: IngestionReport) -> None:
    raise NotImplementedError("TODO")


def record_run(report: IngestionReport, status: str) -> None:
    raise NotImplementedError("TODO")
