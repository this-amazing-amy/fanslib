0a. Study `specs/*` with parallel subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0c. Study `@fanslib/libraries/*` with parallel subagents to understand shared utilities & components.
0d. For reference, the application source code is in `@fanslib/apps/*`.
0e. `@fanslib/electron-legacy` is sunsetted and should only be used for reference

1. Study @IMPLEMENTATION_PLAN.md (if present; it may be incorrect) and use parallel subagents to study existing source code in `@fanslib/apps/*` and compare it against `specs/*`. Use a subagent to analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented. Think extra hard. Consider searching for TODO, minimal implementations, placeholders, skipped/flaky tests, and inconsistent patterns. Study @IMPLEMENTATION_PLAN.md to determine starting point for research and keep it up to date with items considered complete/incomplete using subagents.

IMPORTANT: Plan only. Do NOT implement anything. Do NOT assume functionality is missing; confirm with code search first. Prefer consolidated, idiomatic implementations over ad-hoc copies.

ULTIMATE GOAL: We want to build the features described in `specs/*`. Consider missing elements and plan accordingly. If an element is missing, search first to confirm it doesn't exist, then if needed author the specification at specs/FILENAME.md. If you create a new element then document the plan to implement it in @IMPLEMENTATION_PLAN.md using a subagent.
