<!--
SYNC IMPACT REPORT
==================
Version change: [unversioned template] → 1.0.0
Bump rationale: MAJOR — initial population of the constitution from template; all principles defined from scratch.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. Lint-First Development
  - [PRINCIPLE_2_NAME] → II. UX Consistency
  - [PRINCIPLE_3_NAME] → III. Code Quality Standards
  - [PRINCIPLE_4_NAME] → IV. Automated Quality Gates (Pre-Hooks)
  - [PRINCIPLE_5_NAME] → V. Dependency & Upgrade Hygiene

Added sections:
  - Development Workflow (pre-hook configuration, tooling setup)
  - Code Review & Quality Gates

Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check section aligns with lint/quality gates
  ✅ .specify/templates/tasks-template.md — Phase 1 Setup tasks now reflect lint/hook configuration
  ✅ .specify/templates/spec-template.md — No changes needed; spec template is principle-agnostic

Follow-up TODOs:
  - None. All placeholders resolved.
-->

# Meaningful Learning Constitution

## Core Principles

### I. Lint-First Development

All code MUST pass linting before it is committed or merged. ESLint (with the
project's configured ruleset) and any additional style tools (Prettier, Stylelint
for CSS) MUST be run as part of the pre-commit hook pipeline. Linting failures
MUST block commits — there are no bypass exceptions for feature branches.

**Rationale**: Catching style and semantic errors at commit time is orders of
magnitude cheaper than catching them in review or production. Consistency in the
codebase lowers onboarding friction and reduces cognitive load during review.

**Non-negotiable rules**:
- `lint-staged` or equivalent MUST be configured to run linters only on staged
  files for fast feedback.
- The ESLint config MUST extend `next/core-web-vitals` as a minimum baseline.
- Linting rules MUST NOT be suppressed inline (`// eslint-disable`) without a
  dated comment explaining the specific exception and a linked ticket.
- TypeScript strict mode (`"strict": true`) MUST be enabled.

### II. UX Consistency

Every user-facing feature MUST follow the established design system and
interaction patterns defined in the project. No ad-hoc styling or one-off
component patterns are permitted without a documented design decision.

**Rationale**: Inconsistent UX erodes user trust, increases support burden, and
creates technical debt in the component layer. Alignment on patterns up-front
prevents divergence at scale.

**Non-negotiable rules**:
- Shared UI primitives (buttons, inputs, modals) MUST come from the project's
  component library. New primitives require explicit approval before creation.
- Spacing, typography, and color MUST use design tokens; raw pixel values or
  hex colors outside of token definitions are prohibited.
- All new pages and flows MUST be tested for keyboard navigation and WCAG 2.1
  AA accessibility compliance before merge.
- Loading states, error states, and empty states are MANDATORY for every
  data-driven UI component — not optional polish.

### III. Code Quality Standards

Code MUST be readable, maintainable, and reviewed by at least one other
contributor before merging. Complexity MUST be justified; clarity is preferred
over cleverness.

**Rationale**: Long-term velocity depends on a codebase that new contributors
can understand and safely modify. Quality reviews surface bugs before
production and enforce shared ownership of the codebase.

**Non-negotiable rules**:
- All exported functions and components MUST have explicit TypeScript types —
  `any` is prohibited except in explicitly justified migration paths.
- Dead code MUST be removed rather than commented out.
- Components MUST follow single-responsibility: one primary concern per file.
- No `console.log` statements in committed code; use a structured logger or
  remove debug output before commit.
- Functions exceeding 40 lines are a signal (not a hard limit) to refactor;
  reviewers MUST flag functions exceeding 80 lines for mandatory refactor.

### IV. Automated Quality Gates (Pre-Hooks)

All quality enforcement MUST be automated via pre-commit and pre-push hooks.
Manual quality steps that can be automated MUST be automated.

**Rationale**: Human vigilance is unreliable at scale. Automating gates removes
the need for reviewers to catch mechanical errors and shifts author attention to
logic and architecture.

**Non-negotiable rules**:
- `husky` (or equivalent) MUST be installed and configured in the repository;
  hooks are committed to version control and run for all contributors.
- Pre-commit hooks MUST run: lint-staged (ESLint + Prettier), TypeScript
  type-check (`tsc --noEmit`) on changed files.
- Pre-push hooks MUST run: full `next build` or equivalent CI smoke test to
  catch build-breaking changes before they reach CI.
- Hook bypass (`--no-verify`) is PROHIBITED except in documented emergency
  procedures; bypasses MUST be logged and reviewed post-hoc.
- Hook failures MUST provide actionable error messages pointing to the
  offending file and rule.

### V. Dependency & Upgrade Hygiene

Dependencies MUST be kept current, minimal, and audited. No dependency is added
without justification; no dependency is left unmaintained without a migration plan.

**Rationale**: Stale or bloated dependencies are a primary vector for security
vulnerabilities and build instability. Discipline here reduces the blast radius
of upstream supply-chain incidents.

**Non-negotiable rules**:
- `npm audit` MUST be run as part of CI; high-severity vulnerabilities MUST
  block merge.
- New dependencies require a justification comment in the PR description
  covering: purpose, maintenance status, and whether a native or existing
  solution was considered.
- Dependencies unused in production MUST be in `devDependencies`.
- Lockfile (`package-lock.json`) MUST be committed and kept in sync; PRs that
  modify `package.json` without updating the lockfile MUST not be merged.

## Development Workflow

Pre-hook configuration is the primary enforcement mechanism for this
constitution. The following tooling setup is MANDATORY for all contributors:

- **husky** — manages git hook lifecycle; configured via `.husky/` directory.
- **lint-staged** — runs linters only on staged files; configured in
  `package.json` under `"lint-staged"`.
- **ESLint** — primary linter; config at `eslint.config.mjs` (flat config) or
  `.eslintrc.json`.
- **Prettier** — formatter; config at `.prettierrc` or `prettier.config.js`.
- **TypeScript** — type-checker; `tsconfig.json` MUST have `"strict": true`.

All hook scripts MUST be reviewed as part of onboarding. Contributors MUST run
`npm install` (which triggers `husky install` via `prepare` script) before
their first commit.

## Code Review & Quality Gates

Every pull request MUST satisfy the following gates before merge:

1. **Lint gate**: All ESLint and Prettier checks pass (enforced by pre-commit
   hook and CI).
2. **Type gate**: `tsc --noEmit` reports zero errors.
3. **Build gate**: `next build` completes without errors.
4. **Accessibility gate**: New UI components include an accessibility review
   note in the PR (automated axe-core checks preferred where available).
5. **Review gate**: At least one approving review from a contributor who did
   not author the PR.

PRs that skip any gate MUST document the reason and obtain explicit sign-off
from the project lead. Skipped gates create follow-up tickets that MUST be
resolved within the same release cycle.

## Governance

This constitution supersedes all informal practices, one-off conventions, and
prior undocumented decisions. Any conflict between this document and other
project guidance resolves in favor of this constitution.

**Amendment procedure**:
1. Open a PR proposing the specific change with rationale.
2. Obtain approval from at least two contributors.
3. Update `LAST_AMENDED_DATE` and increment `CONSTITUTION_VERSION` per
   semantic versioning rules (see below).
4. Run `/speckit-constitution` to propagate changes to dependent templates.

**Versioning policy**:
- MAJOR: Removal or fundamental redefinition of a principle.
- MINOR: New principle added or existing principle materially expanded.
- PATCH: Clarifications, wording fixes, non-semantic refinements.

**Compliance review**: Constitution compliance MUST be verified during every
sprint retrospective. Unresolved violations become P1 backlog items.

**Version**: 1.0.0 | **Ratified**: 2026-04-16 | **Last Amended**: 2026-04-16
