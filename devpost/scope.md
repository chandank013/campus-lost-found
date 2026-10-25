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
1. User opens the web app and clicks "I lost something" or "I found something".
2. User uploads a photo; the system provides category and color dropdowns (auto-filled by the Flask detector when available, or defaulting to "other" / manual selection).
3. User adds short details (description, location, required contact info, where the item is now if found, and an optional private ownership question/answer for found items). On creation, the system issues a one-time manage code shown once to the poster.
4. User visits the item page to view the top 3 opposite-side matches scored with visible reasons.
5. Claimant clicks "Contact the poster" (answering the private ownership question if configured) to reveal contact info, coordinates pickup offline, and uses their one-time manage code to "Mark as returned" to resolve the post.

## Inspiration & Identity
- Clean, card-based web feed (modern, uncluttered, similar to a streamlined campus directory or community board).
- Honest, trustworthy tone: matches clearly show *why* they matched instead of hiding behind an opaque percentage.
- Utilitarian and direct: zero barriers to post or search.

## Why This Matters to the Learner
Combines full-stack engineering (React, Node, Express, MongoDB) with computer vision (YOLOv8, OpenCV) to solve a genuine, everyday problem observed firsthand on campus, while practicing a disciplined plan-first agent workflow.

## What "Working" Looks Like
A crisp ~1-minute demo running locally:
1. Localhost feed opens populated with 3–4 seeded items.
2. User posts a found blue backpack; the detector auto-tags `bag` and `blue` (editable tags). Poster adds location "Library 2nd floor desk" and contact info.
3. User posts a lost backpack with a short description ("black zip, blue bag, lost near canteen").
4. Aha moment: The lost item page immediately shows the found backpack as the #1 match with clear reasons ("Same category, same color, 2 shared keywords, close date").
5. User clicks "Contact the poster" to call the reveal endpoint and display contact info, then clicks "Mark as returned" to transition the item out of the active matching feed.
6. Brief glimpse of the repository showing `scope.md`, `prd.md`, and `spec.md` planned before coding.

## The POC Boundary
- **In Scope (Now):**
  - Responsive web UI in React + Tailwind (Feed, Post Form, Item Detail with Match Panel).
  - Feed filters (filter by type: Lost/Found, filter by Category, filter by status: Active/Returned).
  - Image upload with preview for lost/found items.
  - Manual-first category and color selection (dropdowns always visible; unrecognized items default to "other"; tags are fully editable).
  - Express + MongoDB backend for CRUD operations and rule-based heuristic matching.
  - Separate contact reveal endpoint (`/api/items/:id/reveal-contact`) ensuring contact details are excluded from feed and public item payloads.
  - Optional private ownership question & answer on found items (hashed answer, 3-attempt limit with lockout before revealing contact).
  - One-time manage code issued upon creation, required by `PATCH /api/items/:id/return` to prevent unauthorized closure.
  - Flask CV microservice using YOLOv8 (common objects) and OpenCV (color extraction) added last to enhance auto-tagging.
  - Item status lifecycle (`active` vs. `returned`), filtering returned items out of active matching.
  - Database seed script with 3–4 sample items for immediate demo readiness.
  - Baseline local run instructions (npm/python processes) with Docker Compose added as a final convenience step.

## Known Limitations
- **Lost Item Contact Visibility:** While found items can be protected with private ownership challenges, lost items reveal contact on request without a challenge so finders can reach the owner quickly.
- **Manage Code Recovery:** Without user accounts or email recovery, if a poster loses their one-time manage code, they cannot mark their item as returned without database administrator assistance.
- **In-Memory Lockout / Rate Limits:** Lockout timestamps are stored per-item in the database; distributed IP-based rate limiting is omitted to keep the proof of concept lightweight.

## Later
- Campus map view / pin drop for item locations.
- Push notifications / email alerts when a high-confidence match is posted.
- Multimodal embedding-based semantic matching (e.g. CLIP / vector search).
- Campus admin dashboard and audit logs for campus security desks.

## Explicitly Cut
- **User authentication / logins:** Cut to keep the build afternoon-sized; separate reveal endpoint + click-to-reveal provides practical privacy without auth overhead.
- **In-app chat:** Cut to eliminate real-time socket infrastructure; coordination happens directly via student email/phone.
- **Native mobile app:** Cut in favor of a responsive web application that runs anywhere on campus without app store distribution.
- **Complex multi-stage claim verification:** Cut procedural verification workflows; finders simply ask claimants to describe an unphotographed detail (prompted via description hint text).
