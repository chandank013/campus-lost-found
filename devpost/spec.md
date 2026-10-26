---
doc: spec
status: approved
---

# Campus Lost & Found — Technical Spec

## How This Works, In Plain Language
Campus Lost & Found is built as a modular 3-tier architecture with an asynchronous AI enhancement layer:
1. **Frontend (React + Tailwind CSS):** A responsive single-page web app built with Vite. It renders the feed, handles client-side filtering, presents the posting form with instant image preview, displays redesigned item details with an explainable Top Likely Matches panel, provides user authentication and profile management, and enforces client-side route guards.
2. **Backend API (Node/Express + MongoDB):** The core application hub. It manages user registration and authentication (bcrypt + JWT), handles CRUD operations and image uploads to a local `/uploads` directory, serves items while strictly stripping sensitive contact information and hashes from public responses, exposes a protected contact reveal endpoint with private verification challenges, enforces owner-only returns (`PATCH /api/items/:id/return`), and executes a deterministic, rule-based matching algorithm with human-readable reason chips. It also acts as an internal proxy for image tag detection.
3. **Computer Vision Microservice (Python/Flask + YOLOv8 + OpenCV):** A standalone helper service running on port 5001. When an image is uploaded for preview, Express forwards it in-memory to Flask. YOLOv8 detects the bounding box and category; OpenCV analyzes the cropped bounding box (or center crop fallback) in HSV color space to determine dominant color via per-pixel classification and majority vote. If this service is slow or offline, the app gracefully falls back to manual entry without user friction.

This shape cleanly separates deterministic product logic and database persistence from ML dependencies, allowing the entire application to run seamlessly manual-first while layering AI capabilities on top.

## The Core Journey Through the System
Implements `prd.md > The Core Journey`.

```
[Student Browser]
       │
       ├─ (1) GET /api/items?status=active ───────→ [Express API] ───→ [MongoDB]
       │   ← Returns seeded feed items (no contact) ──┴───────────────┘
       │
       ├─ (2) POST /api/auth/login or register ───→ [Express API] ───→ [MongoDB User]
       │   ← Returns { token, user: { id, email } } ──┘
       │
       ├─ (3) Select Photo Preview ──────────────→ [Express POST /api/detect]
       │                                                    │ (in-memory buffer, ≤5MB, 3s timeout)
       │                                                    ▼
       │                                            [Flask CV Service]
       │                                            - YOLOv8 category inference
       │                                            - OpenCV HSV color extraction
       │   ← Returns { category, color } ───────────────────┘
       │     (or { category: "other", color: null } on error)
       │
       ├─ (4) Submit POST /api/items (Auth token) → [Express API]
       │                                            - Validates photo (≤5MB, image/*)
       │                                            - Saves photo to ./uploads/<uuid>
       │                                            - Assigns owner = req.user._id
       │                                            - Writes item doc to MongoDB
       │   ← Redirect to #/items/:id ───────────────┘
       │
       ├─ (5) GET /api/items/:id ─────────────────→ [Express API]
       │   ← Returns item details (WITHOUT contact) ┘
       │
       ├─ (6) GET /api/items/:id/matches ─────────→ [Express API]
       │                                            - Queries active opposite-type items
       │                                            - Runs scoring engine & reason rules
       │                                            - Filters: PRD rule AND score ≥ 25
       │   ← Returns top 3 matches with reasons ────┘
       │
       ├─ (7) POST /api/items/:id/reveal-contact ─→ [Express API] (Auth token)
       │   ← Returns { contact: "email/phone" } ────┘ (after verifying question if present)
       │
       └─ (8) PATCH /api/items/:id/return ────────→ [Express API] (Auth token)
           ← Returns { message: "Item marked returned" } (Allowed ONLY for item owner; 403 otherwise)
```

## Stack
- **Frontend:** React 18 / 19, Vite (plain JavaScript/JSX), Tailwind CSS, Lucide-React.
  - *Rationale:* Fast development server, lightweight bundle, zero TypeScript compilation overhead for quick prototyping, utility-first styling for clean campus design.
  - *Docs:* [Vite Docs](https://vitejs.dev/), [React Docs](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend API:** Node.js (v18+), Express, Mongoose, Multer, bcrypt (10 rounds), jsonwebtoken (JWT), express-rate-limit.
  - *Rationale:* High-performance asynchronous I/O, straightforward schema validation with Mongoose, standard multipart handling via Multer, secure hashing with bcrypt.
  - *Docs:* [Express](https://expressjs.com/), [Mongoose](https://mongoosejs.com/), [Multer](https://github.com/expressjs/multer)
- **Database:** MongoDB (local Community Server or Dockerized container).
  - *Rationale:* Document store fits flexible lost/found item schemas with nested attributes and dynamic match tags.
  - *Docs:* [MongoDB](https://www.mongodb.com/docs/)
- **CV Microservice:** Python 3.10+, Flask, Ultralytics YOLOv8 (`yolov8n.pt`), OpenCV (`opencv-python-headless`), NumPy, Pillow.
  - *Rationale:* YOLOv8 nano is lightweight and runs locally on CPU in <200ms; OpenCV provides deterministic color classification.
  - *Docs:* [Ultralytics YOLOv8](https://docs.ultralytics.com/), [OpenCV](https://docs.opencv.org/)
- **Testing:** Node.js native test runner (`node --test`), `mongodb-memory-server`.
- **Orchestration:** Docker Compose.

## Phased Build Order
The implementation follows a strict manual-first, incremental sequence:
1. **Phase 1: Backend Foundation & Persistence**
   - Express server setup, MongoDB connection, Mongoose `Item` and `User` models.
   - Multer upload configuration with file validation (images only, max 5 MB).
   - CRUD routes (`POST /api/items`, `GET /api/items`, `GET /api/items/:id`, `PATCH /api/items/:id/return`).
   - Projection guard: strictly exclude `contact` and `privateAnswerHash` from list and detail responses.
   - Separate contact reveal route (`POST /api/items/:id/reveal-contact`).
2. **Phase 2: Explainable Matcher Engine & Seed Script**
   - Pure scoring function `matcher.js` implementing the 100-point formula and qualification rules.
   - Comprehensive unit test suite `backend/tests/matcher.test.js` validating all rules and edge cases.
   - Endpoint `GET /api/items/:id/matches` returning top 3 qualified candidates with reason chips.
   - Database seed script `seed.js` creating 5 real sample items with 2 demo user accounts.
3. **Phase 3: React Frontend (Manual-First Baseline)**
   - Vite + Tailwind setup with clean campus design system and light theme.
   - Feed page (`#/`) with responsive cards and Type/Category/Status filters.
   - Report page (`#/report`) with image upload preview and always-visible, fully editable dropdowns.
   - Item detail page (`#/items/:id`) with Top Matches panel, click-to-reveal contact, and "Mark as returned" modal.
4. **Phase 4: Flask CV Microservice & Express Proxy**
   - Flask server setup with YOLOv8 category detection and OpenCV HSV dominant color extraction.
   - Express proxy `POST /api/detect` with in-memory upload handling and 3-second timeout fallback.
   - Frontend auto-tagging integration with "Suggested automatically. Please check" indicator.
5. **Phase 5: User Accounts, Navigation, and UI Redesign**
   - User registration and login with bcrypt password hashing and 7-day JWTs.
   - Route guards (`GuestRoute`, `ProtectedRoute`, session restore loading spinner).
   - Refined navigation bar: Brand left, Home/Report dropdown/About center (Browse removed), Search/Login/Notifications or Search/Notifications/Avatar right.
   - Redesigned Item Detail page with two-column layout, image lightbox expand, badges, and Top Likely Matches panel with custom empty illustration.
   - User Profile page (`#/profile`) with stats, filter tabs, and owner return actions.
   - Persistent global footer with navigation and community links.

## Where It Runs and How Someone Tries It
- **Runtime Environment:** Windows / macOS / Linux with Node.js v18+, Python 3.10+, and MongoDB.

### Baseline Local Startup (Without Docker)
1. **MongoDB:** Start local MongoDB instance on port `27017` (`mongod`) or connect to MongoDB Atlas.
2. **Flask CV Service:**
   ```bash
   cd cv-service
   python -m venv venv
   ./venv/Scripts/activate  # on Windows (or source venv/bin/activate on macOS/Linux)
   pip install -r requirements.txt
   python app.py
   # Runs on http://localhost:5001
   ```
3. **Backend API & Seeding:**
   ```bash
   cd backend
   npm install
   npm run seed    # Seeds 2 demo users and sample campus items
   npm test        # Runs all 41 automated tests
   npm start       # Runs on http://localhost:5000
   ```
4. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev     # Runs on http://localhost:5173
   ```
5. **Open in Browser:** Navigate to `http://localhost:5173`.

### Docker Compose Final Step
A single root command boots the entire stack:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Flask Service: `http://localhost:5001`
- MongoDB: `mongodb://mongo:27017/campus_lost_found`

## Environment Configuration & Git Ignore
- **`backend/.env.example`:**
  ```env
  PORT=5000
  MONGODB_URI=mongodb://localhost:27017/campus_lost_found
  FLASK_SERVICE_URL=http://localhost:5001
  JWT_SECRET=your-jwt-secret-key-change-in-production
  ```
- **`frontend/.env.example`:**
  ```env
  VITE_API_URL=http://localhost:5000/api
  ```
- **`.gitignore` Rules (at Project Root):**
  ```gitignore
  # Node & Python dependencies
  node_modules/
  venv/
  __pycache__/
  *.pyc

  # Build outputs
  frontend/dist/
  
  # Uploaded image files (preserve sample seeds)
  backend/uploads/*
  !backend/uploads/.gitkeep
  !backend/uploads/sample-*.jpg

  # Environment & weights
  .env
  .env.*
  !.env.example
  *.pt
  ```

## Look and Feel
Carried forward from `prd.md > Look and Feel`.
- **Theme:** Strict light mode.
- **Palette (Exact Hex Values):**
  - Page Background: `#f8fafc`
  - Card Background: `#ffffff`
  - Card Border: `#e2e8f0`
  - Primary Accent: `#4338ca` / `#3b82f6` (deep royal blue for buttons, links, active filter pills)
  - "Lost" Badge: Text `#d97706`, Background `#fef3c7`
  - "Found" Badge: Text `#0d9488`, Background `#ccfbf1`
  - "Returned" Badge: Text `#6b7280`, Background `#f3f4f6`
  - Match Tiers: Strong `#16a34a`, Good `#2563eb`, Possible `#64748b`
  - Reason Chips: Text `#0369a1`, Background `#e0f2fe`
  - Body Text: `#0f172a`, Secondary Metadata: `#64748b`
- **Typography:** Sans-serif (Inter with system fallbacks).
- **Cards & Shapes:** Rounded corners (`rounded-xl` / `rounded-2xl`), soft borders (`border border-slate-200`), consistent 4:3 aspect ratio thumbnails, accessible contrast.

## Frontend Routing and Route Protection

### 1. Hash-Based Client Routing
The single-page application uses `window.location.hash` with fallback to `pathname` for client routing:
- **Public Routes:**
  - `#/` (Feed / Home) — displays public feed and search results.
  - `#/items/:id` (Item Detail Page) — displays item details, image lightbox, contact reveal challenge, and top qualified matches.
  - `#/about` (About Page) — overview of app purpose, AI matching, and privacy.
- **Guest-Only Routes (wrapped with `GuestRoute`):**
  - `#/login` (Login Page) — redirects authenticated users to `#/` via `window.location.replace` to prevent browser history loops.
  - `#/register` (Register Page) — redirects authenticated users to `#/`.
- **Protected Routes (wrapped with `ProtectedRoute`):**
  - `#/report` (Report Page) — redirects unauthenticated users to `#/login?redirect=/report`.
  - `#/profile` / `#/my-posts` (Profile Page) — redirects unauthenticated users to `#/login?redirect=/profile`.
- **Session Restore Loading State:**
  - Displays a centered `LoadingSpinner` while the initial `GET /api/auth/me` request verifies the token stored in `localStorage`, preventing brief unauthorized flashes or false redirects.

### 2. Frontend Components (`frontend/src/`)
- `Navbar.jsx`: Global header displaying brand icon/title, center navigation (Home, Report dropdown with lost/found options, About), desktop Search bar, Login button or circular Profile avatar dropdown (email, My Profile, Logout), and responsive mobile drawer.
- `Footer.jsx`: Global footer displaying brand information, navigation links (Home, About, Contact), community reporting links, dynamic copyright year, and hackathon POC disclaimer.
- `RouteGuards.jsx`: Exports `GuestRoute`, `ProtectedRoute`, and `LoadingSpinner` components enforcing navigation rules.
- `FilterBar.jsx`: Type, Category, and Status filter pill controls.
- `ItemCard.jsx`: Feed card rendering thumbnail, type/status badges, tags, truncated description, date, and location. Contact info is strictly excluded.
- `FeedGrid.jsx`: Responsive feed grid (1 col mobile, 2-3 col desktop) with empty filter state.
- `ReportForm.jsx`: Photo select, preview, async call to `/api/detect`, manual dropdowns, custody input, optional private challenge, and validation.
- `DetailPage.jsx`: Two-column layout with photo container, type & status badges, expand button (`Maximize2`), custody details, contact reveal challenge modal with copy button, owner "Mark as returned" button, and Top Likely Matches panel with count badge and custom empty state illustration.
- `MatchCard.jsx`: Candidate match card displaying tier badge, score breakdown, applied reason chips, and links to candidate item.
- `ProfilePage.jsx`: User profile dashboard with user email, join date, member badge, statistics (total reports, active listings, returned count), tab filters (All/Active/Returned), item list, and owner return action.
- `AboutPage.jsx`: Information on system architecture, explainable matching rules, and student privacy.
- `LoginPage.jsx`: Email/password login with redirect handling.
- `RegisterPage.jsx`: Email/password registration with 8-character validation.
- `AuthContext.jsx`: Reactive authentication provider (`user`, `token`, `login`, `register`, `logout`) with safe `localStorage` access wrapped in try/catch blocks.
- `Modal.jsx`: Accessible popup dialog.

## Backend Endpoints (`backend/src/routes/`)
- `POST /api/auth/register`: Validates email (format) and password (length >= 8). Rate limited. Hashes password with bcrypt (10 rounds). Saves new `User`. Returns `{ token, user: { id, email } }`. Never returns passwordHash or logs passwords.
- `POST /api/auth/login`: Rate limited. Validates credentials. Returns `{ token, user: { id, email } }` with 7-day JWT expiry. Never returns passwordHash or logs passwords.
- `GET /api/auth/me`: Requires JWT auth header (`Bearer <token>`). Returns `{ user: { id, email } }`.
- `POST /api/detect`: Implements `prd.md > Manual-First Reporting & AI Auto-Tagging`. Uses in-memory Multer storage (`multer.memoryStorage()`) with strict limits (images only, max 5 MB). Forwards file buffer to Flask `POST http://localhost:5001/detect` with a 3-second timeout. Returns `{ category, color }` without writing to disk.
- `GET /api/items`: Implements `prd.md > Item Feed & Filtering`. Filters by `type`, `category`, `status`. Uses Mongoose `.select('-contact -privateAnswerHash')` to strictly omit sensitive fields. Populates owner public info (`email`).
- `POST /api/items`: Requires JWT auth header (`Bearer <token>`). Multer storage validates image (≤5MB, mimetype `image/*`), writes to `./uploads/`, assigns `owner = req.user._id`. For found items, optionally accepts `privateQuestion` and `privateAnswer` (stored as SHA-256 `privateAnswerHash`). Automatically generates a broadcast notification to all users on the main dashboard (`recipient: null`). Evaluates candidate matches against opposite-side active items; for qualifying matches, generates targeted match notifications delivered exclusively to the item founder and the lost item reporter (`recipient: user._id`). Returns created item, strictly omitting `contact` and `privateAnswerHash`.
- `GET /api/items/mine`: Requires JWT auth header. Queries items where `owner = req.user._id`, ordered newest first. Strictly excludes `contact` and `privateAnswerHash`.
- `GET /api/items/:id`: Returns single item details, strictly omitting `contact` and `privateAnswerHash`. Includes `privateQuestion` if configured. Includes `owner` (`_id`, `email`).
- `GET /api/items/:id/matches`: Implements `prd.md > Explainable Top-3 Matching`. Queries opposite-side active items, runs scoring algorithm, returns top 3 items meeting qualification rule and score ≥ 25.
- `POST /api/items/:id/reveal-contact`: Requires JWT auth header. If item has a `privateQuestion`, requires `{ answer }` in request body. Validates trimmed lowercased SHA-256 hash. Allows max 3 failed attempts before a 5-minute lockout (HTTP 429). On success (or if no private question), returns `{ contact: item.contact }`.
- `PATCH /api/items/:id/return`: Requires JWT auth header. Allowed ONLY if `item.owner.equals(req.user._id)`; returns HTTP 403 Forbidden otherwise. Sets `status: 'returned'`. Automatically marks all associated notifications (`item` or `matchedItem`) as resolved (`isResolved: true`) and adds user to `readBy`, immediately decrementing active unread notification counts on both guest and user dashboards.
- `GET /api/notifications`: Optional JWT auth. If authenticated, returns ONLY notifications and candidate matches belonging to the current user (`recipient: req.user._id`). If guest, returns all campus upload announcements (`recipient: null`). Calculates `unreadCount` strictly based on active unreturned items.
- `PATCH /api/notifications/:id/read`: Optional JWT auth. Marks single notification as read by adding user to `readBy`.
- `POST /api/notifications/read-all`: Optional JWT auth. Marks all notifications as read for current user.

## Explainable Matching Engine & Scoring Specification

### 1. Candidate Qualification Rule
To qualify as a valid match, an opposite-side active item must satisfy:
1. **(Same Category OR at least 2 matching factors)** AND
2. **Total Score ≥ 25**

### 2. Scoring Table

| Match Factor | Points | Evaluation Rule & Reason Chip Text |
|---|---|---|
| **Same Category** | `40` | `item.category === candidate.category` AND `category !== 'other'`<br>Chip: `"Same category"` |
| **Same Color** | `25` | `item.color === candidate.color` AND `color !== 'other'`<br>Chip: `"Same color"` |
| **Shared Description Keywords** | `8` or `15` | Description words extracted, lowercased, stripped of punctuation, excluding stopwords, category words, and color words.<br>- 1 shared word = `8 points`<br>- 2+ shared words = `15 points`<br>Chip: `"X shared keywords: word1, word2"` |
| **Location Word Overlap** | `10` | Non-stopword match between `item.location` and `candidate.location`.<br>Chip: `"Same location area"` |
| **Close Date** | `10` | `abs(item.date - candidate.date) <= 3 days`<br>Chip: `"Close date"` |

*Maximum Possible Score:* 100 points.

### 3. Stopword and Excluded Vocabulary Lists
- **Category words excluded from keywords:** `bag`, `phone`, `bottle`, `umbrella`, `laptop`, `book`, `other`
- **Color words excluded from keywords:** `black`, `white`, `grey`, `gray`, `red`, `blue`, `green`, `yellow`, `brown`, `other`
- **Standard English stopwords excluded:** `a`, `an`, `the`, `and`, `or`, `in`, `on`, `at`, `to`, `for`, `with`, `by`, `from`, `of`, `my`, `is`, `it`, `was`, `this`, `that`
- **Location stopwords excluded:** `floor`, `block`, `building`, `room`, `desk`, `near`, `gate`, `hall`, `area`, `dept`, `department`, `ground`, `first`, `second`, `third`, `1st`, `2nd`, `3rd`, and all numeric digits (`0-9`).

### 4. Qualitative Match Tiers
- **Strong match:** `Score ≥ 70`
- **Good match:** `Score 55 – 69`
- **Possible match:** `Score 25 – 54`
- Items with `Score < 25` or failing the qualification rule are excluded. Ties are sorted newest first.

### 5. Unit Test Suite for Matching Engine
Backend unit test file `backend/tests/matcher.test.js` verifying:
1. Perfect match (same category, color, keywords, location, date) yields 100 points and "Strong match".
2. Category match only (40 pts) qualifies as "Possible match" with single chip `"Same category"`.
3. Different category with 2 matching factors (e.g. Color 25 + Close Date 10 = 35 pts) qualifies as "Possible match".
4. Different category with only 1 factor (e.g. only Color 25 pts) is rejected by PRD rule.
5. Items with `'other'` category or color earn 0 points for those attributes.
6. Stopword filtering properly ignores generic terms like "near", "desk", "blue", "bottle" in descriptions and locations.

## Computer Vision Mapping & Color Classification Specification

### 1. YOLOv8 Class Mapping to App Categories Table

| YOLOv8 COCO Label | App Category | Rationale |
|---|---|---|
| `backpack`, `handbag`, `suitcase` | `bag` | Primary campus carry items |
| `cell phone` | `phone` | Standard smartphone detection |
| `bottle` | `bottle` | Water bottles and beverage flasks |
| `umbrella` | `umbrella` | Personal umbrellas |
| `laptop` | `laptop` | Laptops and notebooks |
| `book` | `book` | Textbooks and notebooks |
| *All other COCO classes* (or confidence < 0.35) | `other` | Clean fallback for unrecognized objects |

### 2. OpenCV HSV Color Classification & Majority Vote
- Bounding box crop extracted from detection (if no box detected, default to center 50% box of image).
- Convert BGR to HSV color space.
- Per-pixel classification into the 8 core colors:
  - `black`: `Value < 45`
  - `white`: `Saturation < 35` and `Value > 190`
  - `grey`: `Saturation < 40` and `45 ≤ Value ≤ 190`
  - `red`: `(Hue < 10 or Hue > 165)` and `Saturation ≥ 40` and `Value ≥ 45`
  - `yellow`: `18 ≤ Hue < 35` and `Saturation ≥ 40` and `Value ≥ 45`
  - `green`: `35 ≤ Hue < 85` and `Saturation ≥ 40` and `Value ≥ 45`
  - `blue`: `85 ≤ Hue < 135` and `Saturation ≥ 40` and `Value ≥ 45`
  - `brown`: `10 ≤ Hue < 25` and `Saturation ≥ 40` and `45 ≤ Value < 140`
- Count classified pixels; the category with highest frequency wins (majority vote). If ambiguous, returns `"other"`.

## Data Model

### MongoDB User Schema (`backend/src/models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  }
}, { timestamps: true });
```

### MongoDB Item Schema (`backend/src/models/Item.js`)
```javascript
const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], required: true },
  category: { 
    type: String, 
    enum: [
      'bag', 'phone', 'bottle', 'umbrella', 'laptop', 'book',
      'headphone', 'earbuds', 'airphone', 'earphone', 'hearphone', 'other'
    ], 
    required: true 
  },
  color: { 
    type: String, 
    enum: ['black', 'white', 'grey', 'red', 'blue', 'green', 'yellow', 'brown', 'other'], 
    required: true 
  },
  description: { type: String, default: '' },
  location: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  imageUrl: { type: String, required: true },
  contact: { type: String, required: true }, // Strictly excluded from list and detail API responses
  currentLocation: { type: String, default: '' }, // For found items
  status: { type: String, enum: ['active', 'returned'], default: 'active' },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Private ownership verification challenge (found items)
  privateQuestion: { type: String, default: '' },
  privateAnswerHash: { type: String, default: null, select: false },
  verificationAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date, default: null }
}, { timestamps: true });
```

### MongoDB Notification Schema (`backend/src/models/Notification.js`)
```javascript
const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['broadcast', 'match', 'report'],
    default: 'broadcast'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null indicates a public broadcast for visitors before login
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  matchedItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  matchScore: { type: Number, default: 0 },
  matchTier: { type: String, default: null },
  isResolved: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
```

### Seed Data Specification (`backend/src/seeds/seed.js`)
Creates two demo user accounts:
- `alice@campus.edu` (demo password: `demopassword123`)
- `bob@campus.edu` (demo password: `demopassword123`)

Pre-populates 5 items associated with these demo owners:
1. **Found Blue Backpack:** (`found`, `bag`, `blue`, description: *"Waterproof nylon backpack with black zip and padded straps"*, location: *"Library 2nd floor desk"*, owner: Alice, `active`)
2. **Lost Black Water Bottle:** (`lost`, `bottle`, `black`, description: *"Stainless steel insulated flask with sports cap"*, location: *"Canteen sports ground"*, owner: Bob, `active`)
3. **Lost Grey Phone:** (`lost`, `phone`, `grey`, description: *"Grey case with cracked screen protector"*, location: *"CS Block Lab 3"*, owner: Alice, `active`)
4. **Found Red Umbrella:** (`found`, `umbrella`, `red`, description: *"Compact folding umbrella with wooden handle"*, location: *"Main Gate security"*, owner: Bob, `active`)
5. **Returned Blue Bag:** (`lost`, `bag`, `blue`, description: *"Small blue canvas tote bag"*, location: *"Auditorium foyer"*, owner: Alice, `returned`)

## File Structure
```
campus-lost-found/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB connection
│   │   │   └── jwt.js                # Fail-fast JWT secret configuration
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT auth verification middleware
│   │   ├── models/
│   │   │   ├── Item.js               # Mongoose Item schema (with owner ref)
│   │   │   ├── Notification.js       # Mongoose Notification schema (broadcast & match)
│   │   │   └── User.js               # Mongoose User schema (email, passwordHash)
│   │   ├── routes/
│   │   │   ├── auth.js               # POST /register, POST /login, GET /me
│   │   │   ├── detect.js             # Express proxy to Flask (POST /api/detect)
│   │   │   ├── items.js              # CRUD, matches, contact reveal, return, mine
│   │   │   └── notifications.js      # Notifications query & resolution sync
│   │   ├── services/
│   │   │   └── matcher.js            # Deterministic scoring & reason generation
│   │   ├── seeds/
│   │   │   └── seed.js               # Demo users, sample items & notifications seed
│   │   └── index.js                  # Express app entry & static /uploads serving
│   ├── tests/
│   │   ├── api.test.js               # API lifecycle & contact privacy tests
│   │   ├── auth.test.js              # Auth, ownership & route protection tests
│   │   ├── matcher.test.js           # Scoring engine unit tests
│   │   └── notifications.test.js     # Campus broadcast, match alerts & return sync tests
│   ├── uploads/                      # Committed seed photos & local uploads
│   ├── package.json
│   └── .env.example
├── cv-service/
│   ├── app.py                        # Flask server (POST /detect)
│   ├── detector.py                   # YOLOv8 category inference
│   ├── color.py                      # OpenCV HSV color extraction & mapping
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Header, brand, links, search, avatar & drawer
│   │   │   ├── NotificationDropdown.jsx # Navbar notification popover
│   │   │   ├── Footer.jsx            # Persistent footer with navigation and links
│   │   │   ├── RouteGuards.jsx       # GuestRoute, ProtectedRoute, LoadingSpinner
│   │   │   ├── FilterBar.jsx         # Type, Category, Status pill controls
│   │   │   ├── ItemCard.jsx          # Feed card
│   │   │   ├── FeedGrid.jsx          # Responsive card grid & empty state
│   │   │   ├── MatchCard.jsx         # Candidate card with reason chips
│   │   │   └── Modal.jsx             # Accessible popup modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Auth provider, token & user state
│   │   │   └── NotificationContext.jsx # Notification state & unread count
│   │   ├── pages/
│   │   │   ├── FeedPage.jsx          # Main feed & search
│   │   │   ├── ReportPage.jsx        # Reporting with CV auto-tagging
│   │   │   ├── DetailPage.jsx        # Redesigned item detail & matches panel
│   │   │   ├── ProfilePage.jsx       # User profile & my reported items
│   │   │   ├── AboutPage.jsx         # App overview & explainable AI guide
│   │   │   ├── LoginPage.jsx         # User login form
│   │   │   └── RegisterPage.jsx      # User registration form
│   │   ├── services/
│   │   │   └── api.js                # Axios client with Auth header injection
│   │   ├── App.jsx                   # Hash router, route definitions & guards
│   │   ├── main.jsx                  # React DOM root
│   │   └── index.css                 # Tailwind directives
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── README.md
└── devpost/
    ├── scope.md
    ├── prd.md
    ├── spec.md
    ├── checklist.md
    └── app-map.html
```

## What Was Simplified and Why
- **Express Proxy for CV Detection** instead of direct browser-to-Flask communication — eliminates cross-origin setup issues and keeps ML endpoints private behind backend API boundaries.
- **Local Filesystem Image Storage (`/uploads`)** instead of AWS S3 or Cloudinary — eliminates cloud account creation and API credential management for an afternoon PoC.
- **Deterministic Heuristic Matching** instead of Vector Embeddings / Vector Databases — ensures complete explainability with human-readable reason chips, eliminates heavy embedding model overhead, and makes verification trivial via unit tests.
- **JWT Authentication with Local bcrypt Hashing** instead of complex OAuth or Campus SSO — provides real user ownership and secure item returns without external provider dependencies.
- **Hash-Based Routing with Route Guards** instead of full browser history server configuration — ensures seamless navigation on static hosts and local development servers without route 404s.

## Decisions and Open Issues
- **Learner Decisions Recorded:**
  - Explicit build order: Backend -> Matcher & Tests -> Frontend Manual-First -> Flask CV Enhancement -> User Accounts -> Navigation & Detail Redesign -> Documentation Synchronization.
  - Express proxy pattern for `POST /api/detect` with 3-second timeout, in-memory validation, and zero disk writes on preview.
  - Strict privacy guard: `contact` is never returned in `GET /api/items` or `GET /api/items/:id`.
  - Candidate qualification: same category OR ≥2 reasons, plus score ≥ 25.
  - Description keywords: exclude stopwords, category words, and color words; 1 word = 8 pts, 2+ words = 15 pts.
  - Location matching: stopword filtering for campus terms ("floor", "desk", "block", digits).
  - Match tiers: Strong ≥ 70, Good 55–69, Possible 25–54.
  - Color extraction: HSV bounding box crop with center crop fallback and explicit off-palette hue mapping.
  - Seed script: 5 small real images including 1 returned item, with 2 shared keywords ("zip", "straps") for demo predictability.
  - Pre-download instruction for `yolov8n.pt`.
- **Open Issues:** None. Ready to ship!
