"""fix workspace boolean defaults

Revision ID: 1f5afe2fafd4
Revises: 26d9f5ee575b
Create Date: 2026-07-19 11:09:50.438530

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1f5afe2fafd4'
down_revision: Union[str, Sequence[str], None] = '26d9f5ee575b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "workspaces",
        "is_deleted",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=sa.text("false"),
    )

    op.alter_column(
        "workspaces",
        "is_favorite",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=sa.text("false"),
    )


def downgrade() -> None:
    op.alter_column(
        "workspaces",
        "is_deleted",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=None,
    )

    op.alter_column(
        "workspaces",
        "is_favorite",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=None,
    )