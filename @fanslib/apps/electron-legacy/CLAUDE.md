# FansLib Electron App

This file provides guidance for working with the FansLib Electron application.

For repo-wide AI coding rules (Cursor/Copilot/Claude), also follow the monorepo guide in `CLAUDE.md` at the repo root.

## Overview

The main FansLib desktop application built with Electron, React, and TypeScript for managing adult content creator libraries and post scheduling. This is part of the FansLib monorepo and uses shared libraries for common functionality.

The application uses a modular architecture with separate main and renderer processes.

## Development Commands

All commands use Taskfile (Task runner). Run `task --list` from this directory to see available tasks.

**Note**: You can also run these commands from the monorepo root using:

- `task electron:dev` (equivalent to `task dev` from this directory)
- `task electron:build` (equivalent to `task build` from this directory)
- etc.

```bash
# From the electron app directory (packages/apps/electron/)
task dev                      # Start development server
task build                    # Build for production (includes type checking)
task start                    # Start built app

# Platform-specific builds
task build:win                # Windows build
task build:mac                # macOS build
task build:linux              # Linux build
task build:unpack             # Build without packaging (for testing)

# Code quality checks
task check                    # Run all checks (format, lint, types)
task check:types              # TypeScript type checking (both node & web)
task check:types:node         # TypeScript checking for main process
task check:types:web          # TypeScript checking for renderer process
task check:lint               # ESLint with auto-fix
task check:lint:fix           # ESLint without auto-fix
task check:format             # Format code with Prettier
task check:format:check       # Check formatting without fixing

# GraphQL & Database
task schema:fetch             # Fetch Postpone GraphQL schema
task codegen                  # Generate Postpone GraphQL types

# Storybook (Component Development)
task storybook                # Start Storybook development server
task build:storybook          # Build static Storybook

# Utilities
task rebuild                  # Rebuild native modules (sqlite3)
task clean                    # Clean build artifacts
task postinstall              # Install app dependencies
```

## Architecture

### Main Process (`src/main/`)

- Entry point: `src/main/index.ts`
- Handles Electron app lifecycle, window management, and IPC registration
- Uses TypeORM with SQLite for data persistence
- Custom protocol handlers for media and thumbnail serving

### Renderer Process (`src/renderer/`)

- Entry point: `src/renderer/src/main.tsx`
- React SPA with React Router for navigation
- TanStack Query for data fetching and caching
- Multiple context providers for state management
- shadcn/UI + Tailwind CSS for styling
- See `src/renderer/CLAUDE.md` for renderer-specific guidance

### Features Architecture (`src/features/`)

Each feature module follows a consistent pattern:

- `entity.ts` - TypeORM entities
- `api-type.ts` - IPC type definitions
- `api.ts` - IPC handlers (main process)
- `operations.ts` - Business logic
- Individual feature modules: analytics, automation, channels, library, posts, etc.

The `automation` feature uses the shared `@fanslib/reddit-automation` library for Reddit posting functionality.

### Database

- SQLite database with TypeORM
- Automatic schema synchronization
- Entities cover media, posts, channels, tags, analytics, etc.

### IPC Communication

- Type-safe IPC using `src/features/index-main.ts` and `src/features/index-renderer.ts`
- Centralized handler registration via `IpcRegistry`
- All handlers follow consistent naming: `{feature}Methods`

## Key Technologies

- **Framework**: Electron + React + TypeScript
- **Build**: Vite + electron-vite + Taskfile
- **Database**: TypeORM + SQLite
- **UI**: Shadcn/ui & Radix UI primitives + Tailwind CSS
- **State**: React Context + TanStack Query
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Automation**: Shared `@fanslib/reddit-automation` library with Playwright
- **Linting**: Shared `@fanslib/eslint-config` configuration

## Important Notes

- The app manages sensitive adult content libraries locally
- Uses custom protocols for secure media serving
- Implements cron jobs for analytics and automation
- GraphQL integration for external APIs (postpone service)
- Multi-platform support with platform-specific builds
- Reddit automation uses the shared `@fanslib/reddit-automation` library with Playwright for reliable browser automation

## File Structure

```
src/
├── features/          # Feature modules (IPC handlers, entities, business logic)
├── lib/              # Shared utilities and database configuration
├── main/             # Electron main process
├── preload/          # Electron preload scripts
├── renderer/         # React frontend application
└── graphql/          # GraphQL schemas and generated types
```
