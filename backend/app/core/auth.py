"""Figuring out which user is calling the API.

The frontend sends the user's Supabase access token as
`Authorization: Bearer <token>`. The backend must verify that token before
trusting the user ID inside it.

TODO: implement real verification in `verify_supabase_token`.

HOW TO USE THIS FILE (Track C)
  Only verify_supabase_token needs code. Read its GOAL and PLAN, delete the
  `raise NotImplementedError` line, and write your code in its place.
  Run from backend/:  pytest tests/test_auth_token.py -q
  When it passes, delete these HOW TO USE notes and the GOAL/PLAN/HINT comments.
  Ruff will say get_supabase is unused until your code uses it. That's expected:
  do NOT run `ruff check --fix` before you're done, or it deletes the import.

Supabase docs: "JWT signing keys". Newer projects sign tokens with asymmetric keys
published at  {SUPABASE_URL}/auth/v1/.well-known/jwks.json ; older projects
use a shared JWT secret. Check which one our project uses, then verify the
signature, `exp`, and `aud == "authenticated"`, and return the `sub` claim.

Until that's done:
  - In development, you can pass `X-Dev-User-Id: <uuid>` to act as a user.
  - Outside development, every authenticated endpoint returns 503.
"""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings
from app.core.supabase_client import get_supabase


def verify_supabase_token(token: str, settings: Settings) -> str:
    """Return the user ID (`sub`) from a valid Supabase access token."""
    # GOAL: the app sends the student's sign-in token. Ask Supabase who it
    #       belongs to and return that user's id. If the token is fake, expired,
    #       or belongs to nobody, refuse with a 401.
    #
    # EXAMPLE: "good-token"    -> "11111111-1111-1111-1111-111111111111"
    #          "made-up-token" -> HTTPException(401)
    #
    # PLAN (3 lines of English -> about 7 lines of code):
    #   1. Ask Supabase: get_supabase().auth.get_user(token)
    #   2. If that raises an error (a bad token does), turn it into a 401.
    #   3. If the answer has no user in it, also a 401. Otherwise return the user's id.
    #
    try:
        response = get_supabase().auth.get_user(token)
        return response.user.id
    except Exception as exc: 
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired sign-in token") 
    # HINT 1: try: ... except Exception as exc: raise HTTPException(...) from exc
    # HINT 2: a 401 looks like:
    #         HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired sign-in token")
    # HINT 3: the answer is an object: response.user is the user (or None),
    #         and response.user.id is the id you return.
    # HINT 4: `settings` isn't needed for this approach. Leave it in the signature;
    #         get_current_user_id below passes it in.
    #
    # WHY ASK SUPABASE? A token is a signed note saying "this is user X". Supabase
    # signed it, so Supabase can check the signature for us. (The other way, checking
    # the signature ourselves, is in the notes at the top of this file. Not needed.)
    #
    # CHECK: pytest tests/test_auth_token.py -q   -> 5 passed
    #        pytest                              -> everything passes


def get_current_user_id(
    settings: Annotated[Settings, Depends(get_settings)],
    authorization: Annotated[str | None, Header()] = None,
    x_dev_user_id: Annotated[str | None, Header()] = None,
) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        try:
            return verify_supabase_token(authorization.split(" ", 1)[1], settings)
        except NotImplementedError:
            pass  # fall through to the dev-only path below

    if settings.app_env == "development":
        if x_dev_user_id:
            return x_dev_user_id
        if settings.use_mock_data:
            return "00000000-0000-0000-0000-000000000000"  # anonymous mock user
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Send X-Dev-User-Id in development until auth is implemented")

    raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "API authentication is not configured yet")


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
