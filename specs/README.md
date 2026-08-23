# Lightweight specs

Use this workflow for a change that benefits from a shared decision record and
an implementation checklist. Keep straightforward edits lightweight; a spec is
not a prerequisite for every change.

## Flow

1. Discuss the outcome with an agent and let it inspect relevant code and docs.
2. Create a dated workspace:

   ```sh
   make spec name=remote-log-collection title="Collect selected remote logs"
   ```

   This creates `specs/YYYY-MM-DD-remote-log-collection/`, so workspaces sort
   chronologically without manual naming.
3. Have the agent fill in `spec.md` from the conversation, then derive
   `tasks.md` from that spec.
4. Review the outcome and acceptance checks, then run:

   ```sh
   make spec-check path=specs/YYYY-MM-DD-remote-log-collection
   ```
5. Implement in task order. Check off a task only after its `Validate:` step
   passes.

## Rules

- `spec.md` must be 100 lines or fewer. Split work when it needs more space.
- Describe intent and observable results, not a detailed solution design.
- State constraints and non-goals explicitly.
- Every acceptance check must be observable or testable.
- Each task must be small enough to complete and validate independently.

Generated workspaces are ignored by Git. The templates, helpers, and this
guide are tracked; do not force-add generated specs.
