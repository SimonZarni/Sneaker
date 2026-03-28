# AI Coding Prompts — SNEAKER.DRP

Copy the relevant prompt, fill in the `[placeholders]`, paste to AI.

Stack: Laravel 12 · Inertia.js · React/TypeScript · MySQL · Railway · Capacitor (Android)

---

## When to use which prompt

| Situation | Prompt |
|---|---|
| Starting a new coding session | 1. Session Opener |
| Starting a new feature from scratch | 2. Architecture Plan |
| Building a backend feature | 3. Backend Feature |
| Building a React component or page | 4. React Component |
| Any feature with status/type fields | 5. Enums First |
| Critical paths (checkout, payments, stock) | 6. Test-First |
| Pulling logic out of fat controllers | 7. Extract to Service |
| Finding duplicated code | 8. DRY Audit |
| Cleaning up TypeScript `any` types | 9. Type Safety Audit |
| Adding scopes/methods to Eloquent models | 10. Model Enrichment |
| Before every git commit | 11. Pre-Commit Review |
| Touching live production code | 12. Safe Production Refactor |
| Monthly or after major features | 13. Consistency Audit |

---

## 1 — Session Opener

> Start every new chat with this before asking anything else.

```
I'm continuing work on SNEAKER.DRP (Laravel 12, Inertia.js, React/TypeScript, MySQL, Railway).

Active rules:
- Controllers ≤ 20 lines — all business logic in app/Services/
- PHP 8.1 backed enums for all status fields (app/Enums/)
- All validation in FormRequest classes (app/Http/Requests/), never inline $request->validate()
- Zero 'any' types in TypeScript — all domain interfaces in resources/js/types/models.ts
- Pest PHP feature tests for every controller action
- Events + Listeners for all side effects (email, notifications, stock updates)
- aria-label on all interactive elements

Today I am working on: [describe your task]

Before writing any code, confirm these constraints and list every file you will create or modify.
```

---

## 2 — Architecture Plan

> Use before building any new feature. Approve the plan before any code is written.

```
Before writing any code for [feature name], produce an architecture plan for SNEAKER.DRP.

Stack context: Laravel 12, Inertia.js, React/TypeScript, MySQL.

I want to see:
1. File structure — every file to create or modify with its responsibility in one sentence
2. Service class interface — public method names, typed parameters, return types (app/Services/)
3. Enums needed — PHP enum in app/Enums/ and matching TypeScript const in resources/js/types/enums.ts
4. Events + Listeners — what fires, what handles it (app/Events/, app/Listeners/)
5. FormRequest rules — the validation shape (app/Http/Requests/)
6. Inertia props — what the controller passes to the React page
7. Test case names — Pest test names only, not code, covering happy path, failures, edge cases

Do NOT write any implementation yet. Plan only.
I will review and approve before you write any code.
```

---

## 3 — Backend Feature

> Use when building any Laravel backend feature that involves business logic.

```
Implement [feature name] for SNEAKER.DRP.

Files to create:
- app/Services/[Name]Service.php — all business logic
- app/Http/Controllers/[Name]Controller.php — HTTP only, ≤ 20 lines, calls service
- app/Http/Requests/[Store/Update][Name]Request.php — all validation rules
- app/Events/[Name].php — if there are side effects
- app/Listeners/[Handle][Name].php — listener for the event
- tests/Feature/[Name]Test.php — Pest feature tests

Requirements:
- [list your specific business rules, e.g. "decrement stock inside a DB transaction"]
- [e.g. "use OrderStatus enum for all status values"]
- [e.g. "fire OrderPlaced event after the transaction commits, not inside it"]

Rules:
- Controller method ≤ 20 lines — zero business logic in the controller
- Service method takes plain typed PHP data, not the Request object
- DB transaction lives in the service using DB::transaction()
- lockForUpdate() for any write involving stock or inventory
- All status/type values use PHP 8.1 backed enums from app/Enums/ — no raw strings
- Cache::forget() any relevant cache keys after mutations (navigation, dashboard stats)
- Write in this order: enum → FormRequest → Service → Controller → Event → Listener → Test
```

---

## 4 — React Component

> Use when building any new Inertia page or complex React component.

```
Create the [ComponentName] React component for SNEAKER.DRP.

TypeScript rules:
- All props fully typed — zero 'any'. Define interfaces at the top of the file.
- Any interface used in more than one file goes in resources/js/types/models.ts
- usePage() must use the PageProps generic: usePage<PageProps<{propName: Type}>>()
- Enum values imported from resources/js/types/enums.ts — no raw strings in JSX

State rules:
- State only used by a sub-component lives inside that sub-component, not the parent
- Derived data (filtered arrays, computed totals) uses useMemo with explicit dependencies
- Related state and logic grouped into a custom hook named use[FeatureName].ts

Accessibility rules:
- All <button> elements have aria-label if they contain only an icon or ambiguous text
- Color swatches and size grids use role="group" + aria-labelledby + aria-pressed
- Focus order follows visual reading order

Styling rules:
- User-facing pages: Tailwind utility classes only — brand tokens from tailwind.config.js
- Admin pages: inline styles only (Tailwind purges dynamic classes in admin)
- No hardcoded hex colors in JSX — use CSS variables or Tailwind brand tokens

Component structure:
1. Interfaces at the top
2. Main exported component
3. Custom hooks below
4. Sub-components at the bottom

[Describe what the component does and what Inertia props it receives from the controller]
```

---

## 5 — Enums First

> Use before any feature that introduces status fields or fixed string values. Run before the feature prompt.

```
Before implementing [feature], define the enums first.

PHP enum (app/Enums/[Name].php):
- PHP 8.1 backed string enum
- One case per domain value — no raw strings in the codebase
- Add helper methods if needed: isTerminal(): bool, label(): string, color(): string

TypeScript counterpart (resources/js/types/enums.ts):
export const [NAME] = {
  [Key]: '[value]',
} as const;
export type [Name] = typeof [NAME][keyof typeof [NAME]];

After creating both files:
1. Search all affected controllers, services, models, migrations, and React files
2. Replace every raw string with the enum reference
3. List every file that was updated

Show the PHP enum and TypeScript const first, before any other code.
```

---

## 6 — Test-First

> Use for critical paths: checkout, payments, stock, order cancellation. Write and review tests before implementation.

```
Write the Pest PHP feature tests for [ControllerName] BEFORE writing the implementation.

For each controller action, cover:
1. Happy path — expected outcome with assertDatabaseHas assertions on actual DB state
2. Auth guard — unauthenticated request redirects to login
3. Validation failures — invalid input returns withErrors() with the correct field keys
4. Business rule violations — e.g. out of stock, order already cancelled, inactive product
5. Side effects — Event::fake() assertions, Queue::fake() assertions, cache invalidated

Test rules:
- Pest syntax: it() or test()
- Laravel factories for all test data — no hardcoded IDs
- Each test fully independent — no shared mutable state
- actingAs($user) for auth context
- Event::fake() before the action when testing events
- assertDatabaseHas / assertDatabaseMissing for state assertions

Write tests only. I will review before you write any implementation.
```

---

## 7 — Extract to Service

> Use when pulling business logic out of fat Laravel controllers.

```
Refactor [Controller::method()] by extracting business logic into a Service class.

Rules:
- Controller method must be ≤ 20 lines after the refactor
- Zero business logic in the controller — it only: resolves the FormRequest, calls the service, returns the Inertia/redirect response
- Service method takes plain typed PHP data, not the Request object
- DB::transaction() moves into the service
- ALL existing behavior preserved exactly — pure structural refactor, do NOT change any logic

Deliver in this order:
1. app/Services/[Name]Service.php — the extracted logic
2. The refactored controller — showing only what changed
3. One sentence describing what a unit test for the service method would assert

Do NOT change any logic. Only move it.
```

---

## 8 — DRY Audit

> Use when reviewing a Laravel controller, service, or React component for duplication.

```
Audit [file or directory] for code duplication.

Step 1 — Inventory:
List every instance of duplicated logic — exact copies, near-copies, same pattern in different places.
For each: file, line range, one-sentence description of what is duplicated.

Step 2 — Extraction plan:
For each duplicate, name the correct extraction point: private method, Service method, Eloquent scope, shared hook, base controller, trait, etc.

Step 3 — Implement:
Fix one extraction at a time, highest-risk first. Confirm behavior unchanged after each.

SNEAKER.DRP specific patterns to check:
- Repeated cart ownership queries: whereHas('cart', fn($q) => $q->where('user_id', Auth::id()))
- Repeated stock-clamping logic across CartController methods
- Near-identical validation arrays in store() vs update() actions
- Repeated Auth::guard('admin')->user()->full_name in admin controllers
- Repeated Inertia prop shapes across admin index pages
- Repeated effectivePrice() logic between PHP and TypeScript
- Repeated cart item mapping in CartDrawer and Checkout
```

---

## 9 — Type Safety Audit

> Use to eliminate `any` types from the React/TypeScript frontend.

```
Perform a TypeScript type safety audit on [file or directory] in SNEAKER.DRP.

Step 1 — Inventory:
List every:
- Explicit 'any' type
- Implicit any (untyped parameters, untyped catch blocks)
- Unsafe 'as Type' cast hiding a real type gap
- usePage().props accessed without the PageProps generic
Show file name and line number for each.

Step 2 — Define shared types:
For any interface used in more than one file, define it in resources/js/types/models.ts.
Show the interface definition.

Step 3 — Fix in this priority order:
1. Props interfaces on Inertia page components
2. useState<T> generics
3. Event handler parameter types
4. usePage().props accesses — use usePage<PageProps<{prop: Type}>>()

Rules:
- Never replace 'any' with 'unknown' to hide the problem — fix the root type
- Derive types from what the Laravel controller actually passes via Inertia::render()
- Cart, Order, Product, Variant interfaces belong in resources/js/types/models.ts
- usePage() must never be cast to any
```

---

## 10 — Model Enrichment

> Use when Eloquent models are plain containers with no domain behavior.

```
Enrich the [ModelName] Eloquent model with domain methods and query scopes.

Domain methods (behavior the model knows about itself):
- Boolean questions: isOnSale(): bool, isCancellable(): bool, isReturnable(): bool
- Computed values: effectivePrice(): string, total(): float, subtotal(): float
- These replace repeated raw conditionals in controllers and services

Query scopes (reusable Eloquent conditions):
- scopeActive($query) — where('is_active', true)
- scopeNotCancelled($query) — whereNotIn('order_status', [...cancelled states])
- scopeConfirmed($query) — confirmed orders only
- scopeForUser($query, int $userId) — scoped to a specific user

After adding:
1. Search all controllers, services, and other models for raw where() calls that can be replaced
2. Update those call sites

Rules:
- Use app/Enums/ values in all model methods — no raw strings
- Scopes read like plain English: Order::notCancelled()->forUser($id)->latest()
- No DB queries or external calls inside domain methods — keep them pure
```

---

## 11 — Pre-Commit Review

> Run on every new or significantly changed file before committing.

```
Review this SNEAKER.DRP code before I commit it.

BACKEND:
☐ Business logic inside the controller (should be in app/Services/)?
☐ Inline $request->validate() (should be a FormRequest in app/Http/Requests/)?
☐ Raw status strings like 'Confirmed', 'Pending', 'COD' (should be app/Enums/ references)?
☐ Duplicated logic that already exists elsewhere?
☐ Multi-table write missing DB::transaction()?
☐ Stock/inventory write missing lockForUpdate()?
☐ N+1 risk — relationship accessed without eager loading?
☐ Mutation endpoint missing throttle middleware?
☐ Hard delete on Order, Payment, or OrderItem (should use SoftDeletes)?
☐ Cache not invalidated after mutating brands, categories, genders, or dashboard data?

FRONTEND:
☐ Any 'any' types?
☐ Hardcoded hex colors that should be Tailwind brand tokens or CSS variables?
☐ Admin page using Tailwind classes instead of inline styles?
☐ Interactive element missing aria-label?
☐ Color swatch or size grid missing role="group" + aria-labelledby?
☐ State in a parent that belongs inside a sub-component?
☐ Derived data missing useMemo?
☐ New interface that should be in resources/js/types/models.ts?

For every violation:
- Show the exact line
- Explain why it is a problem
- Show the corrected version

[paste your code here]
```

---

## 12 — Safe Production Refactor

> Use when touching checkout, payments, stock, or any live critical path.

```
Refactor [feature] in SNEAKER.DRP — this is production-critical code.

Rules:
1. No breaking changes — every existing route URL, Inertia prop shape, and redirect behavior must remain identical
2. Tests before touching implementation — write Pest tests verifying current behavior first; all must pass before any changes
3. One concern per message — change exactly ONE thing per message (e.g. only extract the Service, then stop); do not fix other issues you notice in the same pass
4. Show the exact diff — for every change show precisely what was removed and what was added; no undisclosed changes

Start by writing the Pest tests for current behavior. Do not touch the implementation yet.
```

---

## 13 — Consistency Audit

> Run monthly or after adding a major feature.

```
Perform a consistency audit across [app/Http/Controllers/ or resources/js/Pages/] in SNEAKER.DRP.

Find every place where the same concern is handled differently across files:

1. Validation — some controllers use FormRequest, some use inline validate(). List all inline usages with file + line.
2. Authorization — some methods use whereHas for cart/order ownership, some use Auth::id() checks, some check nothing. List all patterns.
3. Admin auth — is Auth::guard('admin') used consistently? Any places using the wrong guard?
4. Response format — back()->with() vs redirect()->route() vs Inertia::render() used inconsistently? List deviations.
5. Error handling — withErrors() vs ValidationException vs JSON responses. List all patterns.
6. Cache invalidation — are related cache keys always cleared after mutations? List any mutations that forget.
7. Naming — method names, variable names, Inertia prop names that differ without reason.

Output a table:
File | Line | Pattern Found | Expected Pattern | Priority (High / Med / Low)

Then list the top 3 to fix first, in order of risk.
```

---

## Quick Reference

```
NEW SESSION      →  1.  Session Opener
BEFORE FEATURE   →  2.  Architecture Plan
BACKEND          →  3.  Backend Feature
REACT PAGE       →  4.  React Component
STATUS FIELDS    →  5.  Enums First         ← run BEFORE the feature prompt
CRITICAL PATH    →  6.  Test-First          ← run BEFORE the feature prompt
FAT CONTROLLER   →  7.  Extract to Service
DUPLICATION      →  8.  DRY Audit
TYPE ISSUES      →  9.  Type Safety Audit
ENRICH MODELS    →  10. Model Enrichment
PRE-COMMIT       →  11. Pre-Commit Review
PROD REFACTOR    →  12. Safe Production Refactor
MONTHLY CHECK    →  13. Consistency Audit
```

---

## SNEAKER.DRP Key Constants

```
Local dev path:      /home/claude/sneaker_v3/Sneaker/
Production zip:      /home/claude/sneaker_prod/Sneaker/
Android build:       npm run build && npx cap sync android && cd android && gradlew assembleDebug && cd ..

Styling rule:        Admin pages → inline styles only | User pages → Tailwind normally
Brand tokens:        brand-charcoal (#0A0A0A), brand-white, brand-surface (#F5F5F7), brand-slate (#2D323E)
Font:                Plus Jakarta Sans
Admin auth:          Auth::guard('admin') | Middleware: EnsureAdmin | Timeout: 3 hours
Broadcasting:        Admin guard uses /broadcasting/auth/admin
```
