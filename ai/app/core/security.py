"""
Service-to-service security for the AI layer.

This service is internal: only the SkillBridge backend may call it. End users authenticate
against the backend (JWT); the backend then calls this service with a shared key and, for
user-scoped routes, the id of the authenticated user it is acting for.
"""
import hmac
from fastapi import HTTPException, Request, status
from app.core.config import settings

INTERNAL_KEY_HEADER = "X-Internal-Service-Key"
ACTING_USER_HEADER = "X-Acting-User-Id"

# Path parameters that identify whose personal data a route operates on.
USER_SCOPED_PATH_PARAMS = ("user_id", "entity_id")


def _constant_time_equals(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


async def verify_internal_request(request: Request) -> None:
    """
    Dependency applied to every router except the health check.

    1. The caller must present the shared service key (401 otherwise).
    2. If the route targets a specific user, the caller must state which authenticated user it
       acts for, and that must be the same user (403 otherwise). This stops one user's session
       from being used to read or erase another user's data through this service.
    """
    presented = request.headers.get(INTERNAL_KEY_HEADER, "")
    if not presented or not _constant_time_equals(presented, settings.INTERNAL_SERVICE_KEY):
        # Deliberately identical for "missing" and "wrong" so nothing is revealed about the key
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing service credentials.",
        )

    for param in USER_SCOPED_PATH_PARAMS:
        target_user = request.path_params.get(param)
        if target_user is None:
            continue
        acting_user = request.headers.get(ACTING_USER_HEADER, "")
        if not acting_user or not _constant_time_equals(acting_user, str(target_user)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access another user's data.",
            )


async def verify_internal_request_in_production(request: Request) -> None:
    """For the developer status pages: open locally, protected once deployed."""
    if settings.is_production:
        await verify_internal_request(request)
