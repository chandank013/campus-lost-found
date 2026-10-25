# Campus Lost & Found

An AI-enhanced campus lost-and-found web application built for the **Build With AI: Basics** hackathon.

Campus Lost & Found allows students and campus staff to report lost or found belongings with a photo. A lightweight computer vision microservice (YOLOv8 + OpenCV) automatically suggests the item's category and dominant color. The application features an explainable deterministic matching engine that calculates compatibility scores with transparent reason chips, while strictly preserving student privacy by keeping contact information hidden from public feeds.

---

## Demo Video

🎬 **[Watch the 1-Minute Demo Video](https://youtu.be/YOUR_DEMO_VIDEO_LINK)** *(Replace with your recording link)*

---

## Features

- **User Accounts & Authentication:** Secure email/password registration and login with bcrypt password hashing (10 salt rounds), rate-limited authentication endpoints, and 7-day JWT tokens.
- **User Profile & Post Management:** Items are linked directly to registered users. The "My Profile" dashboard (`#/profile`) displays account stats (total reports, active listings, returned count), tab filters (All/Active/Returned), and owner resolution controls.
- **Owner-Only Return Authorization:** Replacing fragile paper manage codes, marking an item returned (`PATCH /api/items/:id/return`) is strictly restricted to the authenticated item owner (non-owners receive HTTP 403 Forbidden).
- **AI Photo Auto-Tagging:** Instant client-side preview; Express in-memory proxy forwards the photo to a Flask microservice running YOLOv8 nano and OpenCV HSV color extraction to suggest category and color tags.
- **Manual-First Fallback:** Dropdowns remain 100% editable at all times. If the CV service is offline or times out, the application falls back gracefully with zero error banners or form blockers.
- **Explainable Matching Engine:** Deterministic scoring algorithm surfaces top 3 opposite-side matches with clear reason chips (e.g., `"Same category"`, `"Same color"`, `"2 shared keywords: straps, zip"`, `"Same location area"`).
- **Privacy-Preserving Contact Reveal:** Contact phone/email is strictly excluded from list and detail payloads (`.select('-contact -privateAnswerHash')`) and revealed only to authenticated users who click **"Contact the poster"**.
- **Private Ownership Verification Challenge:** Found item posters can set an optional ownership question. The answer is stored hashed (trimmed, lowercased, SHA-256) and never returned by any endpoint. Claimants must answer correctly (max 3 attempts per item before a 5-minute lockout) to reveal contact info.
- **Redesigned Item Detail Experience:** Modern two-column layout with overlaid type and status badges, image lightbox expand modal (`Maximize2`), custody information, royal blue contact reveal button, and a Top Likely Matches panel featuring candidate count badges and custom empty state illustrations (`MatchesEmptyIllustration`).
- **Global Navbar & Responsive Navigation:** Brand link on the left, Home, Report dropdown ("Report Lost Item" and "Report Found Item"), and About in the center ("Browse" link removed), desktop Search input, Login button or circular Profile avatar dropdown (email header, My Profile, Logout) on the right, plus responsive mobile drawer.
- **Route Guards & Safe Session Restore:** Client-side hash routing protected by `GuestRoute` (redirects logged-in users to home without history loops), `ProtectedRoute` (preserves intended destination upon login), and a loading spinner during session restore to prevent flashes.
- **Persistent Global Footer:** Footer across all pages with brand mission, navigation (Home, About, Contact Support), community reporting links, dynamic copyright year, and hackathon POC notice.

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

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide icons, Axios (100% Plain JavaScript / JSX).
- **Backend API:** Node.js, Express, bcrypt, jsonwebtoken (JWT), express-rate-limit, Multer, Mongoose.
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
│   │   ├── config/
│   │   │   ├── db.js             # MongoDB Mongoose connection
│   │   │   └── jwt.js            # Fail-fast JWT secret configuration
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT verification middleware
│   │   ├── models/
│   │   │   ├── Item.js           # Item schema (with owner reference)
│   │   │   └── User.js           # User schema (email, passwordHash)
│   │   ├── routes/
│   │   │   ├── auth.js           # Register, login, me endpoints
│   │   │   ├── detect.js         # In-memory proxy to Flask CV service
│   │   │   └── items.js          # CRUD, matches, contact reveal, return, mine
│   │   ├── services/matcher.js   # Deterministic scoring algorithm
│   │   ├── seeds/seed.js         # 2-user, 5-item demo seed script
│   │   └── index.js              # Express app entry & static file serving
│   ├── tests/
│   │   ├── api.test.js           # API lifecycle & contact privacy tests
│   │   ├── auth.test.js          # Auth, ownership & route protection tests
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
│   │   ├── components/           # Navbar, Footer, RouteGuards, FilterBar, ItemCard, MatchCard, Modal
│   │   ├── context/              # AuthContext (user, token, login, register, logout)
│   │   ├── pages/                # FeedPage, ReportPage, DetailPage, ProfilePage, AboutPage, LoginPage, RegisterPage
│   │   ├── services/api.js       # Axios API client with auth interceptor
│   │   ├── App.jsx               # Hash routing & route protection
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
Edit `backend/.env` with your MongoDB connection string and JWT secret:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campus_lost_found
FLASK_SERVICE_URL=http://localhost:5001
JWT_SECRET=your-jwt-secret-key-change-in-production
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

**Seed initial demo items and users:**
```bash
npm run seed
```
*Populates 5 sample items owned by 2 demo users, with verified keyword overlap (`"zip"`, `"straps"`) for demo predictability.*

> **Demo Accounts (Created by Seed Script — for demo and evaluation only):**
> - **Alice:** `alice@campus.edu` / `demopassword123` (owns seeded backpack, phone, tote)
> - **Bob:** `bob@campus.edu` / `demopassword123` (owns seeded water bottle, umbrella)

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

**What is tested (35 automated tests across 3 test suites):**
- **Authentication & Registration (15 tests):** User creation, duplicate email rejection, email formatting and 8-character password enforcement, rate limiting, and 7-day JWT issuance.
- **Login & Route Protection:** Valid credential login, invalid password rejection, and 401 Unauthorized enforcement across all protected endpoints.
- **Item Ownership & Returns:** Items tied to authenticated owner; "My posts" endpoint (`/api/items/mine`); owner-authorized returns (200 OK) and non-owner return rejection (403 Forbidden).
- **Contact Privacy & Verification Challenges (10 tests):** Contact strictly excluded from list/detail payloads; login required for contact reveal; private questions enforce 3-attempt limit and 5-minute lockout; verified answer reveals contact.
- **Security Protections:** Assertions confirming neither `passwordHash` nor `privateAnswerHash` is ever exposed in any response.
- **Matching Engine (7 tests):** Deterministic scoring factor calculations (Category, Color, Keywords, Location, Date), stopword filtering, and PRD qualification rule enforcement.
- **Computer Vision Fallback (3 tests):** Express proxy fallback when Flask CV microservice is unreachable.

---

## API Endpoints

### Backend API (`http://localhost:5000`)

| Method | Endpoint | Description | Privacy / Auth Note |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | Rate-limited; password min 8 chars; returns 7-day JWT |
| `POST` | `/api/auth/login` | Log in with email & password | Rate-limited; returns 7-day JWT |
| `GET` | `/api/auth/me` | Fetch current user profile | Requires `Bearer <token>`; never exposes `passwordHash` |
| `GET` | `/api/items` | Query public feed items | Contact info and internal hashes strictly omitted |
| `GET` | `/api/items/mine` | Query items reported by current user | Requires `Bearer <token>`; contact info omitted |
| `POST` | `/api/items` | Report new item with photo | Requires `Bearer <token>`; assigns owner; contact omitted |
| `GET` | `/api/items/:id` | Get item details | Contact info and internal hashes strictly omitted |
| `GET` | `/api/items/:id/matches` | Get top-3 scored candidates with chips | Excludes contact info and hashes |
| `POST` | `/api/items/:id/reveal-contact` | Reveal contact details for an item | Requires `Bearer <token>`; requires `{ answer }` if private question set |
| `PATCH` | `/api/items/:id/return` | Mark item as returned | Requires `Bearer <token>`; restricted to item owner (403 otherwise) |
| `POST` | `/api/detect` | In-memory tag suggestion proxy | Proxies to Flask with 3s timeout fallback |

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

1. **Token Storage in `localStorage`:** JWT tokens are stored in browser `localStorage` for development convenience. In high-security production environments, `HttpOnly` Secure cookies would be preferred.
2. **In-Memory Rate Limiting:** Authentication rate limiting uses in-memory express-rate-limit; in clustered deployments, a Redis-backed store would be required.
3. **No Password Reset / Email Verification:** User accounts use bcrypt and 7-day JWT tokens without email confirmation links, password reset workflows, or institutional SSO.
4. **Client-Side Notification Bell:** The navbar notification bell is a UI placeholder that displays an `alert()` and is not backed by a database notification queue.
5. **Client-Side Search:** The navbar search bar filters items within the client feed; there is no backend full-text search indexing endpoint.
6. **Object Detection Vocabulary:** YOLOv8 nano is trained on the COCO dataset. It recognizes standard campus items (bags, phones, bottles, umbrellas, laptops, books). Unrecognized items default to `"other"`, relying on manual dropdown selection.
7. **Lighting Sensitivity in Color Extraction:** HSV color classification uses majority vote on the bounding box. Extreme reflections, strong shadows, or complex multi-color patterns can lead to unexpected dominant color votes.
8. **Direct Contact Reveal on Lost Items:** While found items can be protected with private ownership challenges, lost items reveal contact to logged-in users without a challenge so finders can reach the owner quickly.
9. **Docker Execution Status:** All multi-container Docker configuration files are included in the repository and validated via `docker compose config`. However, live execution via `docker compose up --build` was not executed end-to-end on this host due to local OS administrator service permissions.

---

## Future work

This is a proof of concept. The following are **not implemented** in the current version. They are the planned next steps, and several of them depend on adding user accounts first.

**Recovery workflow (needs user accounts)**
- **Recovery case state machine:** turn a match into a tracked case with clear states (match found, verification pending, handover agreed, awaiting confirmation, recovered) and server-enforced transitions.
- **Dual confirmation and receipts:** both the finder and the owner confirm the handover separately, and a receipt is generated only after both confirm.
- **Proactive notifications:** alert an owner when a new found item matches their saved lost report, with de-duplication so the same match never alerts twice. This needs a way to know who the owner is.

**Campus operations**
- **Security dashboard:** a review queue for sensitive or disputed cases (for example ID cards, phones, and wallets), with staff notes and an audit trail.
- **Campus single sign-on:** login with college accounts, plus roles for students and staff.

**Smarter matching and assistance**
- **LLM recovery assistant:** rephrases the existing match reasons and explains the next step. It would only use structured facts from the app, would never claim an item is definitely the owner's, and would have a fallback when the service is unavailable.
- **Natural-language search:** queries such as "blue bottle with a white sticker" parsed into filters.
- **Image embeddings:** visual similarity as an extra candidate-finding signal, tested on sample images before being trusted.
- **Email alerts:** an optional second notification channel.

Similarity scores in this app suggest candidates and are not proof of ownership.

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
