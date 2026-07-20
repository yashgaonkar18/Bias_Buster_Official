from datetime import datetime, timezone

from sqlalchemy import delete, select

from app.models.refresh_token import RefreshToken
from app.repositories.base import BaseRepository


class TokenRepository(BaseRepository[RefreshToken]):
    """
    Repository responsible for refresh token persistence.
    """

    async def create(
        self,
        token: RefreshToken,
    ) -> RefreshToken:
        """
        Persist refresh token.
        """

        return await self.add(token)

    async def get_by_hash(
        self,
        token_hash: str,
    ) -> RefreshToken | None:
        """
        Retrieve refresh token by SHA256 hash.
        """

        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked.is_(False),
            )
        )

        return result.scalar_one_or_none()

    async def get_valid_token(
        self,
        token_hash: str,
    ) -> RefreshToken | None:
        """
        Retrieve only active and non-expired refresh token.
        """

        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked.is_(False),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )

        return result.scalar_one_or_none()

    async def revoke(
        self,
        token: RefreshToken,
    ) -> None:
        """
        Revoke a refresh token.
        """

        token.revoked = True

        await self.commit()

    async def revoke_all(
        self,
        user_id: int,
    ) -> None:
        """
        Revoke every active session belonging to a user.
        """

        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked.is_(False),
            )
        )

        tokens = result.scalars().all()

        for token in tokens:
            token.revoked = True

        await self.commit()

    async def delete_expired(self) -> None:
        """
        Delete expired and revoked refresh tokens.
        """

        await self.session.execute(
            delete(RefreshToken).where(
                RefreshToken.revoked.is_(True),
                RefreshToken.expires_at < datetime.now(timezone.utc),
            )
        )

        await self.commit()
