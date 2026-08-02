# Contributing Guidelines

## Characterization‑First Policy

When a change touches files that are listed in **`docs/REFACTOR_QUEUE.md`** or **`docs/TECH_DEBT.md`**, the commit **must** include a new or updated test file ending with **`.characterization.test.ts`**. This ensures that any refactor or technical‑debt work is accompanied by a characterization test that captures the existing behavior before it is altered.

### Enforcement
- A **Husky pre‑commit hook** runs `lint‑staged`, which executes `scripts/validate-characterization.js`.
- The script inspects the staged diff; if any file from the two reference documents is modified and no `*.characterization.test.ts` file appears in the same commit, the commit is rejected with an error message.
- To bypass the check (e.g., for experimental work), you may use `git commit --no-verify`, but this should be avoided in normal development.

### Example error
```
Error: Changes to files listed in REFACTOR_QUEUE.md or TECH_DEBT.md require a .characterization.test.ts file in the same commit.
```

### Why this matters
- Guarantees that legacy behavior is documented before it changes.
- Prevents accidental regressions when cleaning up or refactoring old code.
- Aligns with the team’s **“Characterization‑First”** cultural shift.

---

For other contribution guidelines (code style, linting, testing, etc.) refer to the existing project documentation.
