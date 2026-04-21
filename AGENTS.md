# ProjectTrack AI Agent Operating Rules

## Purpose

This file defines the operating rules for AI agents working in this repository.

Use it together with `docs/PROJECTTRACK.md`, which remains the canonical document for current project state, priorities, and active operational context.

`AGENTS.md` governs how agents should work in the repository. It does not replace product documentation or project status documentation.

## Language Policy

- Collaboration with the repository owner must be conducted in Spanish.
- Repository-facing artifacts must be written in English by default.
- This includes configuration, agent prompts, command templates, code comments, and user-facing product copy when touched.
- `docs/PROJECTTRACK.md` must remain in Spanish.
- If the target file is intentionally maintained in Spanish, preserve that language unless explicitly instructed otherwise.
- Do not rename stable internal identifiers only for translation purposes.

## Mandatory Read Order

- Read `docs/PROJECTTRACK.md` before analysis, implementation, testing, documentation, or review.
- If the task touches Theme Manager, theme tokens, previews, or `Chrome/styles/projecttrack.css`, also read `docs/chrome/theme-manager.md`.
- If the task touches Chrome UI structure, Bootstrap usage, or custom class cleanup, also read `docs/chrome/bootstrap-migration-tracking.md`.
- If the task touches extension release or update distribution, also read `docs/chrome/deployment-github-releases.md`.
- If the task touches Tasks persistence, import behavior, or setup guidance, read `sql/change_tasks_excel_import_20260331.sql` before changing runtime or documentation.

## Priority Order

Use this order unless the user explicitly changes the priority:

1. Bootstrap audit
2. Theme Manager
3. Error handling
4. Tasks
5. Documentation
6. Tests
7. Auto-update strategy

## Core Working Rules

- Make the smallest correct change.
- Prefer incremental and reversible edits over broad rewrites.
- Do not refactor unrelated code.
- Preserve current naming conventions unless explicitly instructed otherwise.
- Bootstrap must be the default implementation layer for standard UI patterns.
- Do not keep custom presentation classes when Bootstrap already provides the correct solution.
- Custom classes should remain only when they are strictly necessary for ProjectTrack identity, tokens, or domain-specific behavior.
- Do not redesign approved screens without a concrete task-driven reason.
- Do not reactivate or redesign the hidden side panel unless explicitly requested.
- Keep the Theme Manager save boundary intact unless the task explicitly changes that contract.
- Automatic Theme Manager writes must stay limited to the marked token block in `Chrome/styles/projecttrack.css` unless explicitly instructed otherwise.
- Do not add secrets, provider keys, or GitHub tokens to the Chrome extension.
- Prefer updating existing documentation over creating parallel documents without need.

## Validation Rules

- If a task affects Chrome UI, validate the result in `Chrome/workspace.html`.
- If a task affects Theme Manager, validate the result in `Chrome/workspace.html?view=theme-manager`.
- If JavaScript files are modified, run syntax validation such as `node --check` on the changed files when feasible.
- If a task changes Bootstrap usage or custom class removal, validate the affected runtime surfaces after the change.
- If a task changes documentation about visible runtime behavior, confirm the documentation matches the current implementation before closing the task.

## Documentation And Traceability Rules

- Update `docs/PROJECTTRACK.md` when a task changes current project state, active risks, pending work, or operating rules.
- For multistep or partial work that may span sessions, update `docs/AI_SESSION_HANDOFF.md` before stopping with the current checkpoint, touched files, validation status, and next exact step.
- Update `Chrome/src/data/project-changelog.js` when the change is relevant to visible product history in `Change History`.
- Register relevant agent feedback in `docs/AGENTES_IA_FEEDBACK_LOG.md`.
- Keep `docs/chrome/theme-manager.md` aligned with Theme Manager changes.
- Keep `docs/chrome/bootstrap-migration-tracking.md` aligned with Bootstrap migration or cleanup changes.
- Keep `docs/chrome/deployment-github-releases.md` aligned with release or update-channel changes.
- Do not duplicate the running product history in multiple documents when `Change History` is the correct source.

## Ambiguity Rules

- Proceed without asking only when the change is narrow, clear, safe, and reversible.
- Ask before large rewrites, major visual redesigns, architecture changes, workflow changes, or scope expansion.
- If runtime behavior and documentation disagree, do not ignore the mismatch. Fix it or flag it explicitly before closing the task.
- If a decision affects schema expectations, release strategy, or cross-workflow behavior, ask before making the change unless the task explicitly requires it.

## Completion Checklist

- The required project documents were read first.
- The change stayed within the requested scope.
- The affected runtime or documentation was validated.
- Relevant documentation was updated where needed.
- Relevant product history was updated where needed.
- Relevant agent feedback was logged where needed.
- The final result is minimal, clear, and reversible.
