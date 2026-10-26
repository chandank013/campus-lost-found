---
doc: scope
status: approved
---

# Campus Lost & Found

An AI-assisted campus lost-and-found web application that automatically tags uploaded item photos and surfaces top-3 explainable matches between lost and found posts.

## The Unique Kernel
Computer vision auto-tagging (category and dominant color) paired with transparent, explainable top-3 matching that exposes human-readable match reasons ("same category, same color, 2 shared keywords, close date") so the match feels trustworthy rather than like a black box. The app is built manual-first—category and color dropdowns are always visible and editable, and unrecognized items gracefully default to "other" for manual selection. The Flask detector is added as an enhancement in the final development phase.

## Who It's For
College students, campus staff, and campus facility/security desk attendants who currently rely on chaotic WhatsApp groups where lost item notices get buried in minutes.

## The Core Loop
1. User opens the web app, browses the public feed, or registers/logs in with email and password.
2. User uploads a photo to report an item; the system provides category and color dropdowns (auto-filled by the Flask detector when available, or defaulting to "other" / manual selection).
3. User adds short details (description, location, required contact info, where the item is now if found, and an optional private ownership question/answer for found items). The item is associated with the authenticated user as owner.
4. User visits the item page to view the top 3 opposite-side matches scored with visible reasons.
5. Claimant logs in and clicks "Contact the poster" (answering the private ownership question if configured) to reveal contact info and coordinates pickup offline.
6. The item owner views their item (from item page or "My Profile") and clicks "Mark as returned" to resolve the post.

## Inspiration & Identity
- Clean, card-based web feed (modern, uncluttered, similar to a streamlined campus directory or community board).
- Honest, trustworthy tone: matches clearly show *why* they matched instead of hiding behind an opaque percentage.
- Utilitarian and direct: fast registration and login, public browsing, protected contact reveal and item resolution.

## Why This Matters to the Learner
Combines full-stack engineering (React, Node, Express, MongoDB) with computer vision (YOLOv8, OpenCV) and token-based authentication (bcrypt, JWT) to solve a genuine, everyday problem observed firsthand on campus, while practicing a disciplined plan-first agent workflow.

## What "Working" Looks Like
A crisp ~1-minute demo running locally:
1. Localhost feed opens populated with 3–4 seeded items.
2. User registers or logs in with demo credentials.
3. User posts a found blue backpack; the detector auto-tags `bag` and `blue` (editable tags). Poster adds location "Library 2nd floor desk" and contact info.
4. User posts a lost backpack with a short description ("black zip, blue bag, lost near canteen").
5. Aha moment: The lost item page immediately shows the found backpack as the #1 match with clear reasons ("Same category, same color, 2 shared keywords, close date").
6. Claimant logs in, clicks "Contact the poster" (answering verification question if required) to call the reveal endpoint and display contact info.
7. Item owner navigates to item or "My Profile" and clicks "Mark as returned" to transition the item out of the active matching feed.
8. Brief glimpse of the repository showing `scope.md`, `prd.md`, and `spec.md` planned before coding.

## The POC Boundary
- **In Scope (Now):**
  - Responsive web UI in React + Tailwind (Feed, Post Form, Redesigned Item Detail with Top Matches Panel, Login, Register, My Profile page).
  - Client-side routing with hash router and route guards (`GuestRoute`, `ProtectedRoute`, session restore spinner).
  - Global navigation bar: Left (Brand & graduation cap), Center (Home, Report dropdown with lost/found links, About), Right (Search, Login, Notifications when logged out; Search, Notifications, Profile Avatar with email, My Profile, Logout when logged in).
  - Global footer: Campus Lost & Found logo and mission, navigation links (Home, About, Contact Support), community links (Report Lost, Report Found), dynamic copyright year and POC notice.
  - User authentication: Registration and login using bcrypt password hashing and 7-day JWTs, rate-limited auth endpoints, and current user retrieval (`/api/auth/me`).
  - Item ownership: Authenticated item posting associating items with users, "My Profile" view (`/api/items/mine`), and owner-only return action (`PATCH /api/items/:id/return` returning 403 for non-owners).
  - Protected contact reveal: Authenticated claimants can reveal contact (`/api/items/:id/reveal-contact`), while public feed and item details strictly omit contact info.
  - Feed filters (filter by type: Lost/Found, filter by Category, filter by status: Active/Returned).
  - Image upload with preview for lost/found items.
  - Manual-first category and color selection (dropdowns always visible; unrecognized items default to "other"; tags are fully editable).
  - Express + MongoDB backend for CRUD operations and rule-based heuristic matching.
  - Optional private ownership question & answer on found items (hashed answer, 3-attempt limit with lockout before revealing contact).
  - Flask CV microservice using YOLOv8 (common objects) and OpenCV (color extraction) to enhance auto-tagging.
  - Item status lifecycle (`active` vs. `returned`), filtering returned items out of active matching.
  - Database seed script with 2 demo users and sample items for immediate demo readiness.
  - In-app notification center: Interactive navbar bell dropdown with real-time active unread badge. Dual delivery pipeline: public campus upload announcements for visitors on the main dashboard (`recipient: null`), and targeted private candidate match alerts delivered exclusively to the owner and founder after login (`recipient: <userId>`).
  - Strict resolution-bound notification count decrement: the unread counter badge decrements ONLY when an item owner marks the item as returned (`Mark as returned`), automatically resolving notifications across both guest and user views.
  - Expanded item categories: Support for `headphone`, `earbuds`, `airphone`, `earphone`, `hearphone` alongside standard campus items (`bag`, `phone`, `bottle`, `umbrella`, `laptop`, `book`, `other`).
  - Registration redirect flow: Submitting account registration automatically redirects to the login screen with prefilled email and green confirmation notice.
  - Baseline local run instructions (npm/python processes) with Docker Compose configuration.

## Known Limitations
- **No Password Reset / Email Verification:** User accounts rely on simple email/password registration without email confirmation or password recovery workflows.
- **Lost Item Contact Visibility:** While found items can be protected with private ownership challenges, lost items reveal contact to any logged-in user without a challenge so finders can reach the owner quickly.
- **In-Memory Lockout / Rate Limits:** Lockout timestamps are stored per-item in the database; auth endpoints use in-memory rate limiting.
- **In-App Only Notifications:** Notifications are delivered directly inside the navbar notification center (broadcasts for guests and targeted match alerts for owners); external SMS or push notifications are omitted to keep the prototype self-contained.

## Later
- Campus map view / pin drop for item locations.
- Push notifications / email alerts when a high-confidence match is posted.
- Multimodal embedding-based semantic matching (e.g. CLIP / vector search).
- Campus admin dashboard and audit logs for campus security desks.

## Explicitly Cut
- **Email verification & password reset:** Cut to keep auth focused on core ownership and identity without external email provider dependencies.
- **Roles & admin UI:** Cut; all users have standard student privileges.
- **OAuth / Campus SSO:** Cut; standard email/password authentication is used for the prototype.
- **Refresh tokens:** Cut in favor of standard 7-day JWT expiration.
- **In-app chat:** Cut to eliminate real-time socket infrastructure; coordination happens directly via student email/phone.
- **Native mobile app:** Cut in favor of a responsive web application that runs anywhere on campus without app store distribution.
- **Complex multi-stage claim verification:** Cut procedural verification workflows; finders use private questions and physical confirmation.
