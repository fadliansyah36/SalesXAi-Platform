# ADR-005 — Canonical Phase 08 Ordering: Analytics Before Unified AI

- Status: Accepted — follows root AGENTS.md and Engineering Execution Master Plan v1.0
- Date: 2026-11-21
- Scope: Phase numbering and implementation order

## Context

The Master PRD v1.0 roadmap labels Phase 08 as Unified AI Foundation, followed by Sales Intelligence, Telegram AI, Remotion, Content Studio, Cross-Domain Automation and Enterprise Governance.

The Engineering Execution Master Plan v1.0 defines a different execution sequence: Phase 08 Analytics & Operational Reporting, Phase 09 Workflow/Scheduling/Notification, Phase 10 Remotion, Phase 11 Unified AI/Sales Intelligence, Phase 12 Telegram, and Phase 13 Super Admin Governance. Root AGENTS.md explicitly requires following the Engineering Execution Master Plan phase order and reserves AI/Telegram for the final phases. The Cross-Platform Implementation Flow independently maps Phase 08 to Analytics and Phase 11 to Unified AI.

## Decision

Use the Engineering Execution Master Plan and root AGENTS.md as the canonical execution sequence:

1. Phase 08 — Analytics & Operational Reporting.
2. Phase 09 — Workflow, Scheduling & Notification Foundation.
3. Phase 10 — Remotion Foundation & Content Studio Core.
4. Phase 11 — Unified AI Platform & Sales Intelligence.
5. Phase 12 — Telegram Bot & Proactive AI.
6. Phase 13 — Super Admin Governance & Platform Operations.

The Master PRD remains the product-scope baseline. Its Unified AI requirements are not removed or reduced; they are scheduled into Phase 11, where the execution plan places the complete AI platform. No AI orchestration, model routing, agent, skill, memory or tool-gateway scope is pulled into Phase 08.

## Consequences

- Phase 08 delivers deterministic, data-backed metrics and reports without AI-generated narrative.
- Phase 09 provides durable workflow/scheduling/notification foundations before AI/Telegram automation.
- Phase 11 owns the single Unified AI Orchestrator, Model Router, Memory Coordinator, Agent/Skill Registry, Tool Gateway and Usage Ledger.
- Phase trackers, implementation evidence and future prompts must use the execution-plan numbering.
- The Master PRD roadmap remains an acknowledged historical numbering conflict until a future PRD revision incorporates this ADR; this ADR governs implementation ordering in the meantime.
