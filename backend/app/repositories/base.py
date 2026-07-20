from typing import Generic, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """
    Base repository containing common CRUD helpers.
    """

    def __init__(
        self,
        session: AsyncSession,
    ):
        self.session = session

    async def add(
        self,
        instance: ModelType,
    ) -> ModelType:

        try:
            self.session.add(instance)

            await self.session.commit()

            await self.session.refresh(instance)

            return instance

        except Exception:
            await self.session.rollback()
            raise

    async def commit(self) -> None:

        try:
            await self.session.commit()

        except Exception:
            await self.session.rollback()
            raise

    async def refresh(
        self,
        instance: ModelType,
    ) -> None:

        await self.session.refresh(instance)

    async def delete(
        self,
        instance: ModelType,
    ) -> None:

        try:
            await self.session.delete(instance)

            await self.session.commit()

        except Exception:
            await self.session.rollback()
            raise
