from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.exceptions import InvalidTokenException
from app.auth.jwt import decode_access_token
from app.db import get_session, current_user_id
from app.models.user import User
from app.repositories.user_repository import UserRepository

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    """
    Returns the currently authenticated user from the JWT Bearer token or query parameter.
    """

    if credentials:
        token = credentials.credentials
    else:
        token = request.query_params.get("token")
        
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise InvalidTokenException()

    public_id = payload.get("sub")

    if public_id is None:
        raise InvalidTokenException()

    repo = UserRepository(session)

    user = await repo.get_by_public_id(public_id)

    if user is None:
        raise InvalidTokenException()

    current_user_id.set(user.id)

    return user
