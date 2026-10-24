---
doc: spec
status: approved
---

# Campus Lost & Found — Technical Spec

## How This Works, In Plain Language
Campus Lost & Found is built as a modular 3-tier architecture with an asynchronous AI enhancement layer:
1. **Frontend (React + Tailwind CSS):** A responsive single-page web app built with Vite. It renders the feed, handles client-side filtering, presents the posting form with instant image preview, and displays item details with explainable match cards.
2. **Backend API (Node/Express + MongoDB):** The core application hub. It manages CRUD operations, handles image uploads to a local `/uploads` directory, serves items while strictly stripping sensitive contact information from all feed and detail responses, exposes a separate endpoint to reveal poster contacts, and executes a deterministic, rule-based matching algorithm with human-readable reason chips. It also acts as an internal proxy for image tag detection.
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
       ├─ (2) Select Photo Preview ──────────────→ [Express POST /api/detect]
       │                                                    │ (in-memory buffer, ≤5MB, 3s timeout)
       │                                                    ▼
       │                                            [Flask CV Service]
       │                                            - YOLOv8 category inference
       │                                            - OpenCV HSV color extraction
       │   ← Returns { category, color } ───────────────────┘
       │     (or { category: "other", color: null } on error)
       │
       ├─ (3) Submit POST /api/items (multipart) ─→ [Express API]
       │                                            - Validates photo (≤5MB, image/*)
       │                                            - Saves photo to ./uploads/<uuid>
       │                                            - Writes item doc to MongoDB
       │   ← Redirect to /items/:id ────────────────┘
       │
       ├─ (4) GET /api/items/:id ─────────────────→ [Express API]
       │   ← Returns item details (WITHOUT contact) ┘
       │
       ├─ (5) GET /api/items/:id/matches ─────────→ [Express API]
       │                                            - Queries active opposite-type items
       │                                            - Runs scoring engine & reason rules
       │                                            - Filters: PRD rule AND score ≥ 25
       │   ← Returns top 3 matches with reasons ────┘
       │
       └─ (6) POST /api/items/:id/reveal-contact ─→ [Express API]
           ← Returns { contact: "email/phone" } ────┘
```

## Stack
- **Frontend:** React 18 / 19, Vite (plain JavaScript/JSX), Tailwind CSS v3/v4, Lucide-React.
  - *Rationale:* Fast development server, lightweight bundle, zero TypeScript compilation overhead for quick prototyping, utility-first styling for clean campus design.
  - *Docs:* [Vite Docs](https://vitejs.dev/), [React Docs](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend API:** Node.js (v18+), Express, Mongoose, Multer.
  - *Rationale:* High-performance asynchronous I/O, straightforward schema validation with Mongoose, standard multipart handling via Multer.
  - *Docs:* [Express](https://expressjs.com/), [Mongoose](https://mongoosejs.com/), [Multer](https://github.com/expressjs/multer)
- **Database:** MongoDB (local Community Server or Dockerized container).
  - *Rationale:* Document store fits flexible lost/found item schemas with nested attributes and dynamic match tags.
  - *Docs:* [MongoDB](https://www.mongodb.com/docs/)
- **CV Microservice:** Python 3.10+, Flask, Ultralytics YOLOv8 (`yolov8n.pt`), OpenCV (`opencv-python-headless`), NumPy, Pillow.
  - *Rationale:* YOLOv8 nano is lightweight and runs locally on CPU in <200ms; OpenCV provides deterministic color classification.
  - *Docs:* [Ultralytics YOLOv8](https://docs.ultralytics.com/), [OpenCV](https://docs.opencv.org/)
- **Testing:** Node.js native test runner (`node --test`) or Jest for backend scoring engine unit tests.
- **Orchestration:** Docker Compose (as final convenience layer).

## Phased Build Order
The implementation follows a strict manual-first, incremental sequence:
1. **Phase 1: Backend Foundation & Persistence**
   - Express server setup, MongoDB connection, Mongoose `Item` model.
   - Multer upload configuration with file validation (images only, max 5 MB).
   - CRUD routes (`POST /api/items`, `GET /api/items`, `GET /api/items/:id`, `PATCH /api/items/:id/return`).
   - Projection guard: strictly exclude `contact` from list and detail responses.
   - Separate contact reveal route (`POST /api/items/:id/reveal-contact`).
2. **Phase 2: Explainable Matcher Engine & Seed Script**
   - Pure scoring function `matcher.js` implementing the 100-point formula and qualification rules.
   - Comprehensive unit test suite `backend/tests/matcher.test.js` validating all rules and edge cases.
   - Endpoint `GET /api/items/:id/matches` returning top 3 qualified candidates with reason chips.
   - Database seed script `seed.js` creating 5 real sample items (4 active + 1 returned) with local images.
3. **Phase 3: React Frontend (Manual-First Baseline)**
   - Vite + Tailwind setup with clean campus design system and light theme.
   - Feed page (`/`) with responsive cards and Type/Category/Status filters.
   - Report page (`/report`) with image upload preview and always-visible, fully editable dropdowns.
   - Item detail page (`/items/:id`) with Top Matches panel, click-to-reveal contact, and "Mark as returned" modal.
   - *Milestone Check:* Complete manual-first application verified end-to-end on localhost.
4. **Phase 4: Flask CV Microservice & Express Proxy**
   - Flask server setup with YOLOv8 category detection and OpenCV HSV dominant color extraction.
   - Pre-download `yolov8n.pt` into `cv-service/`.
   - Express proxy `POST /api/detect` with in-memory upload handling and 3-second timeout fallback.
   - Frontend auto-tagging integration with "Suggested automatically. Please check" indicator.
5. **Phase 5: Docker Compose & Ship Preparation**
   - Root `docker-compose.yml` orchestrating MongoDB, Flask, Express, and React.
   - Rehearsal of the 1-minute demo flow and documentation update.

## Where It Runs and How Someone Tries It
- **Runtime Environment:** Windows / macOS / Linux with Node.js v18+, Python 3.10+, and MongoDB.

### Baseline Local Startup (Without Docker)
1. **MongoDB:** Start local MongoDB instance on port `27017` (`mongod`).
2. **Flask CV Service:**
   ```bash
   cd cv-service
   python -m venv venv
   ./venv/Scripts/activate  # on Windows (or source venv/bin/activate on macOS/Linux)
   pip install -r requirements.txt
   # Pre-download YOLOv8 nano model weights into cv-service/
   python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
   python app.py
   # Runs on http://localhost:5001
   ```
3. **Backend API & Seeding:**
   ```bash
   cd backend
   npm install
   npm run seed    # Seeds 5 items (4 active + 1 returned)
   npm test        # Runs matcher unit tests
   npm run dev     # Runs on http://localhost:5000
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
  ```
- **`frontend/.env.example`:**
  ```env
  VITE_API_URL=http://localhost:5000/api
  ```
- **`.gitignore` Rules (Updated at Project Root):**
  ```gitignore
  # Node & Python dependencies
  node_modules/
  venv/
  __pycache__/
  *.pyc

  # Build outputs
  frontend/dist/
  
  # Uploaded image files (preserve directory with placeholder)
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
  - Primary Accent: `#4338ca` (links, primary buttons, active filter pills)
  - "Lost" Badge: Text `#d97706`, Background `#fef3c7`
  - "Found" Badge: Text `#0d9488`, Background `#ccfbf1`
  - "Returned" Badge: Text `#6b7280`, Background `#f3f4f6`
  - Match Tiers: Strong `#16a34a`, Good `#2563eb`, Possible `#64748b`
  - Reason Chips: Text `#0369a1`, Background `#e0f2fe`
  - Body Text: `#0f172a`, Secondary Metadata: `#64748b`
- **Typography:** Sans-serif (Inter with system fallbacks).
- **Cards & Shapes:** Rounded corners (`rounded-xl`), soft borders (`border border-slate-200`), consistent 4:3 aspect ratio thumbnails, accessible contrast.

## Components

### Frontend Components (`frontend/src/`)
Implements `prd.md > Screens and Layout`.

- `Navbar.jsx`: Implements `prd.md > 1. Main Feed`. Displays branding and dual action buttons ("I lost something", "I found something").
- `FilterBar.jsx`: Implements `prd.md > Item Feed & Filtering`. Controls Type, Category, and Status pills.
- `ItemCard.jsx`: Implements `prd.md > Cards Grid`. Renders thumbnail, badges, tags, truncated description, date, and location. Contact info is strictly excluded.
- `FeedGrid.jsx`: Implements `prd.md > Empty State` and responsive grid layout (1 col mobile, 2-3 col desktop).
- `ReportForm.jsx`: Implements `prd.md > 2. Report Item Page`. Handles photo select, preview, async call to `/api/detect`, manual-first dropdowns, validation, and submission.
- `ItemDetail.jsx`: Implements `prd.md > 3. Item Detail & Match Page`. Displays full details, contact reveal trigger, "Mark as returned" modal, and the Top Matches panel.
- `MatchCard.jsx`: Implements `prd.md > Explainable Top-3 Matching`. Displays match tier badge, score breakdown, applied reason chips, and links to candidate item.

### Backend Endpoints (`backend/src/routes/`)
Implements `prd.md > Features and Behavior`.

- `POST /api/detect`: Implements `prd.md > Manual-First Reporting & AI Auto-Tagging`. Uses in-memory Multer storage (`multer.memoryStorage()`) with strict limits (images only, max 5 MB). Forwards file buffer to Flask `POST http://localhost:5001/detect` with a 3-second timeout. Returns `{ category, color }` without writing to disk.
- `GET /api/items`: Implements `prd.md > Item Feed & Filtering`. Filters by `type`, `category`, `status`. Uses Mongoose `.select('-contact')` to strictly omit contact details.
- `POST /api/items`: Implements `prd.md > 2. Report Item Page`. Disk Multer storage validates image (≤5MB, mimetype `image/*`), writes to `./uploads/`, inserts document.
- `GET /api/items/:id`: Returns single item details, strictly omitting `contact` (`.select('-contact')`).
- `GET /api/items/:id/matches`: Implements `prd.md > Explainable Top-3 Matching`. Queries opposite-side active items, runs scoring algorithm, returns top 3 items meeting qualification rule and score ≥ 25.
- `POST /api/items/:id/reveal-contact`: Implements `prd.md > Privacy-Preserving Contact & Resolution`. Returns `{ contact: item.contact }`.
- `PATCH /api/items/:id/return`: Implements `prd.md > Privacy-Preserving Contact & Resolution`. Sets `status: 'returned'`.

### Flask CV Microservice (`cv-service/`)
- `POST /detect`: Accepts multipart file `image`. Runs YOLOv8 inference. If detected, extracts bounding box; otherwise uses center crop (middle 50% width/height). Converts crop to HSV and applies pixel classification. Returns JSON `{ category: string, color: string }`.

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
- **Off-Palette Hue Mapping:**
  - *Orange (`10 ≤ Hue < 18`):* Maps to `red` (if dark/brown) or `yellow` (if bright).
  - *Purple / Violet (`135 ≤ Hue < 155`):* Maps to `blue` or `red`.
  - *Pink (`155 ≤ Hue < 165`):* Maps to `red`.
  - *Beige / Tan:* Low saturation with moderate/high value maps to `white` or `brown`.
- Count classified pixels; the category with highest frequency wins (majority vote). If ambiguous, returns `"other"`.

## Data Model

### MongoDB Item Schema (`backend/src/models/Item.js`)
```javascript
const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], required: true },
  category: { 
    type: String, 
    enum: ['bag', 'phone', 'bottle', 'umbrella', 'laptop', 'book', 'other'], 
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
  status: { type: String, enum: ['active', 'returned'], default: 'active' }
}, { timestamps: true });
```

### Seed Data Specification (`backend/src/seeds/seed.js`)
Pre-populates 5 items with small real sample images:
1. **Found Blue Backpack:** (`found`, `bag`, `blue`, description: *"Waterproof nylon backpack with black zip and padded straps"*, location: *"Library 2nd floor desk"*, `active`)
2. **Lost Black Water Bottle:** (`lost`, `bottle`, `black`, description: *"Stainless steel insulated flask with sports cap"*, location: *"Canteen sports ground"*, `active`)
3. **Lost Grey Phone:** (`lost`, `phone`, `grey`, description: *"Grey case with cracked screen protector"*, location: *"CS Block Lab 3"*, `active`)
4. **Found Red Umbrella:** (`found`, `umbrella`, `red`, description: *"Compact folding umbrella with wooden handle"*, location: *"Main Gate security"*, `active`)
5. **Returned Blue Bag:** (`lost`, `bag`, `blue`, description: *"Small blue canvas tote bag"*, location: *"Auditorium foyer"*, `returned`)

*Demo Keyword Pair:* The seeded Found Blue Backpack and the newly posted Lost Backpack share two explicit non-stopword keywords: `"zip"` and `"straps"`, guaranteeing an exact demonstrable reason chip (`"2 shared keywords: zip, straps"`).

## File Structure
```
campus-lost-found/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection
│   │   ├── models/
│   │   │   └── Item.js               # Mongoose schema
│   │   ├── routes/
│   │   │   ├── detect.js             # Express proxy to Flask (POST /api/detect)
│   │   │   └── items.js              # CRUD, matches, contact reveal, return
│   │   ├── services/
│   │   │   └── matcher.js            # Deterministic scoring & reason generation
│   │   ├── seeds/
│   │   │   └── seed.js               # 5-item seed script with real sample images
│   │   └── index.js                  # Express app entry & static /uploads serving
│   ├── tests/
│   │   └── matcher.test.js           # Scoring engine unit tests
│   ├── uploads/                      # Local uploaded image files
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
│   │   │   ├── Navbar.jsx            # Header & post buttons
│   │   │   ├── FilterBar.jsx         # Type/category/status filters
│   │   │   ├── ItemCard.jsx          # Feed item card
│   │   │   ├── MatchCard.jsx         # Item detail match card with chips
│   │   │   └── Modal.jsx             # Confirmation dialogs
│   │   ├── pages/
│   │   │   ├── FeedPage.jsx          # Main home view (/)
│   │   │   ├── ReportPage.jsx        # Post creation view (/report)
│   │   │   └── DetailPage.jsx        # Item details and matches (/items/:id)
│   │   ├── services/
│   │   │   └── api.js                # Axios API client
│   │   ├── App.jsx                   # Router setup
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── devpost/
│   ├── learner-profile.md
│   ├── scope.md
│   ├── prd.md
│   └── spec.md
├── docker-compose.yml
├── .gitignore
└── README.md
```

## External Services and Dependencies
- **MongoDB Server:** Port `27017`. Zero cloud dependencies required for local run.
- **YOLOv8 Nano Weights:** `yolov8n.pt` pre-downloaded or cached in `cv-service/` (~6MB), runs entirely offline on CPU.
- **Node Modules & Python Packages:** Standard open-source libraries only; zero paid API keys or subscription services required.

## Important Failure Modes
1. **Flask CV Service Offline / Timeout:**
   - *Failure:* Flask is down or takes >3 seconds.
   - *Fallback:* Express catches the error/timeout and returns `{ category: 'other', color: null }`. Frontend displays no error banner; category dropdown remains on "other" and the user selects tags manually.
2. **Oversized or Non-Image Upload:**
   - *Failure:* User uploads a PDF or >5MB file.
   - *Fallback:* Multer memory/disk limits reject the file immediately with a red inline message: *"Please upload an image file (JPG, PNG, WebP) under 5 MB."* User's form inputs are preserved.
3. **No Opposite-Side Matches:**
   - *Failure:* No candidate items satisfy category/reasons or score ≥ 25.
   - *Fallback:* Right column renders the "No matches yet" placeholder with helpful advice to add more details.

## What Was Simplified and Why
- **Express Proxy for CV Detection** instead of direct browser-to-Flask communication — eliminates cross-origin setup issues and keeps ML endpoints private behind backend API boundaries.
- **Local Filesystem Image Storage (`/uploads`)** instead of AWS S3 or Cloudinary — eliminates cloud account creation and API credential management for an afternoon PoC.
- **Deterministic Heuristic Matching** instead of Vector Embeddings / Vector Databases — ensures complete explainability with human-readable reason chips, eliminates heavy embedding model overhead, and makes verification trivial via unit tests.
- **Separate Contact Reveal API** instead of User Accounts and Auth Tokens — achieves essential contact privacy from public feeds without adding login/session infrastructure.

## Decisions and Open Issues
- **Learner Decisions Recorded:**
  - Explicit build order: Backend -> Matcher & Tests -> Frontend Manual-First -> Flask CV Enhancement -> Docker Compose.
  - Express proxy pattern for `POST /api/detect` with 3-second timeout, in-memory validation, and zero disk writes on preview.
  - Strict privacy guard: `contact` is never returned in `GET /api/items` or `GET /api/items/:id`.
  - Candidate qualification: same category OR ≥2 reasons, plus score ≥ 25.
  - Description keywords: exclude stopwords, category words, and color words; 1 word = 8 pts, 2+ words = 15 pts.
  - Location matching: stopword filtering for campus terms ("floor", "desk", "block", digits).
  - Match tiers: Strong ≥ 70, Good 55–69, Possible 25–54.
  - Color extraction: HSV bounding box crop with center crop fallback and explicit off-palette hue mapping.
  - Seed script: 5 small real images including 1 returned item, with 2 shared keywords ("zip", "straps") for demo predictability.
  - Pre-download instruction for `yolov8n.pt`.
- **Open Issues:** None. Ready to build!
