# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start all services (Laravel + queue + Vite) in parallel
composer run dev

# Run tests
composer run test

# Full initial setup (install deps, .env, key, migrate, npm install, build)
composer run setup

# Database
php artisan migrate
php artisan db:seed
php artisan migrate:fresh --seed   # Reset + reseed (dev only)

# Frontend only
npm run dev    # Vite dev server
npm run build  # tsc + Vite production build

# Generate VAPID keys for Web Push
php artisan vapid:generate
```

## Architecture

This is a **Laravel 12 + React 18 + Inertia.js** e-commerce app (sneaker store). Inertia bridges Laravel and React — there is no REST API; Laravel controllers return Inertia responses that render React pages directly.

### Request Flow
1. Browser → Laravel route (`routes/web.php`) → Controller → `Inertia::render('Page/Name', $props)`
2. Inertia resolves the React page from `resources/js/Pages/**/*.tsx` and passes props as React props
3. No `fetch`/`axios` API calls for page data — all data comes via Inertia props from the controller

### Auth: Dual Guard System
Two separate guard systems co-exist:
- **`web` guard** — customers (`users` table), session-based, 30-day remember me
- **`admin` guard** — admins (`admins` table), session-based, 3-hour timeout
- `EnsureAdmin` middleware protects `/admin/*` routes; redirects to `/admin/login` if not authenticated
- `EnsureUserIsActive` blocks deactivated customer accounts

### Shared Props (Available on Every Page)
`HandleInertiaRequests` middleware shares these props globally via `app.tsx`:
- `auth.user` — authenticated customer or null
- `cart` — current cart with items
- `activeOrders` — user's in-progress orders

### Real-time (Pusher + Laravel Echo)
- Configured in `resources/js/bootstrap.ts`
- Events: `ChatMessageSent`, `OrderStatusChanged`
- Private channels per user for notifications; admin channel for support
- `NotificationContext` (`resources/js/Contexts/`) manages toast state and persists notification history in localStorage (60-minute TTL)

### Key Directory Map
| Path | Purpose |
|------|---------|
| `app/Http/Controllers/Admin/` | Admin panel controllers (9 files) |
| `app/Http/Controllers/Auth/` | Auth controllers (registration, login, password reset) |
| `app/Http/Middleware/` | EnsureAdmin, EnsureUserIsActive, HandleInertiaRequests, SecurityHeaders |
| `app/Models/` | 21 Eloquent models (User, Admin, Product, ProductVariant, Order, Cart, etc.) |
| `app/Services/PushNotificationService.php` | Web Push (VAPID) notification logic |
| `app/Events/` | ChatMessageSent, OrderStatusChanged broadcast events |
| `resources/js/Pages/` | React page components organized by feature |
| `resources/js/Components/` | Reusable UI components (CartDrawer, ChatWidget, Modal, etc.) |
| `resources/js/Contexts/` | NotificationContext (global notification + toast state) |
| `resources/js/hooks/usePwa.ts` | PWA install prompt logic |
| `resources/js/types/` | TypeScript type definitions |
| `routes/web.php` | All routes (public, authenticated, admin, auth) |

### Database: Key Models & Relationships
- `Product` → has many `ProductVariant` (each variant = color + size + stock + price + image)
- `Cart` → belongs to `User`, has many `CartItem` → `ProductVariant`
- `Order` → belongs to `User`, has many `OrderItem`, has one `Payment`
- `ChatConversation` → belongs to `User` + `Admin`, has many `ChatMessage`
- `PushSubscription` → belongs to `User` (Web Push endpoint storage)

### Frontend Conventions
- Path alias `@/*` → `resources/js/*`
- Pages use `AuthenticatedLayout`, `GuestLayout`, or `AdminLayout` as wrappers
- Inertia's `useForm` hook is used for form submissions (handles CSRF, redirects, validation errors automatically)
- TypeScript strict mode enabled

### Test Accounts (after seeding)
- Customer: `test@example.com` / `password`
- Admin: `admin@sneaker.drp` / `admin123`
