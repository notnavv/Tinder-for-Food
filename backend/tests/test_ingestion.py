from datetime import date
from pathlib import Path

import pytest

from app.core.config import get_settings
from app.services.ingestion.fetch import PoliteFetcher, ScrapingDisabledError
from app.services.ingestion.parse import parse_hall_page

FIXTURE = Path(__file__).parent / "fixtures" / "hall_page_sample.html"


def test_fetcher_refuses_when_scraping_disabled(monkeypatch):
    monkeypatch.setenv("ALLOW_UCLA_SCRAPING", "false")
    get_settings.cache_clear()
    with pytest.raises(ScrapingDisabledError):
        PoliteFetcher(allow_network=True)


def test_fetcher_requires_explicit_network_flag(monkeypatch):
    monkeypatch.setenv("ALLOW_UCLA_SCRAPING", "true")
    get_settings.cache_clear()
    with pytest.raises(ScrapingDisabledError):
        PoliteFetcher(allow_network=False)
    get_settings.cache_clear()


# Remove the xfail marker once parse_hall_page is implemented.
@pytest.mark.xfail(raises=NotImplementedError, reason="TODO: implement parse_hall_page")
def test_parse_hall_page_sample():
    items = parse_hall_page(FIXTURE.read_text(), "bruin-plate", date(2026, 10, 15))
    assert [(i.meal_period.lower(), i.station, i.source_type, i.source_id) for i in items] == [
        ("breakfast", "Freshly Bowled", "recipe", "881"),
        ("lunch", "Sushi", "ingredient", "6869"),  # empty card skipped
    ]
    assert items[0].name == "Tri-Tip, Red Potato, Egg, & Arugula Bowl"
    assert items[0].icon_titles == ["High-carbon", "Eggs"]
