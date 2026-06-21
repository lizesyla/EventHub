"""merge multiple heads

Revision ID: 71d73b0a40c8
Revises: 6bbca78a24b4, f1a2b3c4d5e6
Create Date: 2026-06-21 17:15:16.252497

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71d73b0a40c8'
down_revision: Union[str, None] = ('6bbca78a24b4', 'f1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
