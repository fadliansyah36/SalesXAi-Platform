# Owner-pending Realtime policies

These SQL files are intentionally outside `supabase/migrations/` and are **not applied**.

The live `realtime.messages` table owner is `supabase_realtime_admin`. The connected project database principal cannot assume that owner role. Do not change ownership, grant elevated privileges to the application role, disable RLS, or otherwise bypass the ownership boundary.

## Required owner action

The Supabase project owner or an explicitly authorized database operator must review and apply the policies using the official owner-level SQL execution path:

1. `20261121101500_smartreward_realtime_role_scope_policy.sql`
   - Replaces the current broad SmartReward tenant-only policy.
   - Allows participant self-topic, branch-supervisor topic, and tenant-management topic separately.
   - Matches each event's organization, participant/requester or branch identifier to the private topic and checks the exact resource-specific SmartReward read permission.
   - Depends on applied migration `20261121093654_p06_reward_realtime_payload_scope`, which adds minimal audience identifiers to the private event payload.
   - The current applied migration `20261121104000_p06_reward_broadcast_disable_unsafe_tenant_topic` deliberately suppresses tenant-wide broadcasts while the legacy policy remains active.
2. `20261121100000_location_realtime_messages_owner_policy.sql`
   - Authorizes the private organization live-location topic.
   - Filters each payload to the actor's active organization membership, `location.live.read` permission and tenant/branch/team/territory scope.

Apply and verify in this order: (1) apply the SmartReward and Location owner policies; (2) use isolated Auth sessions to verify allowed participant, branch, tenant, and location subscriptions plus cross-tenant, cross-branch, and wrong-role denials; (3) only after the SmartReward policy tests pass, apply `20261121104500_smartreward_enable_tenant_broadcast_after_policy.sql` to re-enable tenant-wide event emission; (4) only after those tests pass may the Expo build set `EXPO_PUBLIC_SMARTREWARD_PRIVATE_BROADCAST_ENABLED=true`. Keep this flag unset/false until then; Native and Web clients use the FastAPI permission-checked SSE stream as the supported event delivery path.

Do not add these SQL files to the applied migration ledger until the owner-authorized execution is confirmed.