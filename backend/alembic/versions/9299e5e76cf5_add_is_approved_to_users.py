"""add is approved to users

Revision ID: 9299e5e76cf5
Revises: c8cd11e6cc41
Create Date: 2026-06-18

"""

from typing import Sequence, Union

from alembic import op


revision: str = "9299e5e76cf5"
down_revision: Union[str, None] = "c8cd11e6cc41"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE users
        DROP COLUMN IF EXISTS is_approved
        """
    )