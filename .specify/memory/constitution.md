<!-- SYNC IMPACT REPORT
Version change: [template] → 1.0.0
Added sections: Core Principles (5), Technology Stack, Development Workflow, Governance
Removed sections: N/A (initial constitution)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ aligned (Constitution Check gate references TDD + monorepo)
  - .specify/templates/spec-template.md ✅ aligned (no constitution-specific fields)
  - .specify/templates/tasks-template.md ✅ aligned (TDD task ordering already enforced)
  - .specify/templates/constitution-template.md ✅ source template unchanged
Follow-up TODOs:
  - TODO(TECHNOLOGY_STACK): Confirm language/framework choices for backend, frontend, and services once decided
  - TODO(PERFORMANCE_GOALS): Define latency/throughput targets per service when scope is known
-->

# Helux Constitution

## Core Principles

### I. Monorepo-First

All applications, services, and shared libraries MUST reside in this repository.
New work MUST NOT be started in a separate repository without an explicit architecture
decision record (ADR) justifying the exception.

- `apps/` — deployable applications (frontend, backend, admin, etc.)
- `packages/` — shared libraries, types, utilities consumed across apps
- `services/` — standalone services (workers, schedulers, third-party integrations)

Each workspace MUST have its own `package.json` (or language-equivalent manifest),
its own test suite, and its own README describing purpose and usage.

### II. Test-First (NON-NEGOTIABLE)

TDD is mandatory and non-negotiable:

1. Write the test.
2. Confirm the test fails (red).
3. Implement the minimum code to pass (green).
4. Refactor without breaking tests.

No implementation task is considered started until its failing tests exist and have been
reviewed. PRs that include implementation without accompanying tests MUST be rejected.
The Red–Green–Refactor cycle is strictly enforced at code review.

### III. Independent Deployability

Each `apps/` and `services/` workspace MUST be independently deployable:

- MUST NOT require other apps or services to be deployed simultaneously.
- MUST declare all runtime dependencies explicitly (env vars, external APIs, queues).
- Integration between workspaces MUST occur via well-defined contracts (API schemas,
  message contracts, shared types in `packages/`).

### IV. Shared Code via Packages

Code MUST NOT be duplicated across workspaces. Cross-cutting logic MUST be extracted
into a `packages/` workspace:

- Shared types and interfaces → `packages/types`
- Shared utilities/helpers → `packages/utils` (or a named package)
- Shared UI components → `packages/ui`

A workspace MUST import from `packages/` rather than referencing another `apps/` or
`services/` workspace directly (except through versioned contracts).

### V. Simplicity

YAGNI (You Aren't Gonna Need It) MUST be the default position:

- Abstractions MUST be introduced only when a second concrete use case exists.
- Configuration layers, plugin architectures, and generic frameworks MUST be justified
  by current requirements, not anticipated future needs.
- Complexity introduced to satisfy a principle (e.g., package extraction) MUST be
  documented in the Complexity Tracking section of the relevant plan.

## Technology Stack

TODO(TECHNOLOGY_STACK): Confirm and record the canonical tech choices for each layer
once decided. Update this section before the first feature spec is ratified.

Placeholders to fill in:

- **Backend**: [e.g., Node.js + Fastify, Python + FastAPI, Go + Chi]
- **Frontend**: [e.g., Next.js + React, SvelteKit, Vue + Nuxt]
- **Shared packages tooling**: [e.g., Turborepo, Nx, pnpm workspaces]
- **Database**: [e.g., PostgreSQL + Prisma, MongoDB, SQLite]
- **Testing**: [e.g., Vitest, Jest, pytest, Go test]
- **CI/CD**: [e.g., GitHub Actions, Vercel, Railway]

## Development Workflow

- All work MUST be done on a feature branch (e.g., `001-feature-name`).
- PRs MUST pass all tests in affected workspaces before merge.
- Commits SHOULD be atomic and reference the feature/task number.
- Breaking changes to `packages/` MUST bump the package version and update all consumers
  in the same PR.
- The `main` branch MUST always be in a deployable state.

## Governance

This constitution supersedes all other development practices. Any deviation MUST be
documented as a justified exception in the relevant plan's Complexity Tracking table.

Amendments require:
1. A written proposal describing the change and its rationale.
2. Review by at least one team member not authoring the change.
3. An update to `LAST_AMENDED_DATE` and `CONSTITUTION_VERSION`.
4. Propagation to any dependent templates or guidance files.

All PRs and code reviews MUST verify compliance with the principles above.
Complexity MUST be justified; simplicity is the default.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
