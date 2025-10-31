# FansLib Frontend Component Migration Plan

## Overview

This document outlines the strategy for migrating frontend components from the Electron-based legacy application to the new TanStack Start + Electric SQL architecture. The backend infrastructure (database, API, and collections) is complete and ready to support frontend component development.

### What's Already Complete ✓

**Backend Infrastructure:**
- ✅ PostgreSQL database schemas for all entities
- ✅ Electric SQL endpoints for real-time data sync
- ✅ tRPC mutation routers for all CRUD operations
- ✅ Frontend collections with optimistic updates

**Working Components:**
- ✅ Media Grid (reference implementation)
- ✅ Scan Progress (reference implementation)

**Current UI State:**
- ✅ DaisyUI already installed and configured
- ⚠️ Legacy app uses custom shadcn/ui-style components
- 🚧 Need to migrate to DaisyUI + react-aria exclusively

---

## UI Component Migration Strategy

### Goal

Migrate all UI components from the legacy shadcn/ui-based implementation to use **DaisyUI + react-aria** exclusively. This ensures:
- Consistent design system with DaisyUI's Tailwind-based components
- Accessible UX patterns with react-aria's headless UI primitives
- No dependency on shadcn/ui or similar component libraries

### Architecture

**DaisyUI** provides the visual styling layer:
- Pre-built Tailwind CSS classes for common components
- Theme system with color schemes
- Responsive utilities

**react-aria** provides accessible behavior:
- Headless UI primitives with proper ARIA patterns
- Keyboard navigation
- Focus management
- Screen reader support

**Pattern:**
```typescript
import { useButton } from 'react-aria';
import { useRef } from 'react';

// DaisyUI provides styling via className
// react-aria provides accessible behavior via hooks
const Button = ({ children, ...props }) => {
  const ref = useRef(null);
  const { buttonProps } = useButton(props, ref);

  return (
    <button
      {...buttonProps}
      ref={ref}
      className="btn btn-primary" // DaisyUI classes
    >
      {children}
    </button>
  );
};
```

---

## UI Components to Migrate

### From Legacy App (53 Components)

Located in `@fanslib/apps/electron-legacy/src/renderer/src/components/ui/`:

#### Core Form Controls (Priority: Critical)
1. **Button** - Various states and variants
   - DaisyUI: `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`, etc.
   - react-aria: `useButton`

2. **Input** - Text input fields
   - DaisyUI: `input`, `input-bordered`
   - react-aria: `useTextField`

3. **Textarea** - Multi-line text input
   - DaisyUI: `textarea`, `textarea-bordered`
   - react-aria: `useTextField` with multiline

4. **Select** - Dropdown selection
   - DaisyUI: `select`, `select-bordered`
   - react-aria: `useSelect`

5. **Checkbox** - Boolean input
   - DaisyUI: `checkbox`
   - react-aria: `useCheckbox`

6. **Switch** - Toggle input
   - DaisyUI: `toggle`
   - react-aria: `useSwitch`

7. **RadioGroup** - Radio button group
   - DaisyUI: `radio`
   - react-aria: `useRadioGroup`, `useRadio`

8. **Slider** - Range input
   - DaisyUI: `range`
   - react-aria: `useSlider`

9. **FileInput** - File upload
   - DaisyUI: `file-input`
   - react-aria: Custom implementation with `useButton`

10. **Label** - Form field labels
    - DaisyUI: `label`, `label-text`
    - react-aria: `useLabel`

#### Layout Components (Priority: High)
11. **Card** - Content containers
    - DaisyUI: `card`, `card-body`, `card-title`

12. **Tabs** - Tabbed interface
    - DaisyUI: `tabs`, `tab`, `tab-active`
    - react-aria: `useTabs`

13. **Table** - Data tables
    - DaisyUI: `table`, `table-zebra`
    - react-aria: `useTable`

14. **Accordion** - Collapsible sections
    - DaisyUI: `collapse`, `collapse-title`, `collapse-content`
    - react-aria: `useAccordion`

15. **Separator** - Divider lines
    - DaisyUI: `divider`

16. **GridContainer** - Grid layouts
    - DaisyUI: Tailwind grid utilities

17. **PageContainer** - Page wrapper
    - DaisyUI: Custom wrapper with Tailwind

18. **PageHeader** - Page title/breadcrumb
    - DaisyUI: Custom with Tailwind typography

19. **SectionHeader** - Section titles
    - DaisyUI: Custom with Tailwind typography

20. **Sidebar** - Side navigation
    - DaisyUI: `drawer`
    - react-aria: `useMenu` for navigation

#### Overlays & Modals (Priority: High)
21. **Dialog** - Modal dialogs
    - DaisyUI: `modal`, `modal-box`
    - react-aria: `useDialog`, `useModal`

22. **AlertDialog** - Confirmation dialogs
    - DaisyUI: `modal` with alert styling
    - react-aria: `useAlertDialog`

23. **FormDialog** - Form in modal
    - DaisyUI: `modal` + form components
    - react-aria: `useDialog` + form hooks

24. **DeleteConfirmDialog** - Delete confirmation
    - DaisyUI: `modal` with warning styling
    - react-aria: `useAlertDialog`

25. **Sheet** - Slide-in panel
    - DaisyUI: `drawer` with slide animation
    - react-aria: `useOverlay`

26. **Popover** - Floating content
    - DaisyUI: Custom with Tailwind positioning
    - react-aria: `usePopover`

27. **Tooltip** - Hover information
    - DaisyUI: `tooltip`
    - react-aria: `useTooltip`

28. **DropdownMenu** - Context menu
    - DaisyUI: `dropdown`, `dropdown-content`
    - react-aria: `useMenu`

29. **Command** - Command palette
    - DaisyUI: `modal` + `menu` with search
    - react-aria: `useComboBox`

#### Feedback Components (Priority: High)
30. **Toast** - Notification toasts
    - DaisyUI: `alert` + toast positioning
    - react-aria: Custom with `useToast` pattern

31. **Alert** - Inline alerts
    - DaisyUI: `alert`, `alert-info`, `alert-success`, etc.

32. **Progress** - Progress bars
    - DaisyUI: `progress`
    - react-aria: `useProgressBar`

33. **LoadingSkeleton** - Content placeholders
    - DaisyUI: `skeleton`

34. **LoadingOverlay** - Full screen loading
    - DaisyUI: Custom with `loading` spinner

35. **EmptyState** - No data state
    - DaisyUI: Custom with Tailwind

36. **ErrorState** - Error display
    - DaisyUI: `alert alert-error`

37. **Status** - Status indicators
    - DaisyUI: `badge`

38. **Badge** - Small labels
    - DaisyUI: `badge`, `badge-primary`, etc.

39. **Sticker** - Custom badge/label
    - DaisyUI: `badge` with custom styling

#### Advanced Inputs (Priority: Medium)
40. **Calendar** - Date picker calendar
    - DaisyUI: Custom with Tailwind
    - react-aria: `useCalendar`

41. **DatePicker** - Single date selection
    - DaisyUI: Custom with Tailwind
    - react-aria: `useDatePicker`

42. **DateRangePicker** - Date range selection
    - DaisyUI: Custom with Tailwind
    - react-aria: `useDateRangePicker`

43. **Stepper** - Multi-step wizard
    - DaisyUI: `steps`, `step`
    - react-aria: Custom with navigation

44. **Toggle** - Boolean toggle
    - DaisyUI: `toggle`
    - react-aria: `useToggle`

45. **ToggleGroup** - Multi-toggle group
    - DaisyUI: `btn-group` with toggles
    - react-aria: `useToggleButtonGroup`

#### Utility Components (Priority: Medium)
46. **ScrollArea** - Custom scrollbar
    - DaisyUI: Tailwind overflow utilities + custom scrollbar

47. **Collapsible** - Expandable content
    - DaisyUI: `collapse`
    - react-aria: Custom pattern

48. **Resizable** - Resizable panels
    - DaisyUI: Custom with Tailwind
    - react-aria: Custom resize handlers

49. **FormField** - Form field wrapper
    - DaisyUI: `form-control`
    - react-aria: `useField`

50. **FormActions** - Form button group
    - DaisyUI: Custom button group with Tailwind

51. **Logo** - App logo component
    - DaisyUI: Custom with Tailwind

52. **Skeleton** - Loading skeleton (duplicate)
    - Covered in #33

### Additional Tremor Components

The legacy app also uses some Tremor components (`components/tremor/`):
- **CategoryBar** - Category distribution bar
- **AreaChart** - Area chart visualization
- **Tooltip** - Chart tooltip (duplicate)

**Migration Strategy for Charts:**
- Keep chart components as-is initially
- Consider migrating to a more modern chart library later (Recharts, Chart.js, etc.)
- Low priority - charts are less critical than core UI

---

## UI Component Implementation Phases

### Phase 0: Setup (Week 0.5)

**Install Dependencies:**
```bash
bun add react-aria react-stately
```

**Create Component Structure:**
```
@fanslib/apps/web/src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── checkbox.tsx
│       ├── switch.tsx
│       ├── radio-group.tsx
│       ├── dialog.tsx
│       ├── tooltip.tsx
│       ├── card.tsx
│       ├── tabs.tsx
│       ├── table.tsx
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── progress.tsx
│       ├── skeleton.tsx
│       ├── dropdown-menu.tsx
│       ├── popover.tsx
│       ├── toast.tsx
│       ├── calendar.tsx
│       ├── date-picker.tsx
│       └── ... (remaining components)
```

**Create Storybook Stories:**
- Set up Storybook for component development
- Create stories for each component
- Document usage patterns

### Phase 1: Core Form Controls (Week 1) ✅ COMPLETE

**Priority:** Critical - Needed for all forms

**Components to Implement:**
1. ✅ Button (with loading state, variants, sizes)
2. ✅ Input (text, email, password, number)
3. ✅ Textarea
4. ✅ Select
5. ✅ Checkbox
6. ✅ Switch
7. ✅ RadioGroup
8. ✅ Label
9. ✅ FormField (wrapper)
10. ✅ FormActions (button group)

**Acceptance Criteria:**
- ✅ Focus management is proper
- ✅ Components are fully typed
- ✅ Storybook stories exist
- ✅ Component props / types / API follows react-aria + DaisyUI pattern

### Phase 2: Layout & Feedback (Week 2) ✅ COMPLETE

**Priority:** High - Needed for content display

**Components to Implement:**
11. ✅ Card
12. ✅ Tabs
13. ✅ Table
14. ✅ Alert
15. ✅ Badge
16. ✅ Progress
17. ✅ Skeleton/LoadingSkeleton
18. ✅ EmptyState
19. ✅ ErrorState
20. ✅ Status
21. ✅ Separator
22. ✅ PageContainer
23. ✅ PageHeader
24. ✅ SectionHeader

**Acceptance Criteria:**
- ✅ Components integrate with DaisyUI themes
- ✅ Loading states work properly
- ✅ Error states are clear
- ✅ Empty states guide users
- ✅ Component props / types / API follows react-aria + DaisyUI pattern

### Phase 3: Modals & Overlays (Week 2-3) ✅ COMPLETE

**Priority:** High - Needed for interactions

**Components to Implement:**
25. ✅ Dialog
26. ✅ AlertDialog
27. ✅ FormDialog
28. ✅ DeleteConfirmDialog
29. ✅ Sheet
30. ✅ Popover
31. ✅ Tooltip
32. ✅ DropdownMenu
33. ✅ Toast (with provider)

**Acceptance Criteria:**
- ✅ Focus trapping works in modals
- ✅ ESC key closes overlays
- ✅ Click outside closes overlays
- ✅ Proper z-index layering
- ✅ Accessible announcements
- ✅ Component props / types / API follows react-aria + DaisyUI pattern

### Phase 4: Advanced Inputs (Week 3-4)

**Priority:** Medium - Complex interactions

**Components to Implement:**
34. Calendar
35. DatePicker
36. DateRangePicker
37. Slider
39. Stepper
40. Toggle
41. ToggleGroup
42. Command (command palette)

**Acceptance Criteria:**
- Command palette is fast and searchable
- Component props / types / API is the same as legacy components

### Phase 5: Utility & Specialized (Week 4-5)

**Priority:** Low - Nice to have

**Components to Implement:**
43. ScrollArea
44. Collapsible/Accordion
45. Resizable
46. Sidebar
47. GridContainer
48. Logo
49. LoadingOverlay
50. Sticker

**Acceptance Criteria:**
- Component props / types / API is the same as legacy components
- All components have Storybook stories
- All components are documented in Storybook

---

## DaisyUI + react-aria Component Examples

### Example 1: Button with react-aria

```typescript
import { useButton } from 'react-aria';
import { useRef } from 'react';
import type { AriaButtonProps } from 'react-aria';

type ButtonProps = AriaButtonProps & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  ...props
}: ButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps, isPressed } = useButton(
    { ...props, isDisabled: props.isDisabled || loading },
    ref
  );

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    error: 'btn-error',
  };

  const sizeClasses = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${
        isPressed ? 'btn-active' : ''
      }`}
    >
      {loading ? (
        <>
          <span className="loading loading-spinner loading-sm" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};
```

### Example 2: Dialog with react-aria

```typescript
import { useDialog } from 'react-aria';
import { useRef } from 'react';
import type { AriaDialogProps } from 'react-aria';

type DialogProps = AriaDialogProps & {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

export const Dialog = ({ title, children, isOpen, onClose, ...props }: DialogProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { dialogProps, titleProps } = useDialog(props, ref);

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div {...dialogProps} ref={ref} className="modal-box">
        <h3 {...titleProps} className="font-bold text-lg">
          {title}
        </h3>
        <div className="py-4">{children}</div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};
```

### Example 3: Select with react-aria

```typescript
import { useSelect } from 'react-aria';
import { useSelectState } from 'react-stately';
import { useRef } from 'react';
import type { AriaSelectProps } from 'react-aria';

type SelectProps = AriaSelectProps<object> & {
  label: string;
};

export const Select = ({ label, ...props }: SelectProps) => {
  const state = useSelectState(props);
  const ref = useRef<HTMLButtonElement>(null);
  const { labelProps, triggerProps, valueProps, menuProps } = useSelect(
    props,
    state,
    ref
  );

  return (
    <div className="form-control">
      <label {...labelProps} className="label">
        <span className="label-text">{label}</span>
      </label>
      <button
        {...triggerProps}
        ref={ref}
        className="select select-bordered"
      >
        <span {...valueProps}>
          {state.selectedItem?.textValue || 'Select an option'}
        </span>
      </button>
      {state.isOpen && (
        <ul {...menuProps} className="menu bg-base-200 rounded-box">
          {/* Menu items */}
        </ul>
      )}
    </div>
  );
};
```

---

## Integration with Feature Components

### How UI Components Support Feature Development

Each feature component built during migration will use these UI primitives:

**Example: PostEditor using UI components**
```typescript
import { Button, Input, Textarea, Select, Dialog } from '~/components/ui';
import { useLiveQuery } from '@electric-sql/pglite-react';
import { q } from '~/lib/db';
import { channelsCollection } from '~/lib/collections';
import { trpc } from '~/lib/trpc/client';

const PostEditor = () => {
  const { data: channels } = useLiveQuery(
    q.from({ channels: channelsCollection })
  );
  const createPost = trpc.posts.create.useMutation();

  return (
    <form onSubmit={handleSubmit}>
      <Textarea label="Caption" name="caption" />
      <Select label="Channel" items={channels ?? []}>
        {(channel) => <option key={channel.id}>{channel.name}</option>}
      </Select>
      <Input type="datetime-local" label="Schedule Date" name="date" />
      <Button type="submit" loading={createPost.isPending}>
        Create Post
      </Button>
    </form>
  );
};
```

---

## Available Data Layer

### Collections

All collections are defined in `@fanslib/apps/web/src/lib/collections/` and provide real-time sync with optimistic updates:

```typescript
// Available collections (import from '~/lib/collections'):
import {
  mediaCollection,
  shootCollection,
  postsCollection,
  channelsCollection,
  subredditsCollection,
  tagDimensionsCollection,
  tagDefinitionsCollection,
  mediaTagsCollection,
  schedulesCollection,
  snippetsCollection,
  hashtagsCollection,
  filterPresetsCollection
} from '~/lib/collections';
```

### Using useLiveQuery

Instead of custom query hooks, use `useLiveQuery` directly with the query builder:

```typescript
import { useLiveQuery } from '@electric-sql/pglite-react';
import { q } from '~/lib/db';
import { postsCollection, channelsCollection } from '~/lib/collections';

// Simple query - all posts
const { data: posts, isLoading, isError } = useLiveQuery(
  q.from({ posts: postsCollection })
);

// Filtered query - posts by channel
const { data: draftPosts } = useLiveQuery(
  q.from({ posts: postsCollection })
    .where({ status: 'draft' })
);

// Multiple collections
const { data: channels } = useLiveQuery(
  q.from({ channels: channelsCollection })
    .where({ typeId: 'reddit' })
);
```

**Common Query Patterns:**

```typescript
// Posts with filters
const { data: posts } = useLiveQuery(
  q.from({ posts: postsCollection })
    .where({
      channelId: selectedChannelId,
      status: 'draft'
    })
);

// Channels by type
const { data: channels } = useLiveQuery(
  q.from({ channels: channelsCollection })
    .where({ typeId: 'reddit' })
);

// Subreddits with filtering
const { data: subreddits } = useLiveQuery(
  q.from({ subreddits: subredditsCollection })
    .where({ verificationStatus: 'verified' })
);

// Tag dimensions
const { data: dimensions } = useLiveQuery(
  q.from({ dimensions: tagDimensionsCollection })
    .where({ dataType: 'categorical' })
);

// Tag definitions for a dimension
const { data: tags } = useLiveQuery(
  q.from({ tags: tagDefinitionsCollection })
    .where({ dimensionId: selectedDimensionId })
);

// Media tags for specific media
const { data: mediaTags } = useLiveQuery(
  q.from({ mediaTags: mediaTagsCollection })
    .where({ mediaId: selectedMediaId })
);

// Schedules for a channel
const { data: schedules } = useLiveQuery(
  q.from({ schedules: schedulesCollection })
    .where({ channelId: selectedChannelId })
);

// Snippets
const { data: snippets } = useLiveQuery(
  q.from({ snippets: snippetsCollection })
);

// Hashtags
const { data: hashtags } = useLiveQuery(
  q.from({ hashtags: hashtagsCollection })
);

// Filter presets
const { data: filterPresets } = useLiveQuery(
  q.from({ filterPresets: filterPresetsCollection })
);

// Media by shoot
const { data: media } = useLiveQuery(
  q.from({ media: mediaCollection })
    .where({ shootId: selectedShootId })
);
```

### tRPC Mutations

All mutations are available via `trpc` client (import from '~/lib/trpc/client'):

```typescript
// Posts
trpc.posts.create.useMutation()
trpc.posts.update.useMutation()
trpc.posts.delete.useMutation()

// Channels
trpc.channels.create.useMutation()
trpc.channels.update.useMutation()
trpc.channels.delete.useMutation()

// Similar pattern for:
// - trpc.subreddits.*
// - trpc.tagDimensions.*
// - trpc.tagDefinitions.*
// - trpc.mediaTags.* (create/delete only, no update)
// - trpc.schedules.*
// - trpc.snippets.*
// - trpc.hashtags.*
// - trpc.filterPresets.*

// Already implemented
trpc.media.update.useMutation()
trpc.media.delete.useMutation()
trpc.shoots.create.useMutation()
trpc.shoots.update.useMutation()
trpc.shoots.delete.useMutation()
```

---

## Architecture Patterns

### Pattern 1: Simple Read-Only List

**Use Case:** Display a list of items from a single table

**Example: PostsList.tsx**
```typescript
import { useLiveQuery } from '@electric-sql/pglite-react';
import { q } from '~/lib/db';
import { postsCollection } from '~/lib/collections';

const PostsList = () => {
  const { data: posts, isLoading, isError, status } = useLiveQuery(
    q.from({ posts: postsCollection })
      .where({ status: 'draft' })
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {status}</div>;

  return (
    <div>
      {posts?.map(post => (
        <PostCard key={post.id} post={post} />
      )) ?? null}
    </div>
  );
};
```

**Key Points:**
- Use `useLiveQuery` directly with the query builder
- Data is reactive - updates automatically
- No need to manually refetch
- Filter with `.where()` method
- Always handle `null` with `??` or `?.`

---

### Pattern 2: Filtered List with User Controls

**Use Case:** User can filter/search a list

**Example: ChannelList.tsx**
```typescript
import { useState } from 'react';
import { useLiveQuery } from '@electric-sql/pglite-react';
import { q } from '~/lib/db';
import { channelsCollection } from '~/lib/collections';

const ChannelList = () => {
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  // Build query dynamically based on filter
  const query = typeFilter
    ? q.from({ channels: channelsCollection }).where({ typeId: typeFilter })
    : q.from({ channels: channelsCollection });

  const { data: channels } = useLiveQuery(query);

  return (
    <div>
      <select onChange={(e) => setTypeFilter(e.target.value || undefined)}>
        <option value="">All Types</option>
        <option value="reddit">Reddit</option>
        <option value="fansly">Fansly</option>
        <option value="onlyfans">OnlyFans</option>
      </select>

      {channels?.map(channel => (
        <ChannelCard key={channel.id} channel={channel} />
      )) ?? null}
    </div>
  );
};
```

**Alternative - Client-Side Filtering:**
```typescript
const ChannelList = () => {
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const { data: allChannels } = useLiveQuery(
    q.from({ channels: channelsCollection })
  );

  // Filter client-side for complex conditions
  const filteredChannels = allChannels?.filter(c =>
    !typeFilter || c.typeId === typeFilter
  ) ?? [];

  return (
    <div>
      <select onChange={(e) => setTypeFilter(e.target.value || undefined)}>
        <option value="">All Types</option>
        <option value="reddit">Reddit</option>
        <option value="fansly">Fansly</option>
        <option value="onlyfans">OnlyFans</option>
      </select>

      {filteredChannels.map(channel => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  );
};
```

**Key Points:**
- Use state for filter values
- Build query dynamically or filter client-side
- Client-side filtering works well for small datasets
- Use `.where()` for server-side filtering
- Use ternary operators and arrow functions

---

### Pattern 3: Simple Mutations via Collection

**Use Case:** Update existing item directly

**Example: MediaEditor.tsx**
```typescript
import { mediaCollection } from '~/lib/collections';

type MediaEditorProps = {
  mediaId: number;
};

const MediaEditor = ({ mediaId }: MediaEditorProps) => {
  const handleUpdate = (updates: Partial<Media>) => {
    // Optimistically updates UI, then syncs to server
    mediaCollection.update(mediaId, updates);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleUpdate({
        name: formData.get('name') as string,
        // ... other fields
      });
    }}>
      <input name="name" />
      <button type="submit">Save</button>
    </form>
  );
};
```

**Key Points:**
- Direct collection updates for simple cases
- Optimistic UI updates
- Automatically syncs via tRPC
- No manual state management needed

---

### Pattern 4: Complex Mutations via tRPC

**Use Case:** Create items with relationships, or complex operations

**Example: PostEditor.tsx**
```typescript
import { useState } from 'react';
import { useLiveQuery } from '@electric-sql/pglite-react';
import { q } from '~/lib/db';
import { trpc } from '~/lib/trpc/client';
import { mediaCollection, channelsCollection } from '~/lib/collections';

const PostEditor = () => {
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);
  const createPost = trpc.posts.create.useMutation();

  const { data: media } = useLiveQuery(
    q.from({ media: mediaCollection })
  );
  const { data: channels } = useLiveQuery(
    q.from({ channels: channelsCollection })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await createPost.mutateAsync({
      caption: formData.get('caption') as string,
      scheduledDate: new Date(formData.get('date') as string),
      channelId: Number(formData.get('channelId')),
      status: 'draft',
    });

    // Electric will automatically sync the new post
    // No need to manually update any state
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="caption" placeholder="Caption" />
      <input type="datetime-local" name="date" />
      <select name="channelId">
        {channels?.map(channel => (
          <option key={channel.id} value={channel.id}>
            {channel.name}
          </option>
        )) ?? null}
      </select>

      <MediaSelector
        media={media ?? []}
        selected={selectedMediaIds}
        onChange={setSelectedMediaIds}
      />

      <button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
};
```

**Key Points:**
- Use tRPC mutations for complex operations
- Use `useMutation()` hook from tRPC
- Call `.mutateAsync()` for async/await pattern
- New items automatically appear in live queries
- Use `isPending` for loading states

---

### Pattern 5: Optimistic Updates with Error Handling

**Use Case:** Update with user feedback

**Example: ChannelEditor.tsx**
```typescript
import { trpc } from '~/lib/trpc/client';

type ChannelEditorProps = {
  channelId: number;
};

const ChannelEditor = ({ channelId }: ChannelEditorProps) => {
  const updateChannel = trpc.channels.update.useMutation({
    onSuccess: () => {
      toast.success('Channel updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleUpdate = async (data: UpdateChannel) => {
    await updateChannel.mutateAsync({
      id: channelId,
      data,
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleUpdate({
        name: formData.get('name') as string,
        description: formData.get('description') as string,
      });
    }}>
      <input name="name" />
      <textarea name="description" />
      <button type="submit" disabled={updateChannel.isPending}>
        {updateChannel.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};
```

**Key Points:**
- Pass callbacks to `useMutation()`
- Use `onSuccess` and `onError` for feedback
- Check `isPending` for loading states
- Use `mutateAsync` for promise-based flow

---

### Pattern 6: Client-Side JOINs

**Use Case:** Displaying relational data

**Example: PostDetail.tsx**
```typescript
import { useLiveQuery } from '@electric-sql/pglite-react';
import { q } from '~/lib/db';
import { postsCollection, channelsCollection, mediaCollection } from '~/lib/collections';

type PostDetailProps = {
  postId: number;
};

const PostDetail = ({ postId }: PostDetailProps) => {
  // Load all required collections
  const { data: posts } = useLiveQuery(
    q.from({ posts: postsCollection })
  );
  const { data: channels } = useLiveQuery(
    q.from({ channels: channelsCollection })
  );
  const { data: media } = useLiveQuery(
    q.from({ media: mediaCollection })
  );

  // Find specific items client-side
  const post = posts?.find(p => p.id === postId);
  const channel = channels?.find(c => c.id === post?.channelId);
  const postMedia = media?.filter(m =>
    post?.mediaIds?.includes(m.id)
  ) ?? [];

  if (!post) return <div>Post not found</div>;

  return (
    <div>
      <h1>{post.caption}</h1>
      <p>Channel: {channel?.name}</p>
      <div className="media-grid">
        {postMedia.map(m => (
          <img key={m.id} src={m.thumbnailPath} alt={m.name} />
        ))}
      </div>
    </div>
  );
};
```

**Key Points:**
- Load all required collections with separate `useLiveQuery` calls
- Use `.find()` and `.filter()` for client-side JOINs
- No complex server queries needed
- All data is reactive and stays in sync

---

## Legacy API to New Pattern Mapping

### Posts Components

**Legacy IPC Endpoints → New Pattern:**
- `post:create` → `trpc.posts.create.useMutation()`
- `post:getAll` → `useLiveQuery(q.from({ posts: postsCollection }))`
- `post:byId` → `useLiveQuery(...).data?.find(p => p.id === id)`
- `post:update` → `trpc.posts.update.useMutation()`
- `post:delete` → `trpc.posts.delete.useMutation()`
- `post:addMedia` → Create/update post-media relationships via tRPC
- `post:removeMedia` → Delete post-media relationships via tRPC

**Components to Migrate:**
- `PostsList.tsx` - List all posts with filters
- `PostEditor.tsx` - Create/edit posts with media selection
- `PostCalendar.tsx` - Calendar view of scheduled posts
- `PostDetail.tsx` - Single post view with media
- `PostCard.tsx` - Post list item component

---

### Channels Components

**Legacy IPC Endpoints → New Pattern:**
- `channel:create` → `trpc.channels.create.useMutation()`
- `channel:getAll` → `useLiveQuery(q.from({ channels: channelsCollection }))`
- `channel:update` → `trpc.channels.update.useMutation()`
- `channel:delete` → `trpc.channels.delete.useMutation()`
- `channel:subreddit-*` → `trpc.subreddits.*`, `useLiveQuery(q.from({ subreddits: ... }))`

**Components to Migrate:**
- `ChannelList.tsx` - List all channels by type
- `ChannelEditor.tsx` - Create/edit channel
- `SubredditManager.tsx` - Manage subreddit settings
- `SubredditAnalytics.tsx` - Posting times analysis (future)

---

### Tags Components

**Legacy IPC Endpoints → New Pattern:**
- `tags:createDimension` → `trpc.tagDimensions.create.useMutation()`
- `tags:getAllDimensions` → `useLiveQuery(q.from({ dimensions: tagDimensionsCollection }))`
- `tags:createTag` → `trpc.tagDefinitions.create.useMutation()`
- `tags:assignTagsToMedia` → `trpc.mediaTags.create.useMutation()`
- `tags:getMediaTags` → `useLiveQuery(q.from({ mediaTags: ... }).where({ mediaId }))`

**Components to Migrate:**
- `TagDimensionManager.tsx` - Manage tag dimensions
- `TagDefinitionEditor.tsx` - Manage tag values
- `MediaTagEditor.tsx` - Assign tags to media
- `TagBrowser.tsx` - Browse and filter by tags
- `TagStickers.tsx` - Display tag stickers on media

---

### Content Management Components

**Legacy IPC Endpoints → New Pattern:**
- `content-schedule:*` → `trpc.schedules.*`, `useLiveQuery(q.from({ schedules: ... }))`
- `snippet:*` → `trpc.snippets.*`, `useLiveQuery(q.from({ snippets: ... }))`
- `hashtag:*` → `trpc.hashtags.*`, `useLiveQuery(q.from({ hashtags: ... }))`

**Components to Migrate:**
- `ScheduleManager.tsx` - Create/edit content schedules
- `SnippetManager.tsx` - Manage caption snippets
- `HashtagSelector.tsx` - Select hashtags for posts
- `HashtagStats.tsx` - View hashtag performance

---

## Component Migration Checklist

For each component to migrate:

### 1. Identify Data Dependencies
- [ ] What data does this component read?
- [ ] What data does this component write?
- [ ] Does it have relationships to other tables?

### 2. Replace IPC Calls with useLiveQuery
- [ ] Replace `window.api.entity:getAll` with `useLiveQuery(q.from({ entity: entityCollection }))`
- [ ] Replace `window.api.entity:create` with `trpc.entity.create.useMutation()`
- [ ] Replace `window.api.entity:update` with `trpc.entity.update.useMutation()`
- [ ] Replace `window.api.entity:delete` with `trpc.entity.delete.useMutation()`

### 3. Update State Management
- [ ] Remove manual state management (no need for `useState` for server data)
- [ ] Data comes from `useLiveQuery` automatically
- [ ] Use `useState` only for UI state (filters, selections, modals)
- [ ] Reuse existing Contexts for global state

### 4. Handle Loading & Error States
- [ ] Check `isLoading` for loading states
- [ ] Check `isError` and `status` for error states
- [ ] Check `mutation.isPending` for mutation loading
- [ ] Always handle `null` data with `?.` or `??`

---

## Migration Priority Order

### Week 1: Posts (Core Feature)
**Priority:** Critical - Main content creation workflow

**Components:**
1. `PostsList.tsx` - List view with filters
2. `PostCard.tsx` - Individual post display
3. `PostEditor.tsx` - Create/edit posts
4. `PostDetail.tsx` - Single post view
5. `PostCalendar.tsx` - Calendar scheduling view

**Routes:**
- `/posts` - List view
- `/posts/new` - Create post
- `/posts/:postId` - Edit/view post

**Acceptance Criteria:**
- Can create posts with media attachments
- Can schedule posts to channels
- Can filter posts by channel/status
- Changes sync across multiple windows

---

### Week 2: Channels & Subreddits
**Priority:** High - Required for post targeting

**Components:**
1. `ChannelList.tsx` - List all channels
2. `ChannelEditor.tsx` - Create/edit channels
3. `SubredditManager.tsx` - Manage subreddit settings
4. `SubredditList.tsx` - List subreddits with filters

**Routes:**
- `/channels` - Channel management
- `/channels/:channelId` - Edit channel
- `/subreddits` - Subreddit management

**Acceptance Criteria:**
- Can create/edit/delete channels
- Can manage subreddit settings
- Can filter channels by type
- Channels appear in post editor dropdown

---

### Week 3: Tags System
**Priority:** High - Critical for content organization

**Components:**
1. `TagDimensionManager.tsx` - Manage dimensions
2. `TagDefinitionEditor.tsx` - Manage tag values
3. `MediaTagEditor.tsx` - Tag assignment interface
4. `TagFilter.tsx` - Filter media by tags
5. `TagStickers.tsx` - Visual tag display

**Routes:**
- `/tags/dimensions` - Dimension management
- `/tags/:dimensionId` - Tag definitions
- Media grid integrates tag editor

**Acceptance Criteria:**
- Can create tag dimensions (categorical/numerical/boolean)
- Can create tag values within dimensions
- Can assign/remove tags from media
- Can filter media by tags
- Tag stickers display on media tiles

---

### Week 4: Content Management
**Priority:** Medium - Quality of life features

**Components:**
1. `ScheduleManager.tsx` - Content schedules
2. `SnippetManager.tsx` - Caption snippets
3. `HashtagManager.tsx` - Hashtag management
4. `FilterPresetManager.tsx` - Saved filters

**Routes:**
- `/schedules` - Schedule management
- `/snippets` - Snippet library
- `/hashtags` - Hashtag management
- `/filters` - Filter presets

**Acceptance Criteria:**
- Can create posting schedules per channel
- Can save/reuse caption snippets
- Can manage hashtag library
- Can save/load filter presets

---

### Week 5: Settings & Polish
**Priority:** Low - Nice to have

**Components:**
1. `SettingsPanel.tsx` - App settings
2. `FilterPresetSelector.tsx` - Quick filter switching
3. `BulkOperations.tsx` - Bulk tag assignment, etc.

**Features:**
- Settings persistence
- Bulk operations
- Keyboard shortcuts
- Performance optimization

---

## File Structure

```
@fanslib/apps/web/src/
├── components/
│   ├── ui/               (DaisyUI + react-aria primitives)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── posts/
│   │   ├── PostsList.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostEditor.tsx
│   │   ├── PostDetail.tsx
│   │   └── PostCalendar.tsx
│   ├── channels/
│   │   ├── ChannelList.tsx
│   │   ├── ChannelEditor.tsx
│   │   ├── SubredditManager.tsx
│   │   └── SubredditList.tsx
│   ├── tags/
│   │   ├── TagDimensionManager.tsx
│   │   ├── TagDefinitionEditor.tsx
│   │   ├── MediaTagEditor.tsx
│   │   ├── TagFilter.tsx
│   │   └── TagStickers.tsx
│   ├── schedules/
│   │   └── ScheduleManager.tsx
│   ├── snippets/
│   │   └── SnippetManager.tsx
│   ├── hashtags/
│   │   └── HashtagManager.tsx
│   └── filters/
│       └── FilterPresetManager.tsx
│
├── routes/
│   ├── posts/
│   │   ├── index.tsx
│   │   ├── new.tsx
│   │   └── $postId.tsx
│   ├── channels/
│   │   ├── index.tsx
│   │   └── $channelId.tsx
│   ├── tags/
│   │   ├── dimensions.tsx
│   │   └── $dimensionId.tsx
│   └── settings/
│       └── index.tsx
│
└── lib/
    ├── db.ts              (✅ Electric SQL + query builder)
    ├── collections/       (✅ All collections)
    │   ├── index.ts
    │   ├── media.ts
    │   ├── posts.ts
    │   └── ...
    └── trpc/
        ├── client.ts      (✅ Complete)
        └── routes/        (✅ Complete)
```

**Note:** The `query/` directory is no longer needed - use `useLiveQuery` directly in components.

---

## Testing Strategy

### Manual Testing Checklist

For each component:

**Data Flow:**
- [ ] Component loads data correctly
- [ ] Filters work as expected
- [ ] Loading states display properly
- [ ] Error states display properly

**Mutations:**
- [ ] Create operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Optimistic updates appear instantly
- [ ] Server sync happens correctly

**Reactivity:**
- [ ] Changes appear in real-time across windows
- [ ] Collection updates reflect immediately
- [ ] No stale data issues

**Edge Cases:**
- [ ] Empty state displays correctly
- [ ] Handles network errors gracefully
- [ ] Handles validation errors
- [ ] Works offline (optimistic updates)

---

## Common Patterns Cheat Sheet

### Reading Data
```typescript
import { useLiveQuery } from '@electric-sql/pglite-react';
import { q } from '~/lib/db';
import { postsCollection, channelsCollection } from '~/lib/collections';

// Simple list
const { data: items, isLoading, isError } = useLiveQuery(
  q.from({ items: itemsCollection })
);

// Filtered list
const { data: items } = useLiveQuery(
  q.from({ items: itemsCollection })
    .where({ filter: value })
);

// Find by ID (client-side)
const item = items?.find(i => i.id === id);

// Relational data (client-side JOINs)
const { data: posts } = useLiveQuery(q.from({ posts: postsCollection }));
const { data: channels } = useLiveQuery(q.from({ channels: channelsCollection }));
const post = posts?.find(p => p.id === postId);
const channel = channels?.find(c => c.id === post?.channelId);

// Client-side filtering for complex conditions
const filteredItems = items?.filter(i =>
  i.name.includes(searchTerm) && i.status === 'active'
) ?? [];
```

### Writing Data
```typescript
import { trpc } from '~/lib/trpc/client';
import { mediaCollection } from '~/lib/collections';

// Simple update via collection
mediaCollection.update(id, updates);

// Complex mutation via tRPC
const create = trpc.entity.create.useMutation();
await create.mutateAsync({ ...data });

// With callbacks
const update = trpc.entity.update.useMutation({
  onSuccess: () => toast.success('Updated'),
  onError: (err) => toast.error(err.message),
});
await update.mutateAsync({ id, data });

// Delete
const remove = trpc.entity.delete.useMutation();
await remove.mutateAsync({ id });
```

### UI State
```typescript
// Use state for UI only - never for server data
const [selectedIds, setSelectedIds] = useState<number[]>([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [filter, setFilter] = useState('');

// Server data comes from useLiveQuery
const { data: items } = useLiveQuery(
  q.from({ items: itemsCollection })
);

// Filter client-side or in query
const filtered = items?.filter(i => i.name.includes(filter)) ?? [];
```

### Handling Null Safety
```typescript
// Always handle potential null from useLiveQuery
const { data: items } = useLiveQuery(...);

// Option 1: Optional chaining + nullish coalescing
items?.map(i => <Item key={i.id} item={i} />) ?? null

// Option 2: Default to empty array
const safeItems = items ?? [];
safeItems.map(i => <Item key={i.id} item={i} />)

// Option 3: Early return
if (!items) return <Loading />;
return items.map(i => <Item key={i.id} item={i} />);
```

---

## Additional Resources

**Existing Reference Components:**
- `@fanslib/apps/web/src/lib/collections/` - All collections
- `@fanslib/apps/web/src/lib/db.ts` - Query builder

**TanStack Docs:**
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Router](https://tanstack.com/router/latest)
- [tRPC](https://trpc.io)
- [Electric SQL](https://electric-sql.com)

**Legacy Code Reference:**
- `@fanslib/apps/electron-legacy/src/features/` - Legacy component patterns

---

## Notes for Migration Agent

1. **Data Layer is Complete:** All backend infrastructure is ready. Focus on UI components only.

2. **Follow Functional Style:** Use arrow functions, const only, map/filter/reduce, no mutations, ternary operators.

3. **No Manual State Management:** Server data comes from `useLiveQuery`. Only use `useState` for UI state (modals, filters, selections).

4. **Direct useLiveQuery Usage:** No intermediate query hooks - use `useLiveQuery(q.from({ ... }))` directly in components.

5. **Optimistic Updates Work:** Collections handle optimistic updates automatically. tRPC mutations sync to server.

6. **Real-Time Sync:** All data is reactive. Changes in one window appear in all windows automatically.

7. **Client-Side JOINs:** Load all required collections with separate `useLiveQuery` calls and use `.find()` for relationships. No complex server queries needed.

8. **Always Handle Null:** `useLiveQuery` returns `data | null`. Always use optional chaining `?.` or nullish coalescing `??`.

9. **Start Simple:** Begin with read-only list views, then add mutations, then complex features.

---

**Last Updated:** 2025-10-31
**Backend Status:** ✅ Complete (Phases 1-3 done)
**Frontend Status:** 🚧 UI Components - Phases 1-3 Complete ✅ | Phases 4-5 Pending
