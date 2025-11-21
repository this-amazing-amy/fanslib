---
description: Reddit Integration Implementation Plan
---

# Reddit Integration for Web App

## Overview
Port the Reddit authentication and session management from electron-legacy to the web app, consolidating the separate server functionality into the main server.

## Architecture Changes
- **Electron-legacy**: Had IPC (`window.api`) → Main Process → Separate Server (HTTP)
- **Web app**: Direct HTTP calls to main server

## Implementation Steps

### 1. Server-Side (Backend)

#### A. Add Session Management to Server
- [ ] Create session storage utilities in `/apps/server/src/lib/reddit-poster/`
- [ ] Add session management routes to `/apps/server/src/features/reddit-automation/routes.ts`:
  - `GET /api/reddit-automation/session/status` - Check if session exists and is valid
  - `DELETE /api/reddit-automation/session` - Clear session

#### B. Update Existing Routes
- [ ] Ensure `/api/reddit-automation/login` works correctly
- [ ] Ensure `/api/reddit-automation/check-login` works correctly

### 2. Web App (Frontend)

#### A. Create Utility Files
- [ ] `/apps/web/src/lib/reddit/auth-status-utils.ts` - Port from electron-legacy
- [ ] `/apps/web/src/lib/reddit/date-formatting.ts` - Port from electron-legacy

#### B. Create React Query Hooks
- [ ] `/apps/web/src/lib/queries/reddit.ts`:
  - `useRedditLoginMutation()` - Login to Reddit
  - `useRedditLoginStatusQuery()` - Check login status
  - `useRedditSessionStatusQuery()` - Check session status on server
  - `useClearRedditSessionMutation()` - Clear session from server

#### C. Create UI Components
- [ ] `/apps/web/src/features/settings/components/reddit/AuthenticationStatus.tsx`
- [ ] `/apps/web/src/features/settings/components/reddit/AuthenticationActions.tsx`

#### D. Update RedditSettings Component
- [ ] Replace placeholder with full implementation using hooks and components

### 3. Testing
- [ ] Test login flow
- [ ] Test session status checking
- [ ] Test session clearing
- [ ] Test UI states (loading, authenticated, not authenticated, errors)

## Key Differences from Electron-Legacy

1. **No IPC layer** - Direct HTTP calls to server
2. **No separate server** - All endpoints in main server
3. **React Query instead of manual state** - Better caching and synchronization
4. **No server-communication module** - Simplified architecture

## Files to Reference

### Electron-Legacy
- `/apps/electron-legacy/src/renderer/src/hooks/useAuthStatusCache.ts`
- `/apps/electron-legacy/src/renderer/src/hooks/useRedditAuth.ts`
- `/apps/electron-legacy/src/renderer/src/hooks/useSessionManagement.ts`
- `/apps/electron-legacy/src/renderer/src/utils/authStatusUtils.ts`
- `/apps/electron-legacy/src/renderer/src/components/RedditSettings/`
- `/apps/electron-legacy/src/renderer/src/pages/Settings/RedditSettings.tsx`

### Server
- `/apps/server/src/features/reddit-automation/routes.ts`
- `/apps/server/src/features/reddit-automation/reddit-poster.ts`
- `/apps/server/src/lib/reddit-poster/`
