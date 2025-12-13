# FansLib AI coding guide (Claude / Cursor / Copilot)

This repo is a Bun + Turborepo monorepo. Follow these rules by default unless a subdirectory has more specific guidance.

## Non-negotiables

- TypeScript only; prefer `type` over `interface`; avoid `any` (use `unknown` + validate).
- Functional + declarative style; avoid mutation; never use classes or inheritance.
- Never use loops (`for`, `while`, `do/while`, `for...in`); prefer array methods (`.map/.filter/.reduce/...`). Only exception: `for await...of` for `AsyncIterable`.
- Always use arrow functions; named exports only; never default exports.
- Prefer early returns over nested `if/else` blocks.
- Event callbacks: don’t use `handle*`; name after the action (`toggleMenu`, `submitForm`).
- Keep code DRY via small helpers and modules; keep files narrowly scoped to related content.

## React

- Use functional components with explicit prop types.
- Don’t build ad-hoc fetching state with `useEffect` + `useState`; use TanStack Query (or existing query hooks).

## Repo specifics

- Use `bun` commands (not npm/yarn/pnpm).
- Web: React 19 + TanStack Start/Router/Query.
- Server: Bun + Elysia + TypeORM + SQLite; Eden treaty + devalue.

Common commands:

- `bun install`
- `bun dev`
- `bun lint`
- `bun typecheck`

## Safety

Never run or trigger Playwright-based Reddit automation without explicit user permission.

## Related

- Canonical long-form guide: `.github/copilot-instructions.md`
- Cursor entrypoint: `.cursorrules`
