"""add is_approved to users

Revision ID: f1a2b3c4d5e6
Revises: c8cd11e6cc41
Create Date: 2026-06-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "c8cd11e6cc41"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users "
        "ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS is_approved")
