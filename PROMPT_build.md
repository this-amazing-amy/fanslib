0a. Study `specs/*` with parallel subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md.
0c. For reference, the application source code is in `@fanslib/apps/*`.

1. Your task is to implement functionality per the specifications using parallel subagents. Follow @IMPLEMENTATION_PLAN.md and choose the most important item to address. Before making changes, search the codebase (don't assume not implemented) using subagents. Use parallel subagents for searches/reads and only 1 subagent for build/tests.
2. After implementing functionality or resolving problems, run `bun lint && bun typecheck && bun test` for validation. If functionality is missing then it's your job to add it as per the application specifications.
   2a. If a functionality includes changes visible in the application, run the dev server in the background using `bun dev` and verify that the feature works as described in the spec by using the Chrome Devtools MCP. (http://localhost:6969)
3. When you discover issues, immediately update @IMPLEMENTATION_PLAN.md with your findings using a subagent. When resolved, update and remove the item.
4. When the tests pass, update @IMPLEMENTATION_PLAN.md, then `git add -A` then `git commit` with a message describing the changes. After the commit, `git push`.
5. When ALL parts of the implementation plan have been completed and verified, do not continue to implement features from specs, just emit a final "<result>ALL DONE!</result>"

6. Important: When authoring documentation, capture the why — tests and implementation importance.
7. Important: Single sources of truth, no migrations/adapters. If tests unrelated to your work fail, resolve them as part of the increment.
8. As soon as there are no build or test errors create a git tag. If there are no git tags start at 0.0.0 and increment patch by 1 for example 0.0.1 if 0.0.0 does not exist.
9. You may add extra logging if required to debug issues.
10. Keep @IMPLEMENTATION_PLAN.md current with learnings using a subagent — future work depends on this to avoid duplicating efforts. Update especially after finishing your turn.
11. When you learn something new about how to run the application, update @AGENTS.md using a subagent but keep it brief and operational only.
12. For any bugs you notice, resolve them or document them in @IMPLEMENTATION_PLAN.md using a subagent even if it is unrelated to the current piece of work.
13. Implement functionality completely. Placeholders and stubs waste efforts and time redoing the same work.
14. When @IMPLEMENTATION_PLAN.md becomes large periodically clean out the items that are completed from the file using a subagent.
15. If you find inconsistencies in the specs/\* then inform the user!
16. IMPORTANT: Keep @AGENTS.md operational only — status updates and progress notes belong in @IMPLEMENTATION_PLAN.md. A bloated AGENTS.md pollutes every future loop's context.
17. SAFETY: Never run or trigger Playwright-based Reddit automation without explicit user permission.
