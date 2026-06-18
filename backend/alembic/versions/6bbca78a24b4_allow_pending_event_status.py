"""allow pending event status

Revision ID: 6bbca78a24b4
Revises: 9299e5e76cf5
Create Date: 2026-06-18 21:44:32.062073

"""

from typing import Sequence, Union

from alembic import op


revision: str = "6bbca78a24b4"
down_revision: Union[str, None] = "9299e5e76cf5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check")
    op.execute(
        """
        ALTER TABLE events
        ADD CONSTRAINT events_status_check
        CHECK (status IN ('pending', 'upcoming', 'past', 'cancelled'))
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check")
    op.execute(
        """
        ALTER TABLE events
        ADD CONSTRAINT events_status_check
        CHECK (status IN ('upcoming', 'past', 'cancelled'))
        """
    )