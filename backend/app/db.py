from typing import AsyncGenerator
import contextvars
from sqlalchemy import event, and_
from sqlalchemy.ext.asyncio import AsyncSession, AsyncEngine, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base, with_loader_criteria, Session
from .config import settings

DATABASE_URL = settings.DATABASE_URL

engine: AsyncEngine = create_async_engine(DATABASE_URL, future=True, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

current_user_id = contextvars.ContextVar("current_user_id", default=None)

@event.listens_for(Session, "before_flush")
def receive_before_flush(session, flush_context, instances):
    uid = current_user_id.get()
    if uid:
        for obj in session.new:
            if hasattr(obj, "user_id") and getattr(obj, "user_id", None) is None:
                obj.user_id = uid

@event.listens_for(Session, "do_orm_execute")
def receive_do_orm_execute(execute_state):
    uid = current_user_id.get()
    if uid and execute_state.is_select and not execute_state.is_column_load:
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                Base,
                lambda cls: getattr(cls, "user_id", uid) == uid,
                include_aliases=True
            )
        )

# dependency for routes
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session