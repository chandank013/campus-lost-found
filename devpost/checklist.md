---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. Backend API, Image Storage, and CRUD with Contact Protection**
  Becomes usable: The Express server running with MongoDB, handling item creation with image upload (under 5MB, image/*), querying the feed (with `contact` strictly stripped), viewing item details, revealing contact info via a dedicated endpoint, and marking items returned.
  Why now: Establishes the core application hub, database persistence, and privacy boundary that all UI and matching depend on.
  PRD ref: `prd.md > 1. Main Feed`, `prd.md > Privacy-Preserving Contact & Resolution`
  Spec ref: `spec.md > Backend Endpoints`, `spec.md > Data Model`
  Build: Scaffold `backend/`, install dependencies, implement Mongoose `Item` schema, configure Multer disk storage with 5MB validation, implement routes (`POST /api/items`, `GET /api/items`, `GET /api/items/:id`, `POST /api/items/:id/reveal-contact`, `PATCH /api/items/:id/return`), and serve static `/uploads`.
  Verify (mechanical): Start Express server, execute automated test script to create an item with an image, verify `GET /api/items` excludes contact, verify `POST /api/items/:id/reveal-contact` returns contact, and verify `PATCH /api/items/:id/return` sets returned status.
  Learner check: Start the backend, call the API in the browser or terminal, and confirm that item JSON is returned with contact details strictly excluded.
  Commit: `feat(backend): add core CRUD, upload storage, and contact privacy endpoints`

- [x] **2. Explainable Matching Engine, Unit Tests, and 5-Item Seed Dataset**
  Becomes usable: The deterministic 100-point matching engine (`matcher.js`), passing unit test suite (`matcher.test.js`) validating all PRD qualification rules, `GET /api/items/:id/matches` endpoint, and database seed script populating 5 realistic campus items with sample images.
  Why now: Delivers and proves the Unique Kernel (explainable matching with visible reason chips) immediately via automated unit tests before frontend code is written.
  PRD ref: `prd.md > Explainable Top-3 Matching`, `prd.md > States and Boundaries` (Seeded State)
  Spec ref: `spec.md > Explainable Matching Engine & Scoring Specification`, `spec.md > Seed Data Specification`
  Build: Create `backend/src/services/matcher.js` (stopword lists, keyword extraction, location overlap, close date, 100pt scoring, qualification rule), write `backend/tests/matcher.test.js`, mount `GET /api/items/:id/matches`, and implement `backend/src/seeds/seed.js` with 5 items (including demo backpack keyword match).
  Verify (mechanical): Run `npm test` verifying 100% pass on all 6 matcher test cases; run `npm run seed` and verify `GET /api/items/:id/matches` returns top 3 items with correct score tiers and reason chips.
  Learner check: Inspect the passing unit test output and seed log; query matches for the seeded blue backpack to verify the exact reason chips.
  Commit: `feat(matcher): implement explainable scoring engine, unit tests, and seed dataset`

- [x] **3. Manual-First React Frontend (Feed, Report, Details, Matches, and Resolution)**
  Becomes usable: A responsive web app in React + Tailwind using plain JavaScript (JSX). Students can browse the 5 seeded items, filter by Type/Category/Status, submit a new post with photo upload and manual dropdowns, view item details with explainable match chips, reveal contact info, and mark items returned.
  Why now: Connects the entire user-facing core journey into a complete, working manual-first product that fulfills the hackathon MVP criteria even before ML is added.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Item Feed & Filtering`, `prd.md > Privacy-Preserving Contact & Resolution`
  Spec ref: `spec.md > Frontend Components`, `spec.md > Look and Feel`
  Build: Scaffold `frontend/` using Vite + React (JavaScript/JSX) + Tailwind + Lucide, implement Navbar, FilterBar, ItemCard, FeedGrid, ReportForm (instant image preview and manual dropdowns), ItemDetail, MatchCard, Modal, and API client.
  Verify (mechanical): Run `npm run build` with zero errors; start Vite dev server and verify HTTP 200 on `http://localhost:5173`.
  Learner check: Open `http://localhost:5173` in browser, filter the feed, post a lost item, view its detail page with top matches and reason chips, reveal the contact, and mark an item returned.
  Commit: `feat(frontend): implement responsive manual-first web app with feed, report, and matches`

- [x] **4. Flask Computer Vision Service & Express Tag Proxy**
  Becomes usable: The Flask microservice running YOLOv8 and OpenCV HSV color extraction, pre-downloaded weights, sample backpack test image committed, Express proxy `POST /api/detect` with in-memory validation and 3-second timeout fallback, and frontend auto-fill tag suggestions with "Suggested automatically. Please check".
  Why now: Adds the AI enhancement layer onto the already-stable manual-first web app, proving the full vision without risking the baseline product.
  PRD ref: `prd.md > Manual-First Reporting & AI Auto-Tagging`, `prd.md > States and Boundaries` (CV Offline / Error State)
  Spec ref: `spec.md > Computer Vision Mapping & Color Classification Specification`, `spec.md > Flask CV Microservice`
  Build: Create `cv-service/` (`app.py`, `detector.py`, `color.py`, `requirements.txt`), pre-download `yolov8n.pt`, provide sample backpack image, add Express route `POST /api/detect` with in-memory Multer and 3s timeout fallback, and update frontend `ReportForm.jsx` to call `/api/detect` on photo select and auto-fill tags.
  Verify (mechanical): Start Flask server; execute automated test script sending the sample backpack image to Express `POST /api/detect` verifying it returns category `bag` and color `blue`; simulate timeout/offline and verify fallback returns `{ category: 'other', color: null }`.
  Learner check: On the Report page, upload a backpack photo; verify the category `bag` and color `blue` auto-fill with the suggested label, and verify you can freely edit the dropdowns.
  Commit: `feat(cv): integrate YOLOv8 and OpenCV color detection with Express proxy and auto-tagging`

- [x] **5. Docker Compose Orchestration & Demo Verification**
  Becomes usable: Complete multi-container orchestration running MongoDB, Flask, Express, and React with a real `docker-compose up --build` run (if Docker Desktop is available), along with verification of the complete 1-minute demo flow.
  Why now: Final packaging step that guarantees anyone can run the whole stack cleanly with zero environment conflicts.
  PRD ref: `prd.md > What We're Building`
  Spec ref: `spec.md > Docker Compose Final Step`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Create Dockerfiles for `backend`, `frontend`, and `cv-service`, configure root `docker-compose.yml`, verify port mappings and network resolution.
  Verify (mechanical): Validate `docker-compose config`, execute `docker-compose up --build -d` (if Docker is available) and verify containers are healthy and responding.
  Learner check: Verify that running the stack matches the 1-minute demo script from `scope.md` and `prd.md`.
  Commit: `feat(docker): add multi-container Docker Compose orchestration and deployment config`

## Hands-on Checkpoints

- [x] Early usable behavior explored — Slice 3 (Manual-first web application verified in browser)
- [x] Final kick-the-tires exploration and feedback completed — Slice 5 (Full stack with CV and Docker Compose)

## Final Review

- [x] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Guided architectural tour connecting plan-first boundary specification (in-memory proxy fallback and deterministic scoring matrix) to passing unit tests (15/15 in backend/tests/*.test.js) and observed live resilience.
Route and stops:
  - Stop 1: backend/src/routes/detect.js (`router.post('/')`)
  - Stop 2: cv-service/detector.py (`ItemDetector.detect`) and cv-service/color.py (`extract_dominant_color`)
  - Stop 3: backend/src/services/matcher.js (`calculateMatch`)
Edit outcome: Not applicable (learner tested the application, confirmed all behavior works, and requested zero visual or behavioral modifications).
Reflection: Offered to learner: "What would you do differently next time you start with an agent?"
Activity mode: Live app and editor, paired with standalone `devpost/app-map.html` guide.

## Revisions

- [x] **Slice 6: Ownership Verification Challenge & Item Management Codes**
  Becomes usable:
    1. Found item posts can include an optional private question and answer. The answer is stored hashed (trimmed, lowercased, SHA-256) and never returned by any endpoint. Claimants must answer correctly (max 3 attempts per item before a 5-minute lockout) to reveal contact info. Items without questions preserve the default direct reveal.
    2. Item creation returns a one-time manage code shown once in the UI. Marking an item as returned (`PATCH /api/items/:id/return`) requires providing this code, preventing unauthorized closure.
  Why now: Directly addresses the POC boundary's known limitations (open return transitions and unauthenticated reveal scraping) before final submission, without the complexity of full user accounts.
  PRD ref: `prd.md > The Core Journey` (Steps 4 & 6), `prd.md > Privacy-Preserving Contact & Resolution`
  Spec ref: `spec.md > Backend Endpoints`, `spec.md > Data Model`
  Build:
    - Update `Item` schema with `privateQuestion`, `privateAnswerHash` (select: false), `verificationAttempts`, `lockoutUntil`, and `manageCodeHash` (select: false).
    - Update `POST /api/items` to generate/hash manage code, accept optional private question/answer on found items, and return `manageCode` once.
    - Update `POST /api/items/:id/reveal-contact` with attempt limit, lockout timer, and hash verification.
    - Update `PATCH /api/items/:id/return` to require and verify manage code.
    - Update frontend: `ReportPage` adds private question inputs for found items and displays one-time manage code on creation; `DetailPage` prompts challenge before contact reveal and requires manage code to mark returned.
  Verify (mechanical):
    - Run automated tests in `backend/tests/api.test.js` validating: wrong answer reveals nothing (401), correct answer reveals contact (200), lockout triggered after 3 failures (429), return without code rejected (400), return with wrong code rejected (403), and neither answer hash nor code hash is ever returned.
    - Frontend build compiles cleanly (`npm run build`).
  Commit: `feat(security): add private ownership verification challenge and one-time item manage codes`

- [x] **Slice A (Backend): User Accounts, JWT Authentication, and Item Ownership**
  Becomes usable:
    1. User model (`email` unique/lowercased, `passwordHash`, `createdAt`).
    2. `POST /api/auth/register` and `POST /api/auth/login` using bcrypt (10 rounds) and JWT (7-day expiry, fail-fast if `JWT_SECRET` missing).
    3. Input validation (valid email format, password at least 8 chars) and `express-rate-limit` on login and register. Never return `passwordHash` or log passwords.
    4. Auth middleware verifying JWT and attaching `req.user`.
    5. `GET /api/auth/me` returning current user profile (`id`, `email`).
    6. `Item` schema updated with `owner` (ref User, required); remove `manageCodeHash` logic.
    7. `POST /api/items` requires auth and assigns `owner: req.user._id`.
    8. `POST /api/items/:id/reveal-contact` requires auth.
    9. `PATCH /api/items/:id/return` allowed ONLY for item owner (returns 403 otherwise).
    10. `GET /api/items/mine` returns current user's items.
    11. Maintain private question challenge & attempt limits; keep public feed/matches public and contact strictly hidden.
  Verify (mechanical): Unit/integration tests in `backend/tests/auth.test.js` testing register, duplicate email rejection, login success/wrong password, token rejection on protected routes, owner can mark returned, non-owner gets 403, reveal-contact requires login, and passwordHash/answer hash never returned.
  Commit: `feat(auth): implement user model, jwt auth, route protection, and item ownership`

- [x] **Slice B (Frontend): Auth Context, Login/Register Pages, Navbar Auth, and My Posts**
  Becomes usable:
    1. Token storage in `localStorage` wrapped in safe `try/catch`.
    2. React `AuthContext` providing user state, login, register, and logout.
    3. `LoginPage` and `RegisterPage` with validation feedback and redirect support.
    4. Navbar shows "Login" when logged out, or "My posts" link and "Logout" button when logged in (retaining lost/found action buttons; unauthenticated click redirects to login, then returns to form).
    5. `MyPostsPage` listing user's reported items with status and direct "Mark as returned" button.
    6. Item detail page displays "Mark as returned" only to the item owner.
  Verify (mechanical): `npm run build` succeeds with zero errors.
  Commit: `feat(ui): add auth context, login/register pages, navbar auth controls, and my-posts view`

- [x] **Slice C: Seed Data with Demo Users, Docker Environment, README & Limitations Update**
  Becomes usable:
    1. Database seed script updated with 2 demo users (`alice@campus.edu`, `bob@campus.edu`, password `demopassword123` documented as demo-only in README) owning the seeded items.
    2. `JWT_SECRET` added to `.env.example`, `.env`, and Docker Compose environment.
    3. `README.md` and `Known Limitations` updated to reflect real user accounts and removal of manage codes.
    4. Full test suite passing.
  Verify (mechanical): `npm test` passes all tests; `npm run build` passes; seed runs cleanly.
  Commit: `chore(ship): update seed data with demo users, docker env, and documentation for accounts`


- [x] **Slice D: Navbar, Profile Dropdown, Detail Page Redesign, Footer & Documentation Synchronization (2026-10-25)**
  Becomes usable:
    1. Global Navbar: Left brand link, Center navigation ("Home", "Report" dropdown with lost/found options, "About" link; "Browse" removed), Right search input, Login button (sharing primary button styling) and notification placeholder when logged out; search, notification placeholder, and circular profile avatar with Lucide `User` icon when logged in.
    2. Profile Dropdown Menu: Displays user email header (`Signed in as <email>`), "My Profile" link navigating to `#/profile`, and "Logout" button with keyboard accessibility and click-outside/Escape dismissal.
    3. Item Detail Page Redesign: Modern two-column layout (~55% details, ~45% matches), overlaid type/status badges, image lightbox expand button (`Maximize2`), custody information, royal blue contact reveal button with ownership challenge modal, owner "Mark as returned" resolution, and Top Likely Matches panel with candidate count badge, reason chips, and custom empty illustration (`MatchesEmptyIllustration`). No "Back to feed" link.
    4. Profile Page (`ProfilePage.jsx`): Complete user profile dashboard displaying email, join date, member badge, statistics (total reports, active listings, returned count), tab filters (All/Active/Returned), item list, and owner return action.
    5. Global Footer (`Footer.jsx`): Multi-column layout with brand mission, navigation links (Home, About, Contact Support), community reporting links, dynamic copyright year, and hackathon POC notice.
    6. Route Guards (`RouteGuards.jsx`): `GuestRoute` protecting login/register with safe replace to avoid history loops, `ProtectedRoute` for reporting and profile with redirect preservation, and `LoadingSpinner` preventing session flashes.
    7. Documentation Synchronization: Synchronized `devpost/scope.md`, `devpost/prd.md`, `devpost/spec.md`, and `README.md` to perfectly match implemented routes, styling, 35 unit/API tests, and honest limitations.
  Verify (mechanical):
    - Frontend build compiles cleanly (`npm run build` in `frontend/`) with zero warnings or errors.
    - All 35 backend tests pass (`npm test` in `backend/`).
  Commits:
    - `216718f`: `feat(navbar): rename report buttons, add profile avatar dropdown, and clean up page body`
    - `1f742d0`: `feat(navbar): use User icon for profile avatar and share button styling with login button`
    - `26c4207`: `feat(detail): redesign item detail page and matches panel to match reference design`
    - `450b42b`: `feat(ui): update navbar layout, footer, and profile page`
