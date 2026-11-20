from __future__ import annotations
from uuid import UUID, uuid4
import hashlib
from app.errors import APIError
from app.repositories.smart_team import SmartTeamRepository, smart_team_repository
from app.security.dependencies import TenantContext
from app.services.audit import write_audit
from app.services.storage import supabase_storage


def evidence_content_matches_mime(mime_type: str, content: bytes) -> bool:
    if mime_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if mime_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if mime_type == "application/pdf":
        return content[:1024].lstrip().startswith(b"%PDF-")
    return False




class SmartTeamService:
    """Application service for tenant-scoped SmartTeam workflows."""

    def __init__(self, repository: SmartTeamRepository | None = None):
        self.repository = repository or smart_team_repository

    def _tenant(self, organization_id: UUID, tenant: TenantContext):
        if tenant.organization_id != organization_id:
            raise APIError(403, "forbidden", "Cross-tenant SmartTeam access is denied.")

    def _translate(self, error: ValueError):
        code = str(error)
        mapping = {
            "sales_profile_not_found": (
                404,
                "sales_profile_not_found",
                "Active sales profile was not found in this organization.",
            ),
            "outlet_not_found": (
                404,
                "outlet_not_found",
                "Active outlet was not found in this organization.",
            ),
            "outlet_not_assigned": (
                409,
                "outlet_not_assigned",
                "The outlet is not actively assigned to this sales profile.",
            ),
            "outlet_assignment_inactive": (
                409,
                "outlet_assignment_inactive",
                "The outlet assignment is no longer active.",
            ),
            "visit_not_found": (
                404,
                "visit_not_found",
                "Visit was not found in this organization.",
            ),
            "visit_transition_invalid": (
                409,
                "visit_transition_invalid",
                "The requested visit lifecycle transition is invalid.",
            ),
            "visit_already_checked_in": (
                409,
                "visit_already_checked_in",
                "Visit has already been checked in.",
            ),
            "active_sales_profile_required": (
                403,
                "active_sales_profile_required",
                "An active sales profile is required for attendance.",
            ),
            "shift_already_closed_today": (
                409,
                "shift_already_closed_today",
                "Today's shift is already closed.",
            ),
            "active_shift_not_found": (
                409,
                "active_shift_not_found",
                "No active shift is available to clock out.",
            ),
            "shift_not_found": (404, "shift_not_found", "Attendance shift was not found."),
            "target_scope_not_found": (
                404,
                "target_scope_not_found",
                "Target scope was not found in this organization.",
            ),
            "profile_scope_forbidden": (
                403,
                "forbidden",
                "The sales profile is outside the actor's authorized team or ownership scope.",
            ),
            "idempotency_conflict": (
                409,
                "idempotency_conflict",
                "The idempotency key was already used for a different SmartTeam action.",
            ),
            "outlet_branch_mismatch": (
                409,
                "outlet_branch_mismatch",
                "The outlet branch does not match the assigned sales team branch.",
            ),
            "outlet_territory_mismatch": (
                409,
                "outlet_territory_mismatch",
                "The outlet is outside the sales profile territory.",
            ),
            "sales_team_not_found": (
                404,
                "sales_team_not_found",
                "The active sales team was not found in this organization.",
            ),
            "attendance_time_range_invalid": (
                422,
                "attendance_time_range_invalid",
                "Clock-out must not precede clock-in.",
            ),
            "visit_evidence_state_invalid": (
                409,
                "visit_evidence_state_invalid",
                "Evidence can only be uploaded for an in-progress or completed visit.",
            ),
            "visit_window_invalid": (
                422,
                "visit_window_invalid",
                "The visit window end must not precede its scheduled start.",
            ),
            "visit_profile_mismatch": (
                422,
                "visit_profile_mismatch",
                "The linked visit belongs to a different sales profile.",
            ),
        }
        status, code, message = mapping.get(
            str(error),
            (422, "smartteam_validation_error", "The SmartTeam operation violates a domain rule."),
        )
        raise APIError(status, code, message) from error

    async def list_visits(
        self, connection, organization_id, tenant, principal, profile_id, status, limit, offset
    ):
        self._tenant(organization_id, tenant)
        rows = await self.repository.list_visits(
            connection, organization_id, principal.user_id, profile_id, status, limit, offset
        )
        return [dict(row) for row in rows]

    async def create_visit(self, connection, request, organization_id, tenant, principal, payload):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.create_visit(
                connection, organization_id, principal.user_id, payload
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.visit.created",
            "smartteam_visit",
            str(row["id"]),
            tenant,
            {
                "status": row["status"],
                "outlet_id": str(row["outlet_id"]),
                "sales_profile_id": str(row["sales_profile_id"]),
            },
        )
        return dict(row)

    async def assign_visit(
        self,
        connection,
        request,
        organization_id,
        tenant,
        principal,
        visit_id,
        sales_profile_id,
        idempotency_key,
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.assign_visit(
                connection,
                organization_id,
                principal.user_id,
                visit_id,
                sales_profile_id,
                idempotency_key,
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.visit.assigned",
            "smartteam_visit",
            str(visit_id),
            tenant,
            {"sales_profile_id": str(sales_profile_id), "status": row["status"]},
        )
        return dict(row)

    async def check_in(
        self,
        connection,
        request,
        organization_id,
        tenant,
        principal,
        visit_id,
        location,
        idempotency_key,
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.check_in(
                connection, organization_id, principal.user_id, visit_id, location, idempotency_key
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.visit.checked_in",
            "smartteam_visit",
            str(visit_id),
            tenant,
            {
                "accuracy_m": location["accuracy_m"],
                "source": location["source"],
                "captured_at": location.get("captured_at").isoformat()
                if location.get("captured_at")
                else None,
            },
        )
        return dict(row)

    async def check_out(
        self,
        connection,
        request,
        organization_id,
        tenant,
        principal,
        visit_id,
        location,
        outcome,
        notes,
        idempotency_key,
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.check_out(
                connection,
                organization_id,
                principal.user_id,
                visit_id,
                location,
                outcome,
                notes,
                idempotency_key,
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.visit.checked_out",
            "smartteam_visit",
            str(visit_id),
            tenant,
            {
                "outcome": outcome,
                "accuracy_m": location["accuracy_m"],
                "source": location["source"],
                "captured_at": location.get("captured_at").isoformat()
                if location.get("captured_at")
                else None,
            },
        )
        return dict(row)

    async def cancel_visit(
        self, connection, request, organization_id, tenant, principal, visit_id, reason
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.cancel_visit(
                connection, organization_id, principal.user_id, visit_id, reason
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.visit.cancelled",
            "smartteam_visit",
            str(visit_id),
            tenant,
            {"reason": reason},
        )
        return dict(row)

    async def list_shifts(self, connection, organization_id, tenant, principal, limit, offset):
        self._tenant(organization_id, tenant)
        return [
            dict(row)
            for row in await self.repository.list_shifts(
                connection, organization_id, principal.user_id, limit, offset
            )
        ]

    async def clock_in(
        self, connection, request, organization_id, tenant, principal, location, key
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.clock_in(
                connection, organization_id, principal.user_id, location, key
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.attendance.clocked_in",
            "smartteam_shift",
            str(row["id"]),
            tenant,
            {"accuracy_m": location["accuracy_m"], "source": location["source"]},
        )
        return dict(row)

    async def clock_out(
        self, connection, request, organization_id, tenant, principal, location, key
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.clock_out(
                connection, organization_id, principal.user_id, location, key
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.attendance.clocked_out",
            "smartteam_shift",
            str(row["id"]),
            tenant,
            {"accuracy_m": location["accuracy_m"], "source": location["source"]},
        )
        return dict(row)

    async def correct_attendance(
        self,
        connection,
        request,
        organization_id,
        tenant,
        principal,
        shift_id,
        clock_in_at,
        clock_out_at,
        reason,
    ):
        self._tenant(organization_id, tenant)
        if not reason.strip():
            raise APIError(
                422, "correction_reason_required", "Attendance correction requires a reason."
            )
        try:
            row = await self.repository.correct_attendance(
                connection,
                organization_id,
                principal.user_id,
                shift_id,
                clock_in_at,
                clock_out_at,
                reason,
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.attendance.corrected",
            "smartteam_shift",
            str(shift_id),
            tenant,
            {"reason": reason},
        )
        return dict(row)

    async def list_activities(self, connection, organization_id, tenant, principal, limit, offset):
        self._tenant(organization_id, tenant)
        return [
            dict(row)
            for row in await self.repository.list_activities(
                connection, organization_id, principal.user_id, limit, offset
            )
        ]

    async def create_activity(
        self, connection, request, organization_id, tenant, principal, payload
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.create_activity(
                connection, organization_id, principal.user_id, payload
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.activity.created",
            "smartteam_activity",
            str(row["id"]),
            tenant,
            {"activity_type": row["activity_type"]},
        )
        return dict(row)

    async def update_activity(
        self, connection, request, organization_id, tenant, principal, activity_id, payload
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.update_activity(
                connection, organization_id, principal.user_id, activity_id, payload
            )
        except ValueError as error:
            self._translate(error)
        if row is None:
            raise APIError(404, "activity_not_found", "Activity was not found.")
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.activity.updated",
            "smartteam_activity",
            str(activity_id),
            tenant,
            {"status": row["status"]},
        )
        return dict(row)

    async def list_targets(self, connection, organization_id, tenant, principal, limit, offset):
        self._tenant(organization_id, tenant)
        return [
            dict(row)
            for row in await self.repository.list_targets(
                connection, organization_id, principal.user_id, limit, offset
            )
        ]

    async def create_target(self, connection, request, organization_id, tenant, principal, payload):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.create_target(
                connection, organization_id, principal.user_id, payload
            )
        except ValueError as error:
            self._translate(error)
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.target.created",
            "smartteam_target",
            str(row["id"]),
            tenant,
            {"metric_key": row["metric_key"], "target_value": str(row["target_value"])},
        )
        return dict(row)

    async def update_visit(
        self, connection, request, organization_id, tenant, principal, visit_id, payload
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.update_visit(
                connection, organization_id, principal.user_id, visit_id, payload
            )
        except ValueError as error:
            self._translate(error)
        if row is None:
            raise APIError(404, "visit_not_found", "Visit was not found.")
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.visit.updated",
            "smartteam_visit",
            str(visit_id),
            tenant,
            {"updated_fields": sorted(payload)},
        )
        return dict(row)

    async def list_visit_history(self, connection, organization_id, tenant, principal, visit_id):
        self._tenant(organization_id, tenant)
        try:
            rows = await self.repository.list_visit_events(
                connection, organization_id, principal.user_id, visit_id
            )
        except ValueError as error:
            self._translate(error)
        return [dict(row) for row in rows]

    async def update_target(
        self, connection, request, organization_id, tenant, principal, target_id, payload
    ):
        self._tenant(organization_id, tenant)
        try:
            row = await self.repository.update_target(
                connection, organization_id, principal.user_id, target_id, payload
            )
        except ValueError as error:
            self._translate(error)
        if row is None:
            raise APIError(404, "target_not_found", "Target was not found.")
        await write_audit(
            connection,
            request,
            principal,
            "smartteam.target.updated",
            "smartteam_target",
            str(target_id),
            tenant,
            {"updated_fields": sorted(payload)},
        )
        return dict(row)

    async def dashboard(self, connection, organization_id, tenant, principal):
        self._tenant(organization_id, tenant)
        visits = await self.repository.list_visits(
            connection, organization_id, principal.user_id, None, None, 500, 0
        )
        shifts = await self.repository.list_shifts(
            connection, organization_id, principal.user_id, 500, 0
        )
        activities = await self.repository.list_activities(
            connection, organization_id, principal.user_id, 500, 0
        )
        targets = await self.repository.list_targets(
            connection, organization_id, principal.user_id, 500, 0
        )
        return {
            "visits_total": len(visits),
            "visits_scheduled": sum(
                1 for row in visits if row["status"] in ("scheduled", "assigned")
            ),
            "visits_in_progress": sum(1 for row in visits if row["status"] == "in_progress"),
            "visits_completed": sum(1 for row in visits if row["status"] == "completed"),
            "attendance_records": len(shifts),
            "active_shifts": sum(1 for row in shifts if row["status"] == "active"),
            "activities_open": sum(
                1 for row in activities if row["status"] in ("open", "in_progress")
            ),
            "targets_visible": len(targets),
        }

    async def upload_visit_evidence(
        self, connection, request, organization_id, tenant, principal, visit_id, mime_type, content
    ):
        self._tenant(organization_id, tenant)
        if mime_type not in {"image/jpeg", "image/png", "application/pdf"}:
            raise APIError(
                415,
                "evidence_mime_not_allowed",
                "Only JPEG, PNG or PDF visit evidence is accepted.",
            )
        if not content or len(content) > 10 * 1024 * 1024:
            raise APIError(
                413 if len(content) > 10 * 1024 * 1024 else 422,
                "evidence_size_invalid",
                "Evidence must be between 1 byte and 10 MiB.",
            )
        if not evidence_content_matches_mime(mime_type, content):
            raise APIError(
                415,
                "evidence_content_mismatch",
                "The uploaded file signature does not match its declared MIME type.",
            )
        try:
            await self.repository.ensure_visit_evidence_scope(
                connection, organization_id, principal.user_id, visit_id
            )
        except ValueError as error:
            self._translate(error)
        digest = hashlib.sha256(content).hexdigest()
        existing = await self.repository.find_visit_evidence_by_digest(
            connection, organization_id, visit_id, digest
        )
        if existing is not None:
            return dict(existing)

        extension = {"image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf"}[mime_type]
        storage_path = f"{organization_id}/{visit_id}/{uuid4().hex}.{extension}"
        await supabase_storage.upload(storage_path, content, mime_type)
        try:
            row, created = await self.repository.create_visit_evidence(
                connection,
                organization_id,
                visit_id,
                principal.user_id,
                storage_path,
                mime_type,
                len(content),
                digest,
            )
        except Exception:
            await supabase_storage.delete(storage_path)
            raise
        if not created:
            await supabase_storage.delete(storage_path)
            return dict(row)

        await write_audit(
            connection,
            request,
            principal,
            "smartteam.visit.evidence.uploaded",
            "smartteam_visit_evidence",
            str(row["id"]),
            tenant,
            {
                "visit_id": str(visit_id),
                "mime_type": mime_type,
                "size_bytes": len(content),
                "sha256": digest,
            },
        )
        return dict(row)

    async def list_visit_evidence(self, connection, organization_id, tenant, principal, visit_id):
        self._tenant(organization_id, tenant)
        try:
            rows = await self.repository.list_visit_evidence(
                connection, organization_id, principal.user_id, visit_id
            )
        except ValueError as error:
            self._translate(error)
        result = []
        for row in rows:
            item = dict(row)
            item["download_url"] = await supabase_storage.signed_download_url(row["storage_path"])
            result.append(item)
        return result

    async def can_receive_event(self, connection, organization_id, actor_id, event):
        return await self.repository.can_receive_event(connection, organization_id, actor_id, event)

    async def platform_overview(self, connection, limit, offset):
        return [
            dict(row) for row in await self.repository.platform_overview(connection, limit, offset)
        ]


smart_team_service = SmartTeamService()
