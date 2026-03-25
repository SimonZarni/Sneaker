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

# Capacitor (native Android app)
npm run build && npx cap sync android   # Build web assets + sync to native
npx cap open android                    # Open Android Studio
npx cap run android                     # Build and run on device/emulator
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

**Google OAuth (web + native):**
- `GET /auth/google` — initiates OAuth; detects `source=capacitor` to flag native flow
- `GET /auth/google/callback` — handles browser callback; native flow generates a one-time token and sends it via deep link `com.sneaker.drp://auth/callback?token=...`
- `POST /auth/google/native` — accepts a Google ID token directly from the native app (no browser redirect)
- `GET /auth/app-verify` — validates the one-time deep-link token and establishes a session in the WebView

### Shared Props (Available on Every Page)
`HandleInertiaRequests` middleware shares these props globally via `app.tsx`:
- `auth.user` — authenticated customer or null
- `cart` — current cart with items
- `activeOrders` — user's in-progress orders

### PWA (Progressive Web App)
- Configured for native-like install experience on mobile and desktop
- `usePwa.ts` (`resources/js/hooks/`) handles the `beforeinstallprompt` event and exposes install trigger
- Service worker and manifest registered for offline support and home screen install
- Web Push notifications via VAPID (`PushNotificationService.php`) tie into the PWA flow

### Native Android App (Capacitor)
The web app is wrapped in a native Android app via **Capacitor 6** (`capacitor.config.ts`):
- **App ID:** `com.sneaker.drp` | **App Name:** `SNEAKER.DRP`
- **Web dir:** `public/build` served from `https://zarnidev.online` (live server URL)
- Native platform is detected at runtime via `Capacitor.isNativePlatform()` in `app.tsx`

**Native-only behaviors (app.tsx):**
- **Status bar** — Dark style, black background
- **Android back button** — navigates back or exits app
- **Deep link handler** — listens for `appUrlOpen` events on `com.sneaker.drp://auth/callback?token=...` and navigates the WebView to `/auth/app-verify`
- **FCM registration** — requests push permission, stores token to `/push/fcm-token`, caches token in `localStorage._fcm_pending_token` if not yet authenticated
- **Foreground push handler** — dispatches `capacitor-notification` custom event consumed by `NotificationContext`
- **Background push tap** — navigates to relevant page based on notification data

**Capacitor plugins:**
| Plugin | Purpose |
|--------|---------|
| `@capacitor/app` | App lifecycle + back button + deep links |
| `@capacitor/browser` | Chrome Custom Tabs for OAuth |
| `@capacitor/push-notifications` | FCM token registration + notification handling |
| `@capacitor/status-bar` | Status bar color/style |
| `@codetrix-studio/capacitor-google-auth` | Native Google Sign-In account picker |

**FCM Push Notifications (native only):**
- `FcmService.php` (`app/Services/`) — sends notifications via Firebase Admin SDK (`kreait/laravel-firebase`)
- Firebase credentials loaded from `storage/app/firebase-credentials.json`
- `User.fcm_token` column stores the device token; updated via `POST /push/fcm-token`
- `OrderStatusChanged` event calls `FcmService::sendToToken()` if user has a registered FCM token
- `resources/js/utils/googleAuth.ts` — `googleNativeLogin()` triggers native account picker, POSTs ID token to `/auth/google/native`

### Real-time (Pusher + Laravel Echo)
- Configured in `resources/js/bootstrap.ts`
- Events: `ChatMessageSent`, `OrderStatusChanged`
- Private channels per user for notifications; admin channel for support
- `NotificationContext` (`resources/js/Contexts/`) manages toast state and persists notification history in localStorage (60-minute TTL)

### Key Directory Map
| Path | Purpose |
|------|---------|
| `app/Http/Controllers/Admin/` | Admin panel controllers (9 files) |
| `app/Http/Controllers/Auth/` | Auth controllers (registration, login, password reset, Google OAuth) |
| `app/Http/Controllers/Auth/GoogleAuthController.php` | Google OAuth — web + native + deep-link token verification |
| `app/Http/Controllers/PushController.php` | FCM token storage, Web Push subscribe/unsubscribe |
| `app/Http/Middleware/` | EnsureAdmin, EnsureUserIsActive, HandleInertiaRequests, SecurityHeaders |
| `app/Models/` | 21 Eloquent models (User, Admin, Product, ProductVariant, Order, Cart, etc.) |
| `app/Services/PushNotificationService.php` | Web Push (VAPID) notification logic |
| `app/Services/FcmService.php` | FCM native push notifications via Firebase Admin SDK |
| `app/Events/` | ChatMessageSent, OrderStatusChanged broadcast events |
| `resources/js/Pages/` | React page components organized by feature |
| `resources/js/Components/` | Reusable UI components (CartDrawer, ChatWidget, Modal, etc.) |
| `resources/js/Contexts/` | NotificationContext (global notification + toast state) |
| `resources/js/hooks/usePwa.ts` | PWA install prompt logic |
| `resources/js/utils/googleAuth.ts` | Native Google Sign-In via `@codetrix-studio/capacitor-google-auth` |
| `resources/js/types/` | TypeScript type definitions |
| `capacitor.config.ts` | Capacitor native app configuration |
| `android/` | Android native project (Capacitor-generated) |
| `routes/web.php` | All routes (public, authenticated, admin, auth) |

### Database: Key Models & Relationships
- `Product` → has many `ProductVariant` (each variant = color + size + stock + price + image)
- `Cart` → belongs to `User`, has many `CartItem` → `ProductVariant`
- `Order` → belongs to `User`, has many `OrderItem`, has one `Payment`
- `ChatConversation` → belongs to `User` + `Admin`, has many `ChatMessage`
- `PushSubscription` → belongs to `User` (Web Push VAPID endpoint storage)
- `User.google_id` — linked Google account ID for OAuth
- `User.fcm_token` — FCM device token for native push notifications

### Frontend Conventions
- Path alias `@/*` → `resources/js/*`
- Pages use `AuthenticatedLayout`, `GuestLayout`, or `AdminLayout` as wrappers
- Inertia's `useForm` hook is used for form submissions (handles CSRF, redirects, validation errors automatically)
- TypeScript strict mode enabled

### Environments
- **Production URL:** https://zarnidev.online
- **Admin panel:** https://zarnidev.online/admin

### Test Accounts (after seeding)
- Customer: `test@example.com` / `password`
- Admin: `admin@sneaker.drp` / `admin123`
