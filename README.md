# Campus Lost & Found

An AI-enhanced campus lost-and-found web application built for the **Build With AI: Basics** hackathon. 

Campus Lost & Found allows students and staff to quickly report lost or found items with a photo. A lightweight computer vision microservice (YOLOv8 + OpenCV) automatically suggests the item's category and dominant color. The system uses an explainable deterministic matching algorithm to surface the top 3 matches with human-readable reason chips, while protecting student privacy by keeping contact info hidden until explicitly requested.

---

## Architecture

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide icons (100% Plain JavaScript / JSX, zero TypeScript).
- **Backend API:** Node.js, Express, Multer, Mongoose (MongoDB Atlas or local MongoDB).
- **Computer Vision Microservice:** Python 3.11+, Flask, Ultralytics YOLOv8 nano (`yolov8n.pt`), OpenCV HSV color classification.
- **Orchestration:** Multi-container `docker-compose.yml` linking MongoDB, Flask, Express, and React with Nginx reverse proxy.

---

## Local Run Steps on Windows (PowerShell)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (with `venv` module)
- MongoDB Atlas connection string (or local MongoDB running on `mongodb://localhost:27017`)

---

### Step 1: Start Computer Vision Service (Flask)

Open a PowerShell terminal:

```powershell
cd cv-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install CPU-only PyTorch and dependencies
pip install --extra-index-url https://download.pytorch.org/whl/cpu torch torchvision
pip install -r requirements.txt

# Start Flask CV service on port 5001
python app.py
```

*Verification:* Open `http://localhost:5001/health` in your browser. It should return `{"service":"campus-lost-found-cv","status":"ok"}`.

> **Note on Object Detection Scope:**  
> The detector uses YOLOv8 nano trained on the COCO dataset, mapped to common campus items: **bag** (`backpack`, `handbag`, `suitcase`), **phone** (`cell phone`), **bottle**, **umbrella**, **laptop**, and **book**. Unmapped or complex objects default gracefully to `"other"` with manual dropdown selection.

---

### Step 2: Start Backend API (Express)

Open a second PowerShell terminal:

```powershell
cd backend

# Install dependencies (use npm.cmd if PowerShell scripts are restricted)
npm.cmd install

# Configure environment variables
# Copy .env.example to .env and set your MONGO_URI
# Example: MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/campus_lost_found
```

#### Seed Demo Data:
Run the seed script to populate the database with 5 initial items:
```powershell
npm.cmd run seed
```
This resets the collection and creates 5 demo items (including a seeded Found Backpack that shares two exact keywords `"zip"` and `"straps"` with the test backpack for demo predictability).

#### Run Automated Tests:
```powershell
npm.cmd test
```
Runs 15 automated unit and integration tests against an isolated in-memory test database, validating CRUD endpoints, contact privacy masking, scoring thresholds, and the detect proxy fallback.

#### Start Express Server:
```powershell
npm.cmd start
```
*Verification:* Express listens on `http://localhost:5000`.

---

### Step 3: Start Frontend (React + Vite)

Open a third PowerShell terminal:

```powershell
cd frontend

# Install dependencies
npm.cmd install

# Start Vite dev server with proxy to backend (:5000)
npm.cmd run dev
```

*Verification:* Open `http://localhost:5173` in your browser to use the full application.

---

## 1-Minute Demo Walkthrough

1. Open `http://localhost:5173`.
2. Click **"I lost something"** to open the report form.
3. Select `backend/uploads/sample-backpack.jpg`.
4. Observe the AI auto-tagging fill **Category** (`bag`) and **Color** (`blue`) with the note: *"Suggested automatically. Please check."*
5. In the description, type: `Blue backpack with padded straps and black zip`. Location: `Library 2nd floor desk`. Enter contact info and submit.
6. On the detail page, view the **Strong match (100 pts)** against the seeded Found Backpack with reason chips:
   - `Same category`
   - `Same color`
   - `2 shared keywords: straps, zip`
   - `Same location area`
   - `Close date`
7. Click **"Contact the poster"** to reveal custody and contact info.
8. Click **"Mark as returned"** to complete the item lifecycle.

---

## Sample Images & Licensing

All sample images included in `backend/uploads/` are freely licensed and sourced from **Wikimedia Commons**:

| Local Filename | Wikimedia Commons File | License | Usage Terms |
|---|---|---|---|
| `sample-backpack.jpg` | [File:Jansport Backpack 3 2019-03-07.jpg](https://commons.wikimedia.org/wiki/File:Jansport_Backpack_3_2019-03-07.jpg) | **CC BY-SA 4.0** | Creative Commons Attribution-Share Alike 4.0 |
| `sample-backpack-red.jpg` | [File:Red and blue champion backpack.jpg](https://commons.wikimedia.org/wiki/File:Red_and_blue_champion_backpack.jpg) | **CC0** | Creative Commons Zero (Public Domain) |
| `sample-bottle.jpg` | [File:Metal Water Bottles.jpeg](https://commons.wikimedia.org/wiki/File:Metal_Water_Bottles.jpeg) | **CC0** | Creative Commons Zero (Public Domain) |
| `sample-phone.jpg` | [File:Mobile phone.jpg](https://commons.wikimedia.org/wiki/File:Mobile_phone.jpg) | **CC BY-SA 4.0** | Creative Commons Attribution-Share Alike 4.0 |
| `sample-umbrella.jpg` | [File:Black Umbrella.jpg](https://commons.wikimedia.org/wiki/File:Black_Umbrella.jpg) | **CC BY-SA 4.0** | Creative Commons Attribution-Share Alike 4.0 |
| `sample-tote.jpg` | [File:Tote bag-making 17.jpg](https://commons.wikimedia.org/wiki/File:Tote_bag-making_17.jpg) | **CC BY-SA 4.0** | Creative Commons Attribution-Share Alike 4.0 |

---

## Verification & Deployment Status

- **Bare-Metal Multi-Service Execution:** **100% Verified**. The frontend, Express backend, Flask CV microservice, and MongoDB Atlas database communicate seamlessly with sub-second tag detection and verified offline fallback.
- **Automated Tests:** **15/15 Tests Passing** covering scoring engine edge cases, category qualification rules, stopword filtering, contact privacy leaks, and detection fallbacks.
- **Docker Compose:** All container blueprints (`backend/Dockerfile`, `cv-service/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, and `docker-compose.yml`) are configured and syntactically validated via `docker compose config`.
  > **Note on Docker Live Build:** Live container build via `docker compose up --build` was not executed in this development session because the Windows Docker service (`com.docker.service`) requires elevated Administrator privileges to start on the host OS. The configuration files are complete and ready for execution in any standard Docker Desktop or Linux server environment.
