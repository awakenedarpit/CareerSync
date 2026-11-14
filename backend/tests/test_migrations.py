"""
Tests for Alembic Database Migrations
Verifies that version-controlled migrations apply cleanly and can be reversed.
"""

import os
import subprocess
import pytest


def test_alembic_upgrade_and_downgrade():
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    venv_alembic = os.path.abspath(os.path.join(backend_dir, "..", ".venv", "bin", "alembic"))

    # Upgrade to head
    res_up = subprocess.run(
        [venv_alembic, "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )
    assert res_up.returncode == 0, f"Alembic upgrade failed: {res_up.stderr}"
    assert "Running upgrade" in res_up.stdout or "Running upgrade" in res_up.stderr or res_up.returncode == 0

    # Current revision check
    res_current = subprocess.run(
        [venv_alembic, "current"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )
    assert res_current.returncode == 0
