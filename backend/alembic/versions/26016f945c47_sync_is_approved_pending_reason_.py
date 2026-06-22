"""sync pending_reason and notifications

Revision ID: 26016f945c47
Revises: 6bbca78a24b4
Create Date: 2026-06-22 12:51:25.877687

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "26016f945c47"
down_revision: Union[str, None] = "6bbca78a24b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    event_columns = {column["name"] for column in inspector.get_columns("events")}
    if "pending_reason" not in event_columns:
        op.add_column("events", sa.Column("pending_reason", sa.String(length=50), nullable=True))

    if "notifications" not in inspector.get_table_names():
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("message", sa.String(length=255), nullable=False),
            sa.Column("type", sa.String(length=50), nullable=True),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_notifications_id", "notifications", ["id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "notifications" in inspector.get_table_names():
        op.drop_index("ix_notifications_id", table_name="notifications")
        op.drop_table("notifications")

    event_columns = {column["name"] for column in inspector.get_columns("events")}
    if "pending_reason" in event_columns:
        op.drop_column("events", "pending_reason")
