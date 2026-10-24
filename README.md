# Campus Lost & Found

An AI-enhanced campus lost-and-found web application built for the **Build With AI: Basics** hackathon.

Campus Lost & Found allows students and campus staff to report lost or found belongings with a photo. A lightweight computer vision microservice (YOLOv8 + OpenCV) automatically suggests the item's category and dominant color. The application features an explainable deterministic matching engine that calculates compatibility scores with transparent reason chips, while strictly preserving student privacy by keeping contact information hidden from public feeds.

---

## Demo Video

🎬 **[Watch the 1-Minute Demo Video](https://youtu.be/YOUR_DEMO_VIDEO_LINK)** *(Replace with your recording link)*

---

## Features

- **AI Photo Auto-Tagging:** Instant client-side preview; Express in-memory proxy forwards the photo to a Flask microservice running YOLOv8 nano and OpenCV HSV color extraction to suggest category and color tags.
- **Manual-First Fallback:** Dropdowns remain 100% editable at all times. If the CV service is offline or times out, the application falls back gracefully with zero error banners or form blockers.
- **Explainable Matching Engine:** Deterministic scoring algorithm surfaces top 3 opposite-side matches with clear reason chips (e.g., `"Same category"`, `"Same color"`, `"2 shared keywords: straps, zip"`, `"Same location area"`).
- **Privacy-Preserving Contact Reveal:** Contact phone/email is strictly excluded from list and detail payloads (`.select('-contact')`) and revealed only when a claimant clicks **"Contact the poster"**.
- **Single-Click Lifecycle Resolution:** Found or claimed items can be marked as returned directly from the item detail page without authentication overhead.
- **Responsive Filtering:** Filter the feed by report type (Lost / Found), category, and status (Active / Returned).

---

## How Matching Works

Candidates are selected from opposite-side active items (e.g. reporting a **Lost** item queries active **Found** items).

### 1. Qualification Rule
To qualify as a valid match, a candidate must satisfy:
1. **(Same Category OR at least 2 matching factors)** AND
2. **Total Match Score $\ge$ 25 points**

### 2. Scoring Table

| Match Factor | Points | Evaluation Rule & Reason Chip Text |
|---|---|---|
| **Same Category** | `40` | Item category matches candidate (`category !== 'other'`).<br>Chip: `"Same category"` |
| **Same Color** | `25` | Item color matches candidate (`color !== 'other'`).<br>Chip: `"Same color"` |
| **Shared Description Keywords** | `8` or `15` | Non-stopword, non-category, non-color words matching between descriptions.<br>- 1 shared keyword = `8 points`<br>- 2+ shared keywords = `15 points`<br>Chip: `"X shared keywords: word1, word2"` |
| **Location Area Match** | `10` | Shared location term (excluding campus stopwords like `floor`, `desk`, `building`, digits).<br>Chip: `"Same location area"` |
| **Close Date** | `10` | Report dates within 3 days of each other ($|date_1 - date_2| \le 3\text{ days}$).<br>Chip: `"Close date"` |

*Maximum Total Score:* `100 points`. Ties are broken by newest item first.

### 3. Qualitative Match Tiers
- 🟢 **Strong match:** Score $\ge 70$
- 🔵 **Good match:** Score $55 - 69$
- 🟡 **Possible match:** Score $25 - 54$

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide icons (100% Plain JavaScript / JSX).
- **Backend API:** Node.js, Express, Multer (in-memory & disk storage), Mongoose.
- **Database:** MongoDB Atlas (or local MongoDB).
- **Computer Vision Microservice:** Python 3.11+, Flask, Ultralytics YOLOv8 nano (`yolov8n.pt`), OpenCV (`opencv-python-headless`), Pillow, NumPy.
- **Testing:** Node.js native test runner (`node --test`), `mongodb-memory-server`.
- **Deployment & Orchestration:** Docker Compose, multi-stage Dockerfiles, Nginx Alpine reverse proxy.

---

## Project Structure

```
campus-lost-found/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MongoDB Mongoose connection
│   │   ├── models/Item.js        # Item schema & validation
│   │   ├── routes/
│   │   │   ├── detect.js         # In-memory proxy to Flask CV service
│   │   │   └── items.js          # CRUD, matches, contact reveal, return
│   │   ├── services/matcher.js   # Deterministic scoring algorithm
│   │   ├── seeds/seed.js         # Idempotent 5-item demo seed script
│   │   └── index.js              # Express app entry & static file serving
│   ├── tests/
│   │   ├── api.test.js           # API lifecycle & privacy tests
│   │   └── matcher.test.js       # Scoring engine unit tests
│   ├── uploads/                  # Committed seed photos & local uploads
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── cv-service/
│   ├── app.py                    # Flask server (:5001)
│   ├── detector.py               # YOLOv8 category inference
│   ├── color.py                  # OpenCV HSV majority-vote color extraction
│   ├── requirements.txt          # Pinned Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, FilterBar, ItemCard, MatchCard, Modal
│   │   ├── pages/                # FeedPage, ReportPage, DetailPage
│   │   ├── services/api.js       # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── nginx.conf                # Nginx proxy config for production build
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── devpost/                      # Planning artifacts & architectural guide
│   ├── scope.md                  # Project scope & boundaries
│   ├── prd.md                    # Product requirements & user journeys
│   ├── spec.md                   # Technical specification & scoring tables
│   ├── checklist.md              # Build verification checklist
│   └── app-map.html              # Standalone architectural tour & map
├── docker-compose.yml            # Multi-container orchestration
├── README.md
└── .gitignore
```

---

## Getting Started

### Prerequisites
- **Node.js:** version 18+ and npm
- **Python:** version 3.10+ (with `venv` module)
- **Git**
- **MongoDB:** MongoDB Atlas connection string (or local MongoDB running on `mongodb://localhost:27017`)

### 1. Clone the Repository
```bash
git clone https://github.com/chandank013/campus-lost-found.git
cd campus-lost-found
```

### 2. Configure Environment Variables
Copy the example environment file in `backend`:
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` with your MongoDB connection string:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campus_lost_found
FLASK_SERVICE_URL=http://localhost:5001
```
*(Return to project root: `cd ..`)*

---

### 3. Install & Run Services

#### Step A: Computer Vision Service (Flask)
Open a terminal in the project root:

```bash
cd cv-service

# Create virtual environment
python -m venv venv
```

**Activate the virtual environment:**
- **Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt):**
  ```cmd
  venv\Scripts\activate.bat
  ```
- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```

**Install dependencies and start Flask:**
```bash
pip install --extra-index-url https://download.pytorch.org/whl/cpu torch torchvision
pip install -r requirements.txt
python app.py
```
*Health check:* Visit `http://localhost:5001/health` &rarr; `{"service":"campus-lost-found-cv","status":"ok"}`.

---

#### Step B: Backend API (Express)
Open a second terminal in the project root:

```bash
cd backend
npm install
```

**Seed initial demo items:**
```bash
npm run seed
```
*Populates 5 sample items with verified keyword overlap (`"zip"`, `"straps"`) for demo predictability.*

**Start the Express backend:**
```bash
npm start
```
*Server listens on `http://localhost:5000`.*

---

#### Step C: Frontend (React + Vite)
Open a third terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```
*Web application opens at `http://localhost:5173`.*

---

## Running Tests

Automated tests run against an isolated in-memory MongoDB database (`mongodb-memory-server`) to ensure production/Atlas data is never modified.

Open a terminal in `backend`:
```bash
cd backend
npm test
```

**What is tested (15 test cases):**
- Item creation, storage, and feed retrieval with strict contact exclusion.
- Dedicated `/reveal-contact` endpoint functionality.
- Item status transition to `returned`.
- Proxy fallback when Flask CV service is unreachable.
- Scoring engine factor calculations (Category, Color, Keywords, Location, Date).
- Stopword filtering and PRD qualification rule enforcement.

---

## API Endpoints

### Backend API (`http://localhost:5000`)

| Method | Endpoint | Description | Privacy / Auth Note |
|---|---|---|---|
| `GET` | `/api/items` | Query items by `type`, `category`, `status` | Contact info strictly omitted |
| `POST` | `/api/items` | Report new item (multipart form with image) | Contact info omitted from response |
| `GET` | `/api/items/:id` | Get item details | Contact info strictly omitted |
| `GET` | `/api/items/:id/matches` | Get top-3 scored candidates with chips | Excludes contact info |
| `POST` | `/api/items/:id/reveal-contact` | Reveal contact details for an item | Returns `{ contact: string }` |
| `PATCH` | `/api/items/:id/return` | Mark item as returned | Updates item status |
| `POST` | `/api/detect` | In-memory tag suggestion proxy | Proxies to Flask with 4s timeout fallback |

### Flask Microservice (`http://localhost:5001`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status check |
| `POST` | `/detect` | Runs YOLOv8 inference & HSV dominant color extraction |

---

## Planning Documents

This project was built following a strict plan-first methodology under the **Build With AI: Basics** program:

- 📄 [`devpost/scope.md`](devpost/scope.md) — Initial scoping, feature boundary trimming, and core value proposition.
- 📋 [`devpost/prd.md`](devpost/prd.md) — Product requirements, screen states, and user journeys.
- 📐 [`devpost/spec.md`](devpost/spec.md) — Technical architecture, scoring matrix, and color classification rules.
- ✅ [`devpost/checklist.md`](devpost/checklist.md) — Incremental slice plan and mechanical verification history.
- 🗺️ [`devpost/app-map.html`](devpost/app-map.html) — Interactive standalone architectural guide and code tour.

---

## Known Limitations

1. **Object Detection Vocabulary:** YOLOv8 nano is trained on the standard COCO dataset. It accurately detects bags (`backpack`, `handbag`, `suitcase`), phones (`cell phone`), bottles, umbrellas, laptops, and books. Other items default to `"other"`, relying on manual dropdown selection.
2. **Lighting Sensitivity in Color Extraction:** HSV color classification uses majority vote on the bounding box. Extreme reflections, strong shadows, or complex multi-color patterns can lead to unexpected dominant color votes.
3. **No User Accounts / Authentication:** Deliberately scoped out for an afternoon proof of concept; contact info is protected by masking from public feeds rather than session logins.

---

## Future Work

- **Fine-Tuned Campus Weights:** Train YOLOv8 on custom campus items (student ID cards, campus access keys, dorm fobs).
- **Multi-Color Detection:** Support primary and secondary color combinations for patterned items.
- **Institutional SSO:** Connect university Single Sign-On (CAS / SAML / OAuth) for verified student identity.
- **In-App Custody Transfer Receipts:** Generate a cryptographic verification code for handoffs at campus security desks.

---

## Docker Status

All multi-container Docker configuration files are included in the repository:
- `backend/Dockerfile` (Node 20 Alpine)
- `cv-service/Dockerfile` (Python 3.11 Slim with OpenCV dependencies & model weights)
- `frontend/Dockerfile` (Multi-stage Vite build & Nginx Alpine reverse proxy)
- `frontend/nginx.conf` (Reverse proxy for `/api/` and `/uploads/`)
- `docker-compose.yml` (Orchestrates MongoDB, CV service, backend, and frontend)

*Verification Status:* All configuration files were validated with `docker compose config` (exit code `0`). Live execution via `docker compose up --build` was not tested during this session because the Windows host service `com.docker.service` requires elevated administrator privileges to launch. The stack is verified and running bare-metal across local ports `:5000`, `:5001`, and `:5173`.

---

## Sample Images & Licensing

All sample images included in `backend/uploads/` are freely licensed and sourced from **Wikimedia Commons**. In accordance with **CC BY-SA 4.0** and **CC0** attribution terms, creator credits, source links, license deeds, and adaptation notices are provided below:

| Local Filename | Wikimedia Source File | Author / Creator | License | Modifications |
|---|---|---|---|---|
| `sample-backpack.jpg` | [File:Jansport Backpack 3 2019-03-07.jpg](https://commons.wikimedia.org/wiki/File:Jansport_Backpack_3_2019-03-07.jpg) | [Fastily](https://commons.wikimedia.org/wiki/User_talk:Fastily) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Scaled & compressed for web display |
| `sample-backpack-red.jpg` | [File:Red and blue champion backpack.jpg](https://commons.wikimedia.org/wiki/File:Red_and_blue_champion_backpack.jpg) | [I AM GOING TO DRINK OCEAN WATER](https://commons.wikimedia.org/wiki/User:I_AM_GOING_TO_DRINK_OCEAN_WATER) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Scaled & compressed for web display |
| `sample-bottle.jpg` | [File:Metal Water Bottles.jpeg](https://commons.wikimedia.org/wiki/File:Metal_Water_Bottles.jpeg) | [Amraepowell](https://commons.wikimedia.org/wiki/User:Amraepowell) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Scaled & compressed for web display |
| `sample-phone.jpg` | [File:Mobile phone.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone.jpg) | [Pramodkumartk](https://commons.wikimedia.org/wiki/User:Pramodkumartk) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Scaled & compressed for web display |
| `sample-umbrella.jpg` | [File:Black Umbrella.jpg](https://commons.wikimedia.org/wiki/File:Black_Umbrella.jpg) | [Mohamed Hozyen](https://commons.wikimedia.org/wiki/User:Hozyen) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Scaled & compressed for web display |
| `sample-tote.jpg` | [File:Tote bag-making 17.jpg](https://commons.wikimedia.org/wiki/File:Tote_bag-making_17.jpg) | [Aminwa 21](https://commons.wikimedia.org/wiki/User:Aminwa_21) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Scaled & compressed for web display |
