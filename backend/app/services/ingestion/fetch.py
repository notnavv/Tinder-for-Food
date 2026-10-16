"""Polite, gated HTTP fetching from dining.ucla.edu.

Safety rules (do not remove without team-lead approval):
  1. Nothing is fetched unless ALLOW_UCLA_SCRAPING=true AND the caller passes
     allow_network=True (the --allow-network CLI flag). Both default to off.
  2. At most one request every DELAY_SECONDS.
  3. A descriptive User-Agent so UCLA can tell who we are.
"""

import time

import requests

from app.core.config import get_settings

USER_AGENT = "TinderForFood-UCLA-StudentProject/0.1 (Art.Ificial at UCLA)"
DELAY_SECONDS = 3.0
TIMEOUT_SECONDS = 30


class ScrapingDisabledError(RuntimeError):
    pass


class PoliteFetcher:
    def __init__(self, allow_network: bool = False):
        if not get_settings().allow_ucla_scraping:
            raise ScrapingDisabledError(
                "ALLOW_UCLA_SCRAPING is false. It stays off until UCLA's terms/permission are reviewed. "
                "Use saved HTML in data/raw/ for development."
            )
        if not allow_network:
            raise ScrapingDisabledError("Pass --allow-network to confirm you want to make live requests.")
        self._session = requests.Session()
        self._session.headers["User-Agent"] = USER_AGENT
        self._last_request = 0.0
        self.pages_fetched = 0

    def get(self, url: str) -> str:
        wait = DELAY_SECONDS - (time.monotonic() - self._last_request)
        if wait > 0:
            time.sleep(wait)
        resp = self._session.get(url, timeout=TIMEOUT_SECONDS)
        self._last_request = time.monotonic()
        resp.raise_for_status()
        self.pages_fetched += 1
        return resp.text
