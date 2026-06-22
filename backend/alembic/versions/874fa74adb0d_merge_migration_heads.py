"""merge migration heads

Revision ID: 874fa74adb0d
Revises: 6bbca78a24b4, f1a2b3c4d5e6
Create Date: 2026-06-22 12:41:26.755719

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '874fa74adb0d'
down_revision: Union[str, None] = ('6bbca78a24b4', 'f1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
