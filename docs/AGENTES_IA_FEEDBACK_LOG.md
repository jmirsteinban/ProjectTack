# AI Agent Feedback Log

## Purpose

This file records issues, improvements, and operational feedback related to AI agent usage in this repository.

Use it to capture workflow problems, missing safeguards, prompt issues, configuration gaps, and follow-up improvements for the ProjectTrack OpenCode setup.

This is not a product changelog, a feature backlog, or general project documentation.

## How To Add An Entry

Add a new entry when:

- an agent behaves outside its intended scope
- a command is too vague or too broad
- a prompt needs clarification
- a permission is too loose or too restrictive
- a workflow causes avoidable friction
- a model assignment needs revision after review

Keep entries short, concrete, and action-oriented.

## Entry Template

### YYYY-MM-DD - agent-or-command-name

- Problem: <short description>
- Suggested improvement: <short description>
- Status: open | reviewed | implemented | rejected

### 2026-04-20 - opencode-config-loading

- Problem: In this workspace, OpenCode can resolve the project root as `C:\` instead of the repository path because the directory includes brackets `[...]`. When that happens, the local `opencode.jsonc` is not loaded automatically.
- Suggested improvement: Document the workaround and use `OPENCODE_CONFIG` with the absolute path to the repository `opencode.jsonc` until project-root detection is stable for this workspace shape.
- Status: implemented

### 2026-04-20 - session-handoff-checkpoint

- Problem: A closed session can interrupt long CSS cleanup work and leave the repository in a partial state without an explicit restart checkpoint.
- Suggested improvement: Keep a small persistent handoff file with the current checkpoint, touched files, validation status, and next exact step whenever multistep work stops mid-iteration.
- Status: implemented
