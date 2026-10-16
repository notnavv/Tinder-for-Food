from fastapi import APIRouter

from app import __version__
from app.core.config import get_settings
from app.schemas.contracts import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        version=__version__,
        use_mock_data=settings.use_mock_data,
        supabase_configured=settings.supabase_configured,
    )
