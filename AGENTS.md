# FansLib AI coding guide (Claude / Cursor / Copilot)

## Current Migration Status - ACTIONREQUIRED

**Hono Migration in Progress (as of Feb 1, 2026):**

### What's Been Done:
1. ✅ Added dependencies to package.json (hono, @hono/zod-validator, zod, @hono/node-server)
2. ✅ Created Hono server utilities (hono-utils.ts, devalue-middleware.ts)
3. ✅ Created Hono web client (hono-client.ts)
4. ✅ Migrated Settings feature (6 endpoints - complete)
5. ✅ Migrated Bluesky feature (1 endpoint - complete)
6. ✅ Converted 6 entity schemas to Zod (filter-presets, channels, hashtags, subreddits, shoots, snippets)

### **REQUIRED ACTION - Run This Command:**
```bash
bun install
```
This installs the new Hono dependencies. The migration cannot proceed or be tested without this step.

### What Needs to Happen Next:
1. User runs `bun install`
2. Continue migrating remaining entity schemas (5 files)
3. Migrate library/media-filter schemas (many features depend on this)
4. Update main server app (index.ts) to use Hono
5. Migrate remaining features one by one
6. Test after each feature

### Known Issues:
- Main server app still uses Elysia - server won't start until main app is migrated
- Many features have cross-dependencies on schemas
- Cannot validate changes until `bun install` is run

## Ralph Loop Operations

When running in the Ralph loop (`./loop.sh`), follow these operational guidelines:

**Validation (Backpressure)**

```bash
bun lint && bun typecheck && bun test
```

**Git Workflow**

- After successful validation: `git add -A && git commit -m "message" && git push`
- Create git tags when build/tests pass: increment from last tag (start at 0.0.1)

**File Updates**

- Keep `@IMPLEMENTATION_PLAN.md` current with progress, discoveries, and bugs
- Update `@AGENTS.md` only for operational learnings (how to build/run)
- Do NOT put status updates or progress notes in AGENTS.md

---

This repo is a Bun + Turborepo monorepo. Follow these rules by default unless a subdirectory has more specific guidance.

## Non-negotiables

- TypeScript only; prefer `type` over `interface`; avoid `any` (use `unknown` + validate).
- Functional + declarative style; avoid mutation; never use classes or inheritance.
- Never use loops (`for`, `while`, `do/while`, `for...in`); prefer array methods (`.map/.filter/.reduce/...`). Only exception: `for await...of` for `AsyncIterable`.
- Always use arrow functions; named exports only; never default exports.
- Prefer early returns over nested `if/else` blocks.
- Event callbacks: don’t use `handle*`; name after the action (`toggleMenu`, `submitForm`).
- Keep code DRY via small helpers and modules; keep files narrowly scoped to related content.

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

## Coding Philosophy

### Core Principles

**Prioritize clarity and readability above all else.** Code is read far more often than it's written. Every line should communicate intent clearly. If code needs comments to explain _what_ it does, the code needs improvement.

**Favor functional programming over imperative programming.** Think in terms of data transformations rather than procedures. Pure functions that take inputs and return outputs are easier to understand, test, and compose than code with side effects and mutable state.

**Design types first, then write implementations.** View your code as a pipeline of type transformations. When types are awkward, the API is probably wrong. Let the type system guide you toward better designs.

**Make errors explicit in the type system.** Use result types that represent success or failure rather than throwing exceptions. This makes error handling visible and forces you to handle both cases.

**Validate data at system boundaries, then trust types throughout.** Once external data is validated with schemas, the type system ensures correctness everywhere else. This eliminates defensive programming and scattered runtime checks.

**Test intentionally, not for coverage.** Focus tests on business logic and integration points. Use the type system to prevent errors at compile time. Ignore code coverage metrics—they measure lines executed, not correctness.

**Compose small, focused functions.** Break complex logic into single-purpose units. Isolated functions are easier to understand, test, and reuse. Side effects should be pushed to the edges of your application.

### Balancing Competing Concerns

When facing tradeoffs:

- **Clarity vs. Brevity**: Choose clarity. Explicit is better than clever.
- **Abstraction vs. Duplication**: Prefer slight duplication over premature abstraction. Extract patterns only when they recur multiple times and the abstraction is obvious.
- **Type Safety vs. Convenience**: Choose type safety. The compiler catches errors that tests miss.
- **Performance vs. Readability**: Choose readability first. Optimize only when profiling shows actual bottlenecks.

---

## Code Style and Conventions

### Naming Conventions

**Never prefix functions with "get".** The word "get" is vague and doesn't communicate intent. Use descriptive verbs that indicate what the function does (`formatUserName`, `calculateDiscount`) or name pure transformation functions as nouns (`userName`, `displayPrice`).

```typescript
// ❌ DON'T
const getUserName = (user: User) => user.name;
const getDisplayPrice = (price: number) => `$${price.toFixed(2)}`;

// ✅ DO
const userName = (user: User) => user.name;
const formatPrice = (price: number) => `$${price.toFixed(2)}`;
```

**Use descriptive, intention-revealing names** for variables, functions, and types. Names should explain why something exists and what it represents.

**Name functions as values when they're simple transformations.** This encourages point-free composition and makes code more declarative.

### Code Organization

**Place data as the last parameter in utility functions.** Put configuration, dependencies, and options first. This enables easy partial application and currying.

```typescript
// ❌ DON'T
const formatPrice = (price: number, currency: string) =>
  `${currency}${price.toFixed(2)}`;
prices.map((price) => formatPrice(price, '€'));

// ✅ DO
const formatPrice = (currency: string) => (price: number) =>
  `${currency}${price.toFixed(2)}`;
prices.map(formatPrice('€'));
```

**Organize files by feature or domain, not by technical role.** Group related components, types, and utilities together rather than separating by file type.

### Import/Export Patterns

**Export functions directly, not as properties of objects.** Don't use classes or objects to namespace related functions—JavaScript modules already provide namespacing.

```typescript
// ❌ DON'T
class MathUtils {
  static add(a: number, b: number) {
    return a + b;
  }
  static multiply(a: number, b: number) {
    return a * b;
  }
}

// ✅ DO
export const add = (a: number, b: number) => a + b;
export const multiply = (a: number, b: number) => a * b;
```

### Formatting Preferences

**Use early returns to handle edge cases at the beginning of functions.** Keep the main logic at the lowest indentation level. Exit early for invalid inputs, errors, or special cases.

```typescript
// ❌ DON'T
const processUser = (user: User | null) => {
  if (user) {
    if (user.isActive) {
      // main logic deeply nested
    }
  }
};

// ✅ DO
const processUser = (user: User | null) => {
  if (!user) return null;
  if (!user.isActive) return null;

  // main logic at top level
};
```

**Don't be afraid of nested ternaries.** They're expressions that produce values, making code more functional and composable.

```typescript
// ✅ DO
const userStatus = user.isBanned
  ? 'banned'
  : user.isVerified
    ? 'active'
    : 'pending';
```

---

## Patterns to Follow

### Functional Programming

**Always use `const`, never `let`.** Immutable bindings prevent accidental reassignment and make code easier to reason about. If you think you need `let`, you're likely writing imperative code that should be functional.

```typescript
// ❌ DON'T
let total = 0;
for (const item of items) {
  total += item.price;
}

// ✅ DO
const total = items.reduce((sum, item) => sum + item.price, 0);
```

**Never mutate arrays or objects.** Use spreads, `.filter()`, `.map()`, and `.reduce()` to create new values instead of modifying existing ones.

```typescript
// ❌ DON'T
const activeUsers = [];
users.forEach((user) => {
  if (user.isActive) activeUsers.push(user);
});

updatedUser.lastLogin = new Date();
cart.splice(itemIndex, 1);

// ✅ DO
const activeUsers = users.filter((user) => user.isActive);

const updatedUser = { ...user, lastLogin: new Date() };
const updatedCart = cart.filter((item) => item.id !== productId);
```

**Prefer expressions over statements.** Use ternaries instead of if/else, array methods instead of loops, and values that can be assigned to `const` rather than imperatively building results.

```typescript
// ❌ DON'T
let discount;
if (user.isPremium) {
  discount = 0.2;
} else {
  discount = 0.1;
}

// ✅ DO
const discount = user.isPremium ? 0.2 : 0.1;
```

**Use object/map lookups instead of multiple if statements or switch cases** when mapping values:

```typescript
// ❌ DON'T
let statusColor;
if (status === 'success') {
  statusColor = 'green';
} else if (status === 'warning') {
  statusColor = 'yellow';
} else {
  statusColor = 'gray';
}

// ✅ DO
const statusColorMap = {
  success: 'green',
  warning: 'yellow',
  error: 'red',
} as const;

const statusColor = statusColorMap[status] ?? 'gray';
```

**Never use traditional loops.** Use array methods (`.map()`, `.filter()`, `.reduce()`, `.some()`, `.every()`, `.find()`) instead of `for`, `while`, `do/while`, or `for...in`. The only exception is `for await...of` with `AsyncIterable` types.

```typescript
// ❌ DON'T
for (let i = 0; i < users.length; i++) {
  console.log(users[i].name);
}

// ✅ DO
users.map((user) => user.name).forEach(console.log);
```

**For async operations, use `.map()` with `Promise.all()` instead of loops with `await`.** Loops cause sequential execution; `Promise.all()` runs operations in parallel.

```typescript
// ❌ DON'T (sequential execution)
const results = [];
for (const userId of userIds) {
  const user = await fetchUser(userId);
  results.push(user);
}

// ✅ DO (parallel execution)
const results = await Promise.all(userIds.map(fetchUser));
```

### Function Composition

**Break complex logic into small, composable pure functions.** Each function should do one thing, accept inputs, and return outputs without side effects.

```typescript
// ❌ DON'T mix business logic with side effects
const processOrder = async (orderId: string) => {
  const order = await fetchOrder(orderId);
  const discount = order.isPremium ? 0.2 : 0;
  const tax = order.total * 0.1;
  const finalPrice = order.total * (1 - discount) + tax;
  await updateOrder(orderId, { finalPrice });
  return finalPrice;
};

// ✅ DO separate pure logic from side effects
const calculateDiscount = (isPremium: boolean) => (isPremium ? 0.2 : 0);
const calculateTax = (total: number) => total * 0.1;
const calculateFinalPrice = (total: number, discount: number, tax: number) =>
  total * (1 - discount) + tax;

const processOrder = async (orderId: string) => {
  const order = await fetchOrder(orderId);
  const discount = calculateDiscount(order.isPremium);
  const tax = calculateTax(order.total);
  const finalPrice = calculateFinalPrice(order.total, discount, tax);
  await updateOrder(orderId, { finalPrice });
  return finalPrice;
};
```

**Use point-free composition** where possible. Eliminate intermediate variables and arrow function wrappers by extracting named functions.

```typescript
// ❌ DON'T
const adultNames = users
  .filter((user) => user.age >= 18)
  .map((user) => user.name)
  .map((name) => name.toUpperCase());

// ✅ DO
const isAdult = (user: User) => user.age >= 18;
const userName = (user: User) => user.name;
const toUpperCase = (str: string) => str.toUpperCase();

const adultNames = users.filter(isAdult).map(userName).map(toUpperCase);
```

**Prefer `.then()` over `async/await` for promise composition.** Use `async/await` only when you need complex imperative control flow with multiple branches or when one async result is needed by multiple subsequent operations.

```typescript
// ❌ DON'T use async/await for simple chains
const processOrder = async (orderId: string) => {
  const order = await fetchOrder(orderId);
  const validated = await validateOrder(order);
  const enriched = await enrichOrderData(validated);
  return formatOrder(enriched);
};

// ✅ DO use .then() for transformation pipelines
const processOrder = (orderId: string) =>
  fetchOrder(orderId)
    .then(validateOrder)
    .then(enrichOrderData)
    .then(formatOrder);

// ✅ DO use async/await when one result feeds multiple operations
const createSummary = async (orderId: string) => {
  const order = await fetchOrder(orderId);

  const customer = await fetchCustomer(order.customerId);
  const shipping = await calculateShipping(order);
  const discount = await calculateDiscount(order, customer);

  return {
    total: order.total - discount + shipping,
    customerName: customer.name,
  };
};
```

### Type-Driven Design

**Think in type transformations, not procedural steps.** Define clear input and output types before implementation. View your code as a pipeline that transforms data from one type to another.

```typescript
// ✅ DO design types that show the transformation flow
type Cart = { items: CartItem[] };
type PricedCart = { items: CartItem[]; total: number };
type DiscountedCart = PricedCart & { discount: number; finalTotal: number };
type Order = { userId: string; items: CartItem[]; total: number };

const calculateTotal = (cart: Cart): PricedCart => ({
  /* ... */
});
const applyDiscount =
  (isPremium: boolean) =>
  (cart: PricedCart): DiscountedCart => ({
    /* ... */
  });
const toOrder =
  (userId: string) =>
  (cart: DiscountedCart): Order => ({
    /* ... */
  });
```

**Use result types instead of throwing exceptions.** Libraries like `neverthrow` provide `Result<T, E>` types that make errors explicit in function signatures.

```typescript
import { Result, ok, err } from 'neverthrow';

// ❌ DON'T throw exceptions
const parseUser = (data: unknown): User => {
  if (!isValid(data)) throw new Error('Invalid data');
  return data as User;
};

// ✅ DO return Result types
type ParseError =
  | { type: 'invalid_data' }
  | { type: 'invalid_email'; email: unknown };

const parseUser = (data: unknown): Result<User, ParseError> => {
  if (!data || typeof data !== 'object') {
    return err({ type: 'invalid_data' });
  }
  // ... validate and return ok(user)
};

// Compose with .andThen(), .map(), .mapErr()
const processUser = (data: unknown) =>
  parseUser(data)
    .asyncAndThen(saveUser)
    .mapErr((error) => {
      console.error(error);
      return error;
    });
```

**Validate data at boundaries using schemas.** Use libraries like ArkType or Zod to define schemas at API endpoints, database queries, and external service calls. Once validated, trust the types throughout your codebase.

```typescript
import { type } from 'arktype';

const CreateUserRequest = type({
  email: 'string.email',
  'age>=': 18,
  name: 'string',
});

type CreateUserRequest = typeof CreateUserRequest.infer;

const createUser = async (req: Request, res: Response) => {
  const data = CreateUserRequest(req.body);

  if (data instanceof type.errors) {
    return res.status(400).json({ error: data.summary });
  }

  // data is now typed as CreateUserRequest
  const user = await db.users.create(data);
  return res.json(user);
};
```

### Component Patterns (React)

**Never use `useEffect` and `useState` for data fetching.** Use dedicated data fetching libraries like TanStack Query or SWR. They handle loading states, errors, race conditions, caching, refetching, and cleanup automatically.

```typescript
// ❌ DON'T manually manage data fetching
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  fetchUser(userId)
    .then(setUser)
    .catch(setError)
    .finally(() => setLoading(false));
}, [userId]);

// ✅ DO use TanStack Query
const useUser = (userId: string) =>
  useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then((res) => res.json()),
  });

const { data: user, isLoading, error } = useUser(userId);
```

**Structure complex components using composition.** Create a root component that provides shared state/logic via context, with child components that consume that context. This pattern prevents prop explosion and makes components more flexible.

```typescript
// ✅ DO use component composition
const Tooltip = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  // ... provide context with state and handlers
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
};

const TooltipTrigger = ({ children }: { children: ReactNode }) => {
  const { triggerProps } = useTooltip();
  return <div {...triggerProps}>{children}</div>;
};

const TooltipContent = ({ children }: { children: ReactNode }) => {
  const { isOpen, contentProps } = useTooltip();
  if (!isOpen) return null;
  return <div {...contentProps}>{children}</div>;
};

// Usage
<Tooltip>
  <TooltipTrigger><HelpIcon /></TooltipTrigger>
  <TooltipContent>Helpful text</TooltipContent>
</Tooltip>
```

### Accessibility

**Always respect `prefers-reduced-motion`.** Disable or reduce animations when users prefer reduced motion. This is an accessibility requirement for users with vestibular disorders or motion sensitivity.

```typescript
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const duration = prefersReducedMotion ? 0 : 300;

<motion.div animate={{ opacity: 1 }} transition={{ duration }}>
  {children}
</motion.div>
```

Or in CSS:

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

---

## Anti-Patterns to Avoid

### Classes and Object-Oriented Patterns

**Never use classes.** Use functions and types instead to model behavior and data separately. Classes encourage mutable state through instance properties, methods with hidden `this` dependencies, and inheritance that creates tight coupling.

```typescript
// ❌ DON'T use classes
class UserService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetchUser(id: string) {
    return fetch(`${this.baseUrl}/users/${id}`).then((r) => r.json());
  }
}

// ✅ DO use functions with injected dependencies
type ApiConfig = { baseUrl: string; timeout: number };

const fetchUser = (config: ApiConfig) => (id: string) =>
  fetch(`${config.baseUrl}/users/${id}`, {
    signal: AbortSignal.timeout(config.timeout),
  }).then((r) => r.json());

const config: ApiConfig = { baseUrl: 'https://api.example.com', timeout: 5000 };
const userPromise = fetchUser(config)('123');
```

**Why this is problematic:** Classes hide dependencies in `this`, make testing harder, and encourage inheritance over composition. Methods can't be used without instantiating the class even when they don't need instance state.

**Never use inheritance.** Use union types with functions instead. Inheritance creates tight coupling where behavior changes force you to modify class structures rather than composing different functions.

```typescript
// ❌ DON'T use inheritance
class Animal {
  makeSound(): string {
    return 'Some sound';
  }
}
class Dog extends Animal {
  makeSound(): string {
    return 'Woof!';
  }
}

// ✅ DO use union types with functions
type Dog = { type: 'dog'; name: string; breed: string };
type Cat = { type: 'cat'; name: string; indoor: boolean };
type Animal = Dog | Cat;

const makeSound = (animal: Animal) => {
  if (animal.type === 'dog') return 'Woof!';
  if (animal.type === 'cat') return 'Meow!';
};
```

### Control Flow Anti-Patterns

**Never use `try/catch` or `throw` for error handling.** Use result types that explicitly represent success or failure in the type system. Exceptions are invisible in type signatures and break functional composition.

```typescript
// ❌ DON'T throw exceptions
const parseUser = (data: unknown): User => {
  if (!isValid(data)) throw new Error('Invalid data');
  return data as User;
};

try {
  const user = parseUser(data);
  // use user
} catch (error) {
  console.error(error);
}

// ✅ DO use Result types
const parseUser = (data: unknown): Result<User, ParseError> => {
  if (!isValid(data)) return err({ type: 'invalid_data' });
  return ok(data as User);
};

parseUser(data)
  .andThen(saveUser)
  .mapErr((error) => console.error(error));
```

**Why this is problematic:** Functions that throw don't communicate this in their signature. You must read documentation or implementation to know what can fail. Result types make errors explicit and force you to handle both cases.

**Never use loops (`for`, `while`, `do/while`, `for...in`).** Use array methods that describe the transformation you want. The only exception is `for await...of` with AsyncIterables.

**Why this is problematic:** Loops are imperative (describe **how** to iterate) rather than declarative (describe **what** you want). They require mutation, temporary variables, and don't compose. Array methods make intent clear at a glance.

**Never use `let` or reassignment.** Always use `const`. Mutation invites bugs when code changes because other developers may not understand your assumptions.

**Why this is problematic:** Mutable variables mean you must track their value across time. Immutable bindings eliminate time as a factor—a name is always the same value.

### Code Organization Anti-Patterns

**Never use the "get" prefix.** Use descriptive verbs or name transformation functions as nouns.

**Why this is problematic:** "get" is vague. It doesn't communicate whether you're fetching from an API, transforming data, or accessing a property.

**Don't use mutating array methods** like `.push()`, `.splice()`, `.sort()`, `.reverse()`, etc. Use immutable alternatives: spreads, `.filter()`, `.map()`, `.concat()`, `.slice()`, and libraries like Ramda for sorting.

**Why this is problematic:** Mutation creates hidden temporal dependencies. Code that modifies arrays in place is harder to reason about and can cause bugs when arrays are shared references.

**Don't deep-nest if/else blocks.** Use early returns to handle edge cases at the beginning of functions.

**Why this is problematic:** Deep nesting increases cognitive load exponentially. Each level requires holding more context in your head. Early returns flatten the structure and make the main logic clear.

### Testing Anti-Patterns

**Never write tests just for code coverage.** Coverage measures lines executed, not correctness. High coverage doesn't mean your code is correct—it just means lines ran.

**Why this is problematic:** Tests written for coverage targets add maintenance burden without providing value. They create false confidence and waste time.

**Don't test types or implementation details.** Trust the type system for type safety. Test meaningful business logic and integration points.

```typescript
// ❌ DON'T test that types work
it('should return a number', () => {
  expect(typeof add(1, 2)).toBe('number');
});

// ✅ DO test business requirements
it('should apply correct final total for premium user with $100 order', () => {
  expect(calculateOrderTotal({ isPremium: true }, { total: 100 })).toBe(80);
});
```

**Why this is problematic:** The compiler already enforces types. Testing implementation details couples tests to code structure, making refactoring harder without adding value.

### React Anti-Patterns

**Never manually manage data fetching state with `useEffect` and `useState`.** This forces you to handle loading, errors, race conditions, caching, refetching, and cleanup manually. You'll duplicate logic everywhere and still miss edge cases.

**Why this is problematic:** Data fetching is a solved problem. Libraries like TanStack Query handle all edge cases automatically. Manual approaches are bug-prone and verbose.

**Don't create monolithic components with many props for different parts.** Use composition with context to avoid prop explosion.

**Why this is problematic:** Components with props like `triggerClassName`, `contentClassName`, `triggerChildren`, `contentChildren`, etc. become unwieldy. Composition makes each piece independently configurable.

---

## Comments

**Only write comments that explain WHY code exists, never WHAT it does or HOW it works.** The code itself should be self-explanatory through descriptive names, small functions, and clear types.

```typescript
// ❌ DON'T comment what code does
// Loop through users and filter by active status
const activeUsers = users.filter((user) => user.isActive);

// ✅ DO comment why decisions were made
// Legal requirement: users must be 18+ to view premium content
const canViewPremium = user.age >= 18;

// ✅ DO explain workarounds and technical constraints
// Safari 15 doesn't support CSS container queries, so we use ResizeObserver
// to manually apply the "compact" class. Can remove once Safari support reaches 95%.
useEffect(() => {
  const observer = new ResizeObserver(/* ... */);
  // ...
}, []);

// ✅ DO document non-obvious business rules
// Stripe charges process immediately, but bank transfers take 3 business days
// to clear. We can't show paid status until the transfer completes.
const isPaid =
  payment.method === 'card'
    ? payment.status === 'succeeded'
    : payment.status === 'succeeded' && payment.clearedAt !== null;
```

**Why this matters:** Code changes but comments don't. Comments that describe what code does become outdated immediately. WHY comments have lasting value because they explain context that code can't express: business rules, technical constraints, workarounds for external systems.

---

## Technology-Specific Guidelines

### TypeScript

- Always enable strict mode
- Use `type` instead of `interface` for consistency
- Leverage discriminated unions for type-safe state modeling
- Never use `any`—use `unknown` if the type is genuinely unknown, then validate it
- Use branded types for primitives that need semantic distinction (e.g., `UserId`, `Email`)

### React

- Prefer function components exclusively
- Use hooks for state and side effects
- Keep components small and focused on presentation or logic, not both
- Colocate related state—don't lift state higher than necessary
- Use context for dependency injection, not as global state management

### Data Validation

- Use ArkType or Zod for schema validation
- Validate at API boundaries, database boundaries, and external service boundaries
- Parse and validate external data in one step
- Use schema types to drive TypeScript types: `type User = typeof UserSchema.infer;`

### Async Operations

- Use TanStack Query or SWR for data fetching in React
- Use `Promise.all()` for parallel execution instead of sequential `await` in loops
- Prefer `.then()` chains for simple transformations
- Use `async/await` when one async result feeds multiple subsequent operations

### Error Handling

- Use `neverthrow` or similar for Result types
- Define union types for errors: `type Error = { type: "not_found" } | { type: "invalid_input"; field: string }`
- Compose errors with `.mapErr()` to add context
- Use `ResultAsync` for async operations

---

**When in doubt, prioritize:** functional over imperative, explicit over implicit, types over tests, clarity over cleverness, composition over inheritance, expressions over statements.

---

# FansLib Developer Guide

## Architecture Overview

FansLib is a **Turborepo monorepo** for managing adult content creator libraries and social media posting. The system has three main components:

1. **`@fanslib/server`** - Elysia backend API (Bun runtime, TypeORM + SQLite)
2. **`@fanslib/web`** - TanStack Start web client (React 19, TanStack Router/Query)
3. **Shared configs** - `@fanslib/eslint`, `@fanslib/typescript` (Prettier config is in root `.prettierrc.cjs`)

There is also a @fanslib/electron-legacy app for desktop library management, but it is deprecated in favor of the web client.

### Key Architectural Decisions

- **Monorepo workspace imports**: Apps import from `@fanslib/server` for type-safe API contracts
  - Web client imports schemas: `import type { MediaSchema } from '@fanslib/server/schemas'`
  - Server exports all schemas through `src/schemas.ts` barrel file
- **Database**: Single SQLite file managed by TypeORM with `sqljs` driver (no migrations, auto-sync schema)
- **API communication**: `@elysiajs/eden` treaty client with `devalue` for serialization (handles Dates, Maps, Sets)
- **Feature-based structure**: Each domain (library, posts, channels, tags, etc.) has its own directory with `entity.ts`, `routes.ts`, `operations/`, and `schemas/`

## Development Workflows

### Running the Stack

```bash
# Root commands (uses Turborepo)
bun install              # Install all dependencies
bun dev                  # Start all apps in parallel (server + web)
bun build                # Build all apps
bun test                 # Run all tests

# Individual apps
cd @fanslib/apps/server && bun dev     # Server only (port 6970)
cd @fanslib/apps/web && bun dev        # Web only (port 6969)
```

**Development URLs:**

- Web client: http://localhost:6969
- API server: http://localhost:6970

### Environment Variables

**Server** (`@fanslib/apps/server`):

- `APPDATA_PATH` - SQLite database location
- `LIBRARY_PATH` - Media library root directory
- `FFPROBE_PATH` - Optional ffprobe binary path

**Web** (`@fanslib/apps/web`):

- `VITE_API_URL` - Required full API URL (e.g., `http://localhost:6970`)

### Adding New Features

Features follow a consistent pattern in `@fanslib/apps/server/src/features/{feature-name}/`:

```
features/example-feature/
├── entity.ts           # TypeORM entities
├── routes.ts           # Elysia route definitions (export {featureName}Routes)
├── operations/         # Business logic organized by operation
│   └── operation-name/
│       ├── index.ts    # Main operation function
│       └── helpers.ts  # Optional helpers
└── schemas/            # Shared schemas (re-exported via src/schemas.ts)
```

**Steps to add a feature:**

1. Create feature directory under `src/features/`
2. Define TypeORM entities in `entity.ts`
3. Create Elysia routes in `routes.ts` with prefix `/api/{feature-name}`
4. Implement operations with input/output schemas using `t.Object()` from Elysia
5. Export schemas through `src/schemas.ts` for web client consumption
6. Register routes in `src/index.ts`: `.use({featureName}Routes)`
7. Add entities to `src/lib/db.ts` entities array

## Code Conventions

### Type Safety

- **Elysia schemas**: Use `t.Object()` for API contracts, not Zod
- **Schema exports**: Always export request/response schemas with descriptive names ending in `Schema`
- **Type inference**: Use `typeof SchemaName.static` for TypeScript types
- **Validation**: Elysia validates at runtime; rely on schema definitions

### Database Patterns

- **Entities**: TypeORM with decorators, always use `@Entity()` and class syntax
- **Query building**: Use `createQueryBuilder` for complex queries with joins/filters
- **Filtering**: See `buildFilterGroupQuery` in `library/filter-helpers.ts` for complex filter patterns
- **Pagination**: Use `paginatedResponseSchema` helper from `lib/pagination.ts`

### Web Client Patterns

- **API calls**: Use TanStack Query hooks in `src/lib/queries/{feature}.ts`
- **Eden client**: Import from `src/lib/api/eden.ts`, already configured with devalue
- **Routes**: TanStack Router file-based routing in `src/routes/`
- **State**: Jotai atoms for global state, TanStack Query for server state
- **Styling**: Tailwind CSS + DaisyUI components

### Naming Conventions

- **Routes**: `/api/{feature-name}` (kebab-case)
- **Workspace packages**: `@fanslib/{package-name}`
- **Query keys**: `['feature', 'operation', params]` (e.g., `['media', 'list', { page: 1 }]`)
- **Operations**: Verb-first (e.g., `fetchAllMedia`, `updatePost`, `deleteTag`)

## Common Tasks

### Add API Endpoint

```typescript
// In @fanslib/apps/server/src/features/example/routes.ts
export const exampleRoutes = new Elysia({ prefix: '/api/example' }).post(
  '/create',
  async ({ body }) => {
    // Implementation
    return result;
  },
  {
    body: CreateExampleRequestSchema,
    response: CreateExampleResponseSchema,
  }
);
```

### Query Data in Web Client

```typescript
// In @fanslib/apps/web/src/lib/queries/example.ts
export const useExampleQuery = (params: ExampleParams) =>
  useQuery({
    queryKey: ['example', params],
    queryFn: async () => {
      const result = await eden.api.example.get(params);
      return result.data;
    },
  });
```

### Access Media Files

- Media served via REST endpoints in `library/routes.ts`
- Use `eden.api.media['by-path']({ path }).get()` for file serving
- Thumbnails served separately, see `getThumbnailPath` in `library/operations/scan/`

### Media Filtering & Tagging

**Complex filtering**: Use `buildFilterGroupQuery` in `library/filter-helpers.ts` for building multi-criteria queries (channels, subreddits, tags, shoots, filename patterns). Filters support AND/OR logic and include/exclude operations.

**Tag system**: Dimensions (`TagDimension`) define tag types (categorical/numerical/boolean) with validation schemas. Tags (`TagDefinition`) belong to dimensions and can have parent-child hierarchies. Media tags (`MediaTag`) link media to tag values.

## Tech Stack Reference

- **Runtime**: Bun (not Node.js)
- **Server**: Elysia 1.4+ (Bun-first web framework)
- **Database**: TypeORM 0.3+ with sql.js (SQLite in-memory with file persistence)
- **Web**: React 19, TanStack Router 1.x, TanStack Query 5.x, TanStack Start
- **Styling**: Tailwind CSS 4.x, DaisyUI 5.x, React Aria Components
- **Automation**: Playwright for Reddit posting (see `reddit-automation` feature)

### ⚠️ Reddit Automation Warning

**CRITICAL**: Playwright-based Reddit automation exists in `features/reddit-automation/`. This involves browser automation and posting to live Reddit accounts.

**NEVER automatically run, execute, or trigger Reddit automation scripts without explicit user confirmation.** These operations:

- Post to real Reddit accounts
- Can result in account bans if misused
- Require careful review of content and timing

Always ask for explicit permission before running any automation that interacts with external platforms.

## Testing & Quality

```bash
bun lint        # ESLint (shared config from @fanslib/eslint)
bun typecheck   # TypeScript checking across workspace
bun format      # Prettier (config in root `.prettierrc.cjs`)
```

## Important Notes

- **No migrations**: Database schema auto-syncs from entities (development mode)
- **File paths**: All media references use relative paths from `LIBRARY_PATH`
- **Serialization**: API uses `devalue` not JSON - handles Date objects natively
- **Package manager**: Bun only (not npm/pnpm/yarn)
- **Monorepo tool**: Turborepo handles parallel execution and caching
