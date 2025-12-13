# FansLib Renderer (Frontend)

This file provides guidance for working with the React frontend of the FansLib Electron application.

## Overview

The renderer process contains the React-based user interface for the FansLib application. It's a single-page application that communicates with the main process via IPC.

## Architecture

### React Application Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts for state management
├── hooks/           # Custom React hooks
├── lib/             # Frontend utilities and helpers
├── pages/           # Main application pages/routes
├── App.tsx          # Root application component
├── Layout.tsx       # Main layout component
├── main.tsx         # React app entry point
└── index.css        # Global styles
```

### Key Patterns

#### Components (`components/`)

- **UI Components**: Reusable design system components in `components/ui/`
- **Feature Components**: Business-specific components organized by feature
- **Storybook**: Each UI component has corresponding `.stories.tsx` files for documentation

#### State Management

- **React Context**: Used for application-wide state (settings, library preferences, etc.)
- **TanStack Query**: Used for server state management and caching
- **Local State**: React `useState` and `useReducer` for component-specific state

#### Custom Hooks (`hooks/`)

- **API Hooks** (`hooks/api/`): Interface with main process via IPC
- **Business Hooks** (`hooks/business/`): Business logic and derived state
- **UI Hooks** (`hooks/ui/`): Reusable UI behavior and utilities

#### Pages (`pages/`)

- **Analytics**: Post performance and insights
- **Channels**: Platform channel management
- **Manage**: Media library and gallery
- **Plan**: Content scheduling and calendar
- **Settings**: Application configuration
- **Subreddits**: Reddit-specific features
- **Tagging**: Media tagging and organization

## Key Technologies

- **React**: v18 with functional components and hooks
- **React Router**: v7 for client-side routing
- **TanStack Query**: v5 for server state management and caching
- **Tailwind CSS**: v4 utility-first CSS framework
- **Shadcn/ui + DaisyUI**: Component libraries
- **Radix UI**: Headless UI components for accessibility
- **Framer Motion**: Animation library
- **Recharts**: Charting library for analytics
- **Tremor**: Additional charting components

## Component Development

### UI Components

- Located in `components/ui/`
- Built with DaisyUI or Shadcn/ui patterns using Radix UI primitives
- Include TypeScript types and Storybook stories
- Follow consistent naming: `ComponentName.tsx`, `component-name.stories.tsx`
- Prefer large, graphic icon-only buttons (no text) for high-frequency inline actions in dense UIs; always provide an `aria-label` (and a tooltip when helpful)

### Styling

- **Tailwind CSS**: Primary styling approach
- **CSS-in-JS**: Avoid in favor of Tailwind utility classes
- **Component Variants**: Use `class-variance-authority` for component variants
- **Theme System**: Dark/light mode support with CSS custom properties

### Data Fetching

- **IPC Communication**: Use custom hooks in `hooks/api/` to communicate with main process
- **TanStack Query**: Automatic caching, background updates, and error handling
- **Optimistic Updates**: For better user experience with local-first data

## Best Practices

### Component Structure

```tsx
const ComponentName = ({ prop1, prop2 }: ComponentProps) => {
  // 1. Hooks at the top
  const { data, isLoading } = useApiHook();
  const [localState, setLocalState] = useState();

  // 2. Event handlers
  const runAction = useCallback(() => {
    // Implementation
  }, [dependencies]);

  // 3. Early returns for loading/error states
  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState />;

  // 4. Main render
  return <div className='container mx-auto p-4'>{/* Component content */}</div>;
};
```

### State Management

- **Local State**: Use `useState` for component-specific state
- **Shared State**: Use React Context for state shared across multiple components
- **Server State**: Use TanStack Query for data from the main process
- **Derived State**: Compute derived values in custom hooks when possible

### Performance

- **Memoization**: Use `useMemo` and `useCallback` judiciously for expensive calculations
- **Code Splitting**: Lazy load pages and heavy components
- **Virtual Scrolling**: For large lists (media gallery, posts)
- **Image Optimization**: Lazy loading and responsive images for media content

## Testing

- **Storybook**: Visual testing and component documentation
