# Owner-pending Realtime policies

These SQL files are intentionally outside `supabase/migrations/` and are **not applied**.

The live `realtime.messages` table owner is `supabase_realtime_admin`. The connected project database principal cannot assume that owner role. Do not change ownership, grant elevated privileges to the application role, disable RLS, or otherwise bypass the ownership boundary.

## Required owner action

The Supabase project owner or an explicitly authorized database operator must review and apply the policies using the official owner-level SQL execution path:

1. `20261121101500_smartreward_realtime_role_scope_policy.sql`
   - Replaces the current broad SmartReward tenant-only policy.
   - Allows participant self-topic, branch-supervisor topic, and tenant-management topic separately.
   - Matches each event's organization, participant/requester or branch identifier to the private topic and requires active membership, active role assignment and relevant SmartReward permission.
   - Depends on applied migration `20261121093654_p06_reward_realtime_payload_scope`, which adds the minimal audience identifiers to the private event payload.
2. `20261121100000_location_realtime_messages_owner_policy.sql`
   - Authorizes the private organization live-location topic.
   - Filters each payload to the actor's active organization membership, `location.live.read` permission and tenant/branch/team/territory scope.

After owner approval and application, verify authenticated subscription allow/deny cases with isolated Auth test users and confirm that cross-tenant, cross-branch and wrong-role subscriptions are rejected. Only after those tests pass may the Expo build set `EXPO_PUBLIC_SMARTREWARD_PRIVATE_BROADCAST_ENABLED=true`. Keep this flag unset/false until then; Native and Web clients use the FastAPI permission-checked SSE stream as the supported event delivery path.

Do not add these SQL files to the applied migration ledger until the owner-authorized execution is confirmed.