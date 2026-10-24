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

- [ ] **5. Docker Compose Orchestration & Demo Verification**
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
- [ ] Final kick-the-tires exploration and feedback completed — Slice 5 (Full stack with CV and Docker Compose)

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [what actually happened; real document/test/code references; unfinished work if interrupted]
Route and stops: [actual paths and symbols; guided stops completed, or reference-only route]
Edit outcome: [tried/kept/reverted/declined/not applicable; verification if changed]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions
