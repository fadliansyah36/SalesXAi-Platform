from datetime import date, datetime, timezone
from pathlib import Path
import unittest
from uuid import uuid4

from pydantic import ValidationError

from app.services.smart_team import evidence_content_matches_mime
from app.schemas.smart_team import (
    ActivityCreate,
    AttendanceCorrection,
    ClockOutRequest,
    LocationCapture,
    TargetWrite,
    VisitCreate,
    VisitExecution,
)


class SmartTeamEvidenceTests(unittest.TestCase):
    def test_evidence_mime_must_match_file_signature(self) -> None:
        self.assertTrue(evidence_content_matches_mime("image/jpeg", b"\xff\xd8\xffpayload"))
        self.assertTrue(evidence_content_matches_mime("image/png", b"\x89PNG\r\n\x1a\npayload"))
        self.assertTrue(evidence_content_matches_mime("application/pdf", b"%PDF-1.7 payload"))
        self.assertFalse(evidence_content_matches_mime("image/jpeg", b"%PDF-1.7 payload"))
        self.assertFalse(evidence_content_matches_mime("application/pdf", b"not a PDF"))


class SmartTeamSchemaTests(unittest.TestCase):
    def test_task_activity_type_matches_phase04_database_contract(self) -> None:
        activity = ActivityCreate(
            sales_profile_id=uuid4(),
            activity_type="task",
            title="Follow up priority outlet",
            idempotency_key="task-create-123",
        )
        self.assertEqual(activity.activity_type, "task")

    def test_location_capture_rejects_invalid_coordinates_and_accuracy(self) -> None:
        with self.assertRaises(ValidationError):
            LocationCapture(latitude=91, longitude=0, accuracy_m=5)
        with self.assertRaises(ValidationError):
            LocationCapture(latitude=0, longitude=0, accuracy_m=-1)

    def test_visit_schedule_window_must_be_valid(self) -> None:
        with self.assertRaises(ValidationError):
            VisitCreate(
                sales_profile_id=uuid4(),
                outlet_id=uuid4(),
                scheduled_at=datetime(2026, 11, 20, 10, tzinfo=timezone.utc),
                window_end_at=datetime(2026, 11, 20, 9, tzinfo=timezone.utc),
                idempotency_key="visit-create-123",
            )

    def test_target_requires_exactly_one_scope_and_valid_period(self) -> None:
        base = {
            "metric_key": "visits",
            "period_start": date(2026, 11, 1),
            "period_end": date(2026, 11, 30),
            "target_value": 25,
        }
        with self.assertRaises(ValidationError):
            TargetWrite(**base)
        with self.assertRaises(ValidationError):
            TargetWrite(**base, sales_profile_id=uuid4(), team_id=uuid4())
        with self.assertRaises(ValidationError):
            TargetWrite(
                **{**base, "period_start": date(2026, 12, 1), "period_end": date(2026, 11, 30)},
                sales_profile_id=uuid4(),
            )

    def test_offline_visit_and_attendance_mutations_require_idempotency(self) -> None:
        location = {"latitude": -6.2, "longitude": 106.8, "accuracy_m": 8, "source": "gps"}
        with self.assertRaises(ValidationError):
            VisitExecution(location=location)
        with self.assertRaises(ValidationError):
            ClockOutRequest(location=location)
        VisitExecution(location=location, idempotency_key="visit-check-in-123")
        ClockOutRequest(location=location, idempotency_key="attendance-clockout-123")

    def test_attendance_correction_rejects_reversed_timestamps(self) -> None:
        with self.assertRaises(ValidationError):
            AttendanceCorrection(
                clock_in_at=datetime(2026, 11, 20, 11, tzinfo=timezone.utc),
                clock_out_at=datetime(2026, 11, 20, 10, tzinfo=timezone.utc),
                reason="Correction approved",
            )


class SmartTeamMigrationTests(unittest.TestCase):
    def test_applied_phase04_migrations_are_version_aligned_and_present(self) -> None:
        repository_root = Path(__file__).resolve().parents[3]
        migrations = repository_root / "supabase" / "migrations"
        expected = (
            "20261120033210_p04_smartteam_operations.sql",
            "20261120035216_p04_smartteam_offline_evidence.sql",
            "20261120040009_p04_smartteam_event_stream_bridge.sql",
            "20261120040308_p04_smartteam_private_realtime_scope.sql",
            "20261120040825_p04_smartteam_storage_scope.sql",
            "20261120040910_p04_smartteam_fk_indexes.sql",
            "20261120041314_p04_smartteam_evidence_broadcast.sql",
            "20261120041531_p04_smartteam_task_activity.sql",
            "20261120043558_p04_smartteam_evidence_content_dedup.sql",
            "20261120123237_p04_dedupe_master_data_broadcast_triggers.sql",
        )
        for name in expected:
            self.assertTrue((migrations / name).is_file(), name)

    def test_duplicate_master_data_broadcast_triggers_are_removed(self) -> None:
        repository_root = Path(__file__).resolve().parents[3]
        migration = repository_root / "supabase/migrations/20261120123237_p04_dedupe_master_data_broadcast_triggers.sql"
        sql = migration.read_text().lower()
        for table in ("branches", "teams", "territories", "outlets", "sales_profiles", "outlet_assignment_history"):
            self.assertIn(f"drop trigger if exists salesx_master_data_broadcast on public.{table}", sql)

    def test_visit_evidence_content_deduplication_is_migrated(self) -> None:
        repository_root = Path(__file__).resolve().parents[3]
        migration = repository_root / "supabase" / "migrations" / (
            "20261120043558_p04_smartteam_evidence_content_dedup.sql"
        )
        sql = migration.read_text()
        self.assertIn(
            "on public.smartteam_visit_evidence (organization_id, visit_id, sha256)",
            sql,
        )

    def test_smartteam_database_migrations_keep_private_rls_and_realtime_scope(self) -> None:
        repository_root = Path(__file__).resolve().parents[3]
        migrations = repository_root / "supabase" / "migrations"
        base = (migrations / "20261120033210_p04_smartteam_operations.sql").read_text()
        offline = (migrations / "20261120035216_p04_smartteam_offline_evidence.sql").read_text()
        bridge = (migrations / "20261120040009_p04_smartteam_event_stream_bridge.sql").read_text()
        realtime = (migrations / "20261120040308_p04_smartteam_private_realtime_scope.sql").read_text()
        storage_scope = (migrations / "20261120040825_p04_smartteam_storage_scope.sql").read_text()
        indexes = (migrations / "20261120040910_p04_smartteam_fk_indexes.sql").read_text()
        broadcast = (migrations / "20261120041314_p04_smartteam_evidence_broadcast.sql").read_text()
        task_activity = (migrations / "20261120041531_p04_smartteam_task_activity.sql").read_text()
        self.assertIn("alter table public.smartteam_visits enable row level security", base)
        self.assertIn("create table if not exists public.smartteam_visit_evidence", base)
        self.assertIn("smartteam_attendance_events", offline)
        self.assertIn("clock_out_idempotency_key", offline)
        self.assertIn("public=false", offline)
        self.assertIn("pg_notify('salesx_smartteam'", bridge)
        self.assertIn("r.key in ('company_admin','tenant_owner','platform_admin')", realtime)
        self.assertIn("smartteam_visit_evidence_read_scoped", storage_scope)
        self.assertIn("smartteam_shifts_user_fk_idx", indexes)
        self.assertIn("smartteam_visit_evidence_broadcast", broadcast)
        self.assertIn("activity_type = any", task_activity)


if __name__ == "__main__":
    unittest.main()
