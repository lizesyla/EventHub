"""merge migration heads

Revision ID: 3c667a82c1e5
Revises: 26016f945c47, 874fa74adb0d
Create Date: 2026-06-22 18:48:50.152940

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3c667a82c1e5'
down_revision: Union[str, None] = ('26016f945c47', '874fa74adb0d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
