from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.exceptions import InvalidTokenException
from app.auth.jwt import decode_access_token
from app.db import get_session
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise InvalidTokenException()

    public_id = payload.get("sub")

    if public_id is None:
        raise InvalidTokenException()

    result = await session.execute(select(User).where(User.public_id == public_id))

    user = result.scalar_one_or_none()

    if user is None:
        raise InvalidTokenException()

    return user
