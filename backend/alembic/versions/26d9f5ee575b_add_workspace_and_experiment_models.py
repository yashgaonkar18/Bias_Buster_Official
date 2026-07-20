"""Add Workspace and Experiment models

Revision ID: 26d9f5ee575b
Revises: 3132eab6d099
Create Date: 2026-07-07 07:11:36.776333

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '26d9f5ee575b'
down_revision: Union[str, Sequence[str], None] = '3132eab6d099'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('upload_records', sa.Column('experiment_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_upload_records_experiment_id'), 'upload_records', ['experiment_id'], unique=False)
    op.create_foreign_key(None, 'upload_records', 'experiments', ['experiment_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(None, 'upload_records', type_='foreignkey')
    op.drop_index(op.f('ix_upload_records_experiment_id'), table_name='upload_records')
    op.drop_column('upload_records', 'experiment_id')
