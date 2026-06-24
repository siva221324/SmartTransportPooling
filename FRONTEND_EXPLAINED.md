# SmartTransport Frontend — Every File Explained

> **For people new to Angular:** Angular is a JavaScript framework for building web apps. Instead of one big HTML/JS file, Angular splits the UI into small reusable pieces called **components**. Each component is a TypeScript (`.ts`) file that controls a piece of the screen. Think of a component like a LEGO brick — many bricks combine to form the final page. This project uses Angular v21 (latest "standalone" style — no old `NgModule` needed).

---

## Table of Contents

1. [Root Config Files](#1-root-config-files)
2. [`src/` — Entry Point Files](#2-src--entry-point-files)
3. [`src/app/` — The Application Core](#3-srcapp--the-application-core)
   - [app.ts — Root Component](#apptsapp-root-component)
   - [app.routes.ts — URL Routing Table](#approutests--url-routing-table)
   - [app.config.ts — App Bootstrap Config](#appconfigts--app-bootstrap-config)
   - [environment.ts — Backend URL Config](#environmentts--backend-url-config)
4. [`guards/` — Access Control](#4-guards--access-control)
5. [`interceptors/` — HTTP Middleware](#5-interceptors--http-middleware)
6. [`layout/` — Main Shell (Navbar + Sidebar)](#6-layout--main-shell-navbar--sidebar)
7. [`components/` — Shared UI Pieces](#7-components--shared-ui-pieces)
8. [`models/` — Data Shape Definitions](#8-models--data-shape-definitions)
9. [`services/` — Backend Communication](#9-services--backend-communication)
10. [`pages/` — Every Page Explained](#10-pages--every-page-explained)
    - [Public Pages (no login needed)](#public-pages-no-login-needed)
    - [User Pages (login required)](#user-pages-login-required)
    - [Admin Pages](#admin-pages)

---

## 1. Root Config Files

These files sit in `SmartTransport_Frontend/` and configure the overall project — you rarely touch them day-to-day.

| File | What it does |
|------|-------------|
| `package.json` | Lists all **npm packages** the project depends on (Angular, Bootstrap, Leaflet maps, etc.) and scripts like `npm start`. |
| `angular.json` | Tells the Angular build tool where source files are, what styles to include, and how to bundle everything. |
| `tsconfig.json` | TypeScript compiler settings — controls how strict the type-checking is. |
| `tsconfig.app.json` | Extension of `tsconfig.json` specifically for the **app build** (excludes test files). |
| `tsconfig.spec.json` | Extension of `tsconfig.json` specifically for **unit tests**. |

---

## 2. `src/` — Entry Point Files

| File | What it does |
|------|-------------|
| `src/index.html` | The single HTML page of the entire app. Angular injects everything into the `<app-root>` tag here. You'll barely edit this. |
| `src/main.ts` | The very first TypeScript file that runs. It starts the Angular app using the config from `app.config.ts`. |
| `src/styles.css` | **Global CSS** that applies to the entire app (fonts, resets, shared utility classes). |

---

## 3. `src/app/` — The Application Core

This is where all the actual code lives.

### `app.ts` — Root Component

```
app.ts  ──► shows <router-outlet> (the current page)
        ──► shows <app-toasts>    (pop-up toast messages)
```

This is the **outermost wrapper** of the entire app. It contains just two things:
- A `<router-outlet>` — a placeholder that swaps in whichever page component matches the current URL.
- `<app-toasts>` — floating notification pop-ups shown on top of everything.

---

### `app.routes.ts` — URL Routing Table

This file is the **map of your entire website**. It tells Angular: *"when the user visits URL `/login`, show the Login component"*.

Key concepts:
- `loadComponent: () => import(...)` — **Lazy loading**: the page's code is only downloaded when the user actually navigates to it (faster initial load).
- `canActivate: [authGuard]` — Routes inside this group require the user to be **logged in**.
- `canActivate: [roleGuard(['ADMIN'])]` — Admin routes require the user to have the `ADMIN` role.

**URL → Page mapping:**

| URL | Page shown | Who can access |
|-----|-----------|----------------|
| `/` | Landing page | Everyone |
| `/login` | Login page | Everyone |
| `/register` | Register page | Everyone |
| `/forgot-password` | Forgot password | Everyone |
| `/reset-password` | Reset password | Everyone |
| `/verify-email` | Email verification | Everyone |
| `/dashboard` | User dashboard | Logged-in users |
| `/profile` | Profile settings | Logged-in users |
| `/search-trips` | Search for rides | Logged-in users |
| `/trip/:id` | Trip details | Logged-in users |
| `/my-bookings` | My booking history | Logged-in users |
| `/notifications` | Notifications inbox | Logged-in users |
| `/create-trip` | Create a new trip | Logged-in users |
| `/my-trips` | Manage my trips | Logged-in users |
| `/my-vehicles` | Manage my vehicles | Logged-in users |
| `/trip-bookings/:tripId` | Booking requests for a trip | Logged-in users |
| `/admin/dashboard` | Admin overview | ADMIN only |
| `/admin/organizations` | Manage organizations | ADMIN only |
| `/admin/vehicles` | Approve vehicles | ADMIN only |
| `/**` (anything else) | Redirects to `/` | Everyone |

---

### `app.config.ts` — App Bootstrap Config

Sets up three core **providers** (think of providers as services Angular makes available globally):

1. **`provideBrowserGlobalErrorListeners()`** — Catches unhandled JavaScript errors in the browser.
2. **`provideRouter(routes)`** — Enables the URL router using our routes defined in `app.routes.ts`.
3. **`provideHttpClient(withInterceptors([authInterceptor]))`** — Enables making HTTP requests to the backend, and plugs in our authentication interceptor (auto-adds the login token to every request).

---

### `environment.ts` — Backend URL Config

```typescript
export const environment = {
  apiUrl: 'http://localhost:8081/api',
};
```

A simple object holding the **backend base URL**. Every service imports this so you only need to change the URL in one place when deploying to production.

---

## 4. `guards/` — Access Control

**File:** `guards/auth.guard.ts`

Guards are like **bouncers at a door** — they run before a page loads and decide whether to allow access.

### `authGuard`
- Checks if the user is logged in (`auth.isLoggedIn()`).
- If **yes** → allow navigation to the page.
- If **no** → redirect to `/login`.

### `roleGuard`
- A factory function that takes a list of allowed roles (e.g., `['ADMIN']`).
- Checks if the logged-in user's role is in that list.
- If **yes** → allow.
- If **no** → redirect to `/dashboard` (not unauthorized, just wrong role).

---

## 5. `interceptors/` — HTTP Middleware

**File:** `interceptors/auth.interceptor.ts`

An interceptor is code that **runs automatically on every HTTP request** before it leaves the browser — like a post office that stamps every letter.

This interceptor:
1. Looks up the JWT token stored in `localStorage` (saved there at login).
2. If a token exists, it **clones the request** and adds the header: `Authorization: Bearer <token>`.
3. Passes the modified request on to the backend.

This means every API call is automatically authenticated — no need to manually add the token in each service.

---

## 6. `layout/` — Main Shell (Navbar + Sidebar)

**File:** `layout/layout.ts`

This component is the **persistent shell** shown on all protected pages (after login). It renders:

- **Top Navbar** — Brand logo, current user email, notifications bell (with unread badge), settings link, and logout button.
- **Sidebar** — Navigation links (Dashboard, Search Rides, My Bookings, Create Trip, My Trips, My Vehicles). Admin users see a different sidebar (Dashboard, Organizations, Vehicles).
- **Hamburger menu** — On mobile, a button toggles the sidebar open/closed.
- **`<router-outlet>`** — The actual page content renders here (inside the shell).

The layout uses **Angular Signals** (`signal()`, `computed()`) — Angular's modern reactive state system (like React useState, but faster).

```
┌──────────────────────────────────────┐
│  TOP NAVBAR (logo, user, bell, gear) │
├─────────┬────────────────────────────┤
│         │                            │
│ SIDEBAR │   <router-outlet>          │
│  links  │   (current page renders)   │
│         │                            │
└─────────┴────────────────────────────┘
```

---

## 7. `components/` — Shared UI Pieces

**File:** `components/toasts.component.ts`

A small component that shows **floating toast notifications** (pop-up messages like "Trip created successfully!" or "Booking failed!").

- Sits fixed at the top-right corner of the screen (`z-index: 9999` so it floats above everything).
- Reads the list of toasts from `ToastService`.
- Colors change based on type: green (success), red (error), yellow (warning), blue (info).
- Each toast has an ✕ button to dismiss it manually; they also auto-dismiss after a few seconds.

---

## 8. `models/` — Data Shape Definitions

Models are **TypeScript interfaces** — they describe the shape/structure of data objects. They have no logic, just type definitions. They make your code safer by catching typos and wrong data shapes at compile time.

### `user.model.ts`
| Interface | What it represents |
|-----------|-------------------|
| `User` | A full user profile (id, name, email, phone, gender, role, org domain, department, city, profile pic) |
| `RegisterRequest` | The fields you send when registering a new account |
| `LoginRequest` | Email + password sent at login |
| `AuthResponse` | What the backend returns after login: JWT token, email, and role |

---

### `trip.model.ts`
| Interface | What it represents |
|-----------|-------------------|
| `Trip` | A full trip object (driver info, vehicle, origin, destination, coordinates, departure time, seats, price, recurring days, status, stops list) |
| `TripStop` | A single intermediate stop on a trip route (name, coordinates, order) |
| `TripRequest` | The data sent when creating a new trip |
| `TripSearchRequest` | Filters used when searching trips (origin, destination, date range, price range, gender preference) |

---

### `booking.model.ts`
| Interface | What it represents |
|-----------|-------------------|
| `Booking` | A booking record (trip summary, passenger info, status: PENDING/APPROVED/REJECTED/CANCELLED, seats booked, type: SINGLE or RECURRING, fare, booking date) |

---

### `vehicle.model.ts`
| Interface | What it represents |
|-----------|-------------------|
| `Vehicle` | A registered vehicle (owner, license plate, model, color, total seats, document URL, approval status) |
| `VehicleRequest` | Fields sent when registering a vehicle |

---

### `notification.model.ts`
| Interface | What it represents |
|-----------|-------------------|
| `AppNotification` | An in-app notification (type, title, message, reference ID, read status, timestamp) |

---

### `other.model.ts`
| Interface | What it represents |
|-----------|-------------------|
| `Rating` | A user rating after a trip (who rated, who was rated, score, comment) |
| `RatingRequest` | Data sent when submitting a rating |
| `Organization` | A whitelisted company/org (name, email domain, whitelist status, created date) |
| `OrganizationRequest` | Data sent when creating/updating an organization |

---

## 9. `services/` — Backend Communication

Services are **singleton classes** that handle talking to the backend API. They use Angular's `HttpClient` to make HTTP requests. Because they are `providedIn: 'root'`, there is one shared instance throughout the whole app — any component can inject and use them.

---

### `auth.service.ts` — Authentication

Manages everything related to the user's login session.

**State stored (persisted in `localStorage` so it survives page refresh):**
- `tokenSignal` — the JWT token
- `roleSignal` — the user's role (ADMIN / USER)
- `emailSignal` — the logged-in user's email

**Key methods:**

| Method | What it does |
|--------|-------------|
| `register(req)` | POST to `/auth/register` — creates new account |
| `login(req)` | POST to `/auth/login` — saves token/role/email to localStorage on success |
| `logout()` | Clears localStorage, redirects to `/login` |
| `forgotPassword(email)` | POST to `/auth/forgot-password` — sends reset email |
| `resetPassword(token, newPassword)` | POST to `/auth/reset-password` |
| `verifyEmail(token)` | GET to `/auth/verify-email` |
| `getProfile()` | GET current user's full profile |
| `updateProfile(req)` | PUT updated profile data |
| `uploadProfilePic(file)` | POST profile picture file |
| `isLoggedIn` | Computed boolean — true if token exists |
| `currentRole` | The user's role string |
| `currentEmail` | The user's email string |

---

### `trip.service.ts` — Trip Management

Handles all trip-related API calls.

| Method | HTTP call | What it does |
|--------|-----------|-------------|
| `createTrip(req)` | POST `/trips` | Creates one or more trips |
| `searchTrips(req)` | GET `/trips/search` | Searches trips with filters |
| `getTrip(id)` | GET `/trips/:id` | Gets a single trip by ID |
| `getMyTrips()` | GET `/trips/my` | Gets all trips created by current user |
| `updateTrip(id, req)` | PUT `/trips/:id` | Updates trip details |
| `cancelTrip(id)` | DELETE `/trips/:id` | Cancels a trip |
| `startTrip(id)` | PUT `/trips/:id/start` | Marks trip as ACTIVE |
| `completeTrip(id)` | PUT `/trips/:id/complete` | Marks trip as COMPLETED |
| `getOrigins()` | GET `/trips/locations/origins` | Returns list of known origin cities |
| `getDestinations()` | GET `/trips/locations/destinations` | Returns list of known destination cities |
| `getSiblingTrips(id)` | GET `/trips/:id/siblings` | Gets other trips in the same recurring group |

---

### `booking.service.ts` — Booking Management

Handles seat booking operations.

| Method | HTTP call | What it does |
|--------|-----------|-------------|
| `requestBooking(tripId, seats, type, days)` | POST `/bookings/:tripId` | Books seats on a trip |
| `approveBooking(id)` | PUT `/bookings/:id/approve` | Driver approves a booking request |
| `rejectBooking(id)` | PUT `/bookings/:id/reject` | Driver rejects a booking request |
| `getMyBookings()` | GET `/bookings/my` | Gets all bookings made by current user |
| `getTripBookings(tripId)` | GET `/bookings/trip/:tripId` | Gets all booking requests for a specific trip |
| `cancelBooking(id)` | PUT `/bookings/:id/cancel` | Passenger cancels their booking |

---

### `vehicle.service.ts` — Vehicle Management

| Method | HTTP call | What it does |
|--------|-----------|-------------|
| `registerVehicle(req)` | POST `/vehicles` | Registers a new vehicle (pending admin approval) |
| `getMyVehicles()` | GET `/vehicles/my` | Gets all vehicles owned by current user |

---

### `notification.service.ts` — Notifications

| Method | HTTP call | What it does |
|--------|-----------|-------------|
| `getNotifications()` | GET `/notifications` | Fetches all notifications for current user |
| `getUnreadCount()` | GET `/notifications/unread-count` | Returns `{ count: number }` for the badge |
| `markAsRead(id)` | PUT `/notifications/:id/read` | Marks a single notification as read |
| `markAllRead()` | PUT `/notifications/read-all` | Marks all notifications as read |

---

### `toast.service.ts` — Pop-up Messages

A **purely frontend** service (no HTTP calls). Manages the list of toast notifications shown in `ToastsComponent`.

**Uses Angular Signals internally** (`signal<Toast[]>([])`) — the component automatically re-renders when the list changes.

| Method | What it does |
|--------|-------------|
| `show(message, type, duration)` | Adds a toast; auto-dismisses after `duration` ms |
| `success(message)` | Shows green success toast (4s) |
| `error(message)` | Shows red error toast (6s) |
| `warning(message)` | Shows yellow warning toast (5s) |
| `info(message)` | Shows blue info toast (4s) |
| `dismiss(id)` | Removes a specific toast from the list |

---

### `admin.service.ts` — Admin Operations

Only used by admin pages. Manages organizations and vehicle approvals.

| Method | HTTP call | What it does |
|--------|-----------|-------------|
| `createOrganization(req)` | POST `/admin/organizations` | Adds a new org |
| `getAllOrganizations()` | GET `/admin/organizations` | Lists all orgs |
| `updateOrganization(id, req)` | PUT `/admin/organizations/:id` | Updates org details |
| `deleteOrganization(id)` | DELETE `/admin/organizations/:id` | Deletes an org |
| `getPendingVehicles()` | GET `/admin/vehicles/pending` | Lists unapproved vehicles |
| `approveVehicle(id)` | PUT `/admin/vehicles/:id/approve` | Approves a vehicle |
| `getStats()` | GET `/admin/stats` | Returns platform-wide counters |

---

## 10. `pages/` — Every Page Explained

Each page is a standalone Angular component. Each `.ts` file contains both the **logic** (TypeScript class) and the **HTML template** (inline inside the `template: ` property).

---

### Public Pages (no login needed)

#### `pages/landing/landing.ts` — Home Page (`/`)

The marketing landing page shown to visitors who are not logged in.

**Contains:**
- Floating navbar with Sign In / Get Started buttons
- Hero section with animated background orbs, headline, and stats pills (City-Smart, Org-Verified, Recurring)
- Features section explaining the platform
- CTA (call-to-action) section pointing to register
- No data fetching — purely static HTML/CSS

---

#### `pages/login/login.ts` — Login Page (`/login`)

**What it does:**
- Two-column layout: left side has branding, right side has the form.
- User enters email + password.
- Calls `AuthService.login()`.
- On success: navigates to `/dashboard` (for users) or `/admin/dashboard` (for admins).
- On failure: shows an inline error alert.
- Has a loading spinner on the button while the request is in progress.
- Link to `/forgot-password` and `/register`.

---

#### `pages/register/register.ts` — Register Page (`/register`)

**What it does:**
- Same two-column layout as login.
- Form fields: Full Name, Organization Email, Password, Phone, Department, City, Gender, Role (User/Passenger).
- Calls `AuthService.register()`.
- On success: shows a "check your email to verify" message.
- The user cannot log in until they verify their email.

---

#### `pages/forgot-password/forgot-password.ts` — Forgot Password (`/forgot-password`)

**What it does:**
- Simple centered card with one email input.
- Calls `AuthService.forgotPassword(email)`.
- On success: shows confirmation that a reset link was emailed.

---

#### `pages/reset-password/reset-password.ts` — Reset Password (`/reset-password?token=...`)

**What it does:**
- Reads the `token` query parameter from the URL (the link sent by email contains this token).
- Has two password fields (new password + confirm password) with client-side match validation.
- Calls `AuthService.resetPassword(token, newPassword)`.
- On success: shows a "password changed" message and a link back to login.

---

#### `pages/verify-email/verify-email.ts` — Email Verification (`/verify-email?token=...`)

**What it does:**
- As soon as the page loads (`ngOnInit`), it reads the `token` from the URL query string.
- Calls `AuthService.verifyEmail(token)` immediately.
- Shows a loading spinner while waiting.
- On success: shows a big green checkmark "Email Verified!".
- On failure: shows a red X with the error message.

---

### User Pages (login required)

These pages are wrapped inside the `Layout` shell (navbar + sidebar).

---

#### `pages/dashboard/dashboard.ts` — User Dashboard (`/dashboard`)

The **home page after login**. Gives the user a quick overview.

**Shows:**
- A welcome message with the user's name.
- 4 stat cards: Total Trips, Total Bookings, Pending bookings, Active trips.
- Quick action buttons: Search Rides, Create Trip, My Bookings, My Trips.
- A "Next Departure" section showing upcoming trips as a driver.
- A "Upcoming Rides" section showing approved bookings as a passenger.
- A refresh button to reload all data.

**Fetches data from:** `TripService.getMyTrips()` and `BookingService.getMyBookings()` in parallel on load.

---

#### `pages/profile/profile.ts` — Profile Page (`/profile`)

**Two-column layout:**

Left panel:
- Shows profile picture (or placeholder icon).
- "Change Photo" button triggers a file input to upload a new picture.
- Displays name, email, role badge, phone, gender, org domain, department, city.

Right panel:
- Edit form pre-filled with current data (name, phone, department, city, gender).
- Save button calls `AuthService.updateProfile()`.
- Change password section with old password + new password fields.

---

#### `pages/search-trips/search-trips.ts` — Search Rides (`/search-trips`)

The **main search page** for passengers looking for rides.

**Features:**
- Origin and destination text inputs with **autocomplete dropdowns**:
  - First shows matching origins/destinations from the real trip database.
  - Then shows geocoded suggestions from **OpenStreetMap Nominatim API** as the user types.
- GPS button (🎯) to auto-fill your current location using the browser's Geolocation API.
- Date range filter (departure between X and Y).
- Price range filter.
- Gender preference filter.
- After searching: shows results as cards with route, departure time, price, seats, driver info, and a "View" button.
- An embedded **Leaflet map** showing origin and destination markers for the selected trip.

---

#### `pages/trip-detail/trip-detail.ts` — Trip Detail (`/trip/:id`)

Shows the full details of a single trip and allows booking.

**Left column:**
- Route info (from/to, intermediate stops, departure time, recurring schedule).
- Vehicle info (model, color, plate, seats).
- Driver info (name, email, gender).

**Right column:**
- Seats available, price per seat.
- Booking form: number of seats, booking type (Single or Recurring).
- For recurring trips: day-of-week checkboxes to pick specific days.
- Book button → calls `BookingService.requestBooking()`.
- If already booked: shows existing booking status.

**For trip owners (the driver):**
- Edit mode to update trip details.
- Start Trip button (SCHEDULED → ACTIVE).
- Complete Trip button (ACTIVE → COMPLETED).
- Cancel Trip button.

---

#### `pages/my-trips/my-trips.ts` — My Trips (`/my-trips`)

Shows all trips the **current user has created as a driver**.

**Features:**
- Filter pills to show: ALL, SCHEDULED, ACTIVE, COMPLETED, CANCELLED.
- Count badges on each pill.
- Table view with route, departure, seats, price, status, and action buttons.
- Actions per trip: View trip detail, View bookings, Start/Complete/Cancel trip.
- "New Trip" button linking to create-trip page.

---

#### `pages/trip-bookings/trip-bookings.ts` — Trip Booking Requests (`/trip-bookings/:tripId`)

The **driver's view** of who wants to join a specific trip.

**Features:**
- For recurring trips: a **day navigation bar** (tabs for Mon, Tue, etc.) so the driver can switch between days in the recurring group.
- List of all booking requests for this trip.
- Per request: passenger name/email, seats requested, booking type, fare, status badge.
- Action buttons: Approve ✓ or Reject ✗ for pending requests.
- Approved bookings shown separately.
- Counter chips showing "X Pending" and "Y Approved".

---

#### `pages/my-bookings/my-bookings.ts` — My Bookings (`/my-bookings`)

Shows all rides the **current user has booked as a passenger**.

**Features:**
- Filter pills: ALL, PENDING, APPROVED, REJECTED, CANCELLED.
- Card grid view.
- Per card: route, departure time, driver name, booking type, status badge, fare, seats booked.
- For RECURRING bookings: shows which days of the week.
- Cancel button for PENDING or APPROVED bookings.

---

#### `pages/create-trip/create-trip.ts` — Create Trip (`/create-trip`)

The **form to create a new trip** as a driver.

**Features:**
- Pickup and destination inputs with the same **map autocomplete + GPS** as search-trips.
- **Leaflet map** where you can also click to set origin/destination pins.
- Intermediate stops — add/remove up to multiple stops (each with map click).
- Departure date and time picker.
- Available seats input.
- Price per seat (optional).
- Daily rate for recurring trips (optional).
- **Recurring trip toggle** — if enabled, shows a day-of-week checkbox grid (Mon–Sun) to schedule repeating trips.
- Vehicle selector dropdown — lists the driver's approved vehicles.
- Approval mode: AUTO (seat is auto-approved) or MANUAL (driver reviews each request).
- On submit: creates one trip (or one per recurring day) via `TripService.createTrip()`.

---

#### `pages/my-vehicles/my-vehicles.ts` — My Vehicles (`/my-vehicles`)

Allows users to **register their vehicles** for use in trips.

**Features:**
- Registration form at the top: license plate, model, color, total seats.
- After registration, vehicle is marked as **Pending** until admin approves it.
- Vehicle list below shows all your vehicles with their approval status badge (Pending / Approved).

---

#### `pages/notifications/notifications.ts` — Notifications (`/notifications`)

The **notification inbox** for the logged-in user.

**Features:**
- Shows count of unread notifications.
- "Mark all as read" button.
- List of notifications, unread ones are visually highlighted.
- Each notification has a type icon (booking approved = check, rejected = X, etc.).
- Clicking a notification marks it as read and navigates to the relevant trip/booking page.

---

### Admin Pages

Only accessible if the logged-in user has the `ADMIN` role.

---

#### `pages/admin/dashboard/dashboard.ts` — Admin Dashboard (`/admin/dashboard`)

A platform-wide **statistics overview** for admins.

**Shows 6 stat cards:**
- Total Users
- Total Trips
- Active Trips
- Total Bookings
- Total Organizations
- Pending Vehicles

Plus two quick-link cards to Organizations management and Vehicle Approvals.

**Data source:** `AdminService.getStats()`

---

#### `pages/admin/organizations/organizations.ts` — Organizations (`/admin/organizations`)

Allows admins to **manage which company email domains are allowed** to sign up.

**Features:**
- Add Organization form: company name, email domain (e.g., `cognizant.com`), whitelist toggle.
- Edit existing organizations inline.
- Delete organizations.
- Table listing all organizations with their whitelisted status and creation date.

Only users whose email domain is whitelisted can register. This is how the platform stays org-specific.

---

#### `pages/admin/vehicles/vehicles.ts` — Pending Vehicle Approvals (`/admin/vehicles`)

Allows admins to **review and approve vehicle registrations** submitted by drivers.

**Features:**
- Grid of cards, one per pending vehicle.
- Each card shows: vehicle model, license plate, owner name/email, color, total seats.
- Two buttons per card: **Approve** (marks as approved, driver can now use it for trips) or **Reject** (removes from pending list).
- A counter chip showing how many vehicles are pending.

---

## Quick Visual Map

```
src/
├── main.ts           ← Bootstraps the app
├── index.html        ← Single HTML page, Angular injects here
├── styles.css        ← Global styles
└── app/
    ├── app.ts           ← Root component (router-outlet + toasts)
    ├── app.routes.ts    ← URL → Component mapping
    ├── app.config.ts    ← App-wide providers (router, http, interceptors)
    ├── environment.ts   ← Backend URL (localhost:8081/api)
    │
    ├── guards/
    │   └── auth.guard.ts       ← Blocks pages if not logged in / wrong role
    │
    ├── interceptors/
    │   └── auth.interceptor.ts ← Auto-adds JWT token to every HTTP request
    │
    ├── layout/
    │   └── layout.ts           ← Navbar + Sidebar shell (wraps all logged-in pages)
    │
    ├── components/
    │   └── toasts.component.ts ← Floating pop-up messages (success/error/etc.)
    │
    ├── models/
    │   ├── user.model.ts        ← User / LoginRequest / RegisterRequest / AuthResponse
    │   ├── trip.model.ts        ← Trip / TripStop / TripRequest / TripSearchRequest
    │   ├── booking.model.ts     ← Booking
    │   ├── vehicle.model.ts     ← Vehicle / VehicleRequest
    │   ├── notification.model.ts← AppNotification
    │   └── other.model.ts       ← Rating / Organization / OrganizationRequest
    │
    ├── services/
    │   ├── auth.service.ts         ← Login, register, profile, session state
    │   ├── trip.service.ts         ← Create/search/manage trips
    │   ├── booking.service.ts      ← Book/approve/reject/cancel bookings
    │   ├── vehicle.service.ts      ← Register/list vehicles
    │   ├── notification.service.ts ← Fetch/read notifications
    │   ├── toast.service.ts        ← Show pop-up messages (frontend only)
    │   └── admin.service.ts        ← Admin: orgs, vehicle approvals, stats
    │
    └── pages/
        ├── landing/        ← Home/marketing page (public)
        ├── login/          ← Login form (public)
        ├── register/       ← Sign up form (public)
        ├── forgot-password/← Forgot password form (public)
        ├── reset-password/ ← Reset password via email link (public)
        ├── verify-email/   ← Email verification via link (public)
        ├── dashboard/      ← Overview after login (user)
        ├── profile/        ← Edit profile + change password (user)
        ├── search-trips/   ← Search rides with map + filters (user)
        ├── trip-detail/    ← Full trip info + booking form (user)
        ├── create-trip/    ← Post a new trip with map (user/driver)
        ├── my-trips/       ← Trips you created as driver (user)
        ├── my-bookings/    ← Your booked rides as passenger (user)
        ├── my-vehicles/    ← Register/view your vehicles (user)
        ├── trip-bookings/  ← Approve/reject booking requests (driver)
        ├── notifications/  ← Notification inbox (user)
        └── admin/
            ├── dashboard/      ← Platform stats (admin)
            ├── organizations/  ← Manage org whitelist (admin)
            └── vehicles/       ← Approve pending vehicles (admin)
```
