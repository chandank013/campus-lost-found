---
doc: prd
status: approved
---

# Campus Lost & Found — Product Requirements

A streamlined, AI-assisted lost-and-found web application for college campuses that auto-tags uploaded item photos and surfaces top-3 explainable matches with plain-language reasons.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`.

## The Core Journey
1. **Arrival & Feed:** The student lands on the home feed. They see seeded active lost/found items arranged in a responsive grid, with filters at the top and prominent "I lost something" and "I found something" action buttons.
2. **Reporting an Item:** The user clicks either button and navigates to the Report page with the type pre-selected.
3. **Photo & Auto-Tagging:** The user uploads a photo (required, images only, ~5 MB max). An immediate preview displays. The Flask detector analyzes the image in the background; category and color dropdowns remain always visible and editable. If recognized, tags auto-fill with a subtle "Suggested automatically. Please check" label; if unrecognized or slow, category defaults to "other" with manual selection.
4. **Submission:** The user fills in category, color, description, location, date, required contact details (and "Where is the item now?" plus an optional private question/answer for found items), and submits. The system issues a one-time manage code displayed once for the poster to save.
5. **Payoff on Detail Page:** Upon saving, the user is redirected directly to the new item's detail page. The item is displayed alongside the "Top matches" panel, presenting up to 3 opposite-side active items that have the same category OR at least two matching reasons.
6. **Claim & Resolution:** A user clicks "Contact the poster" on a matching item. If the item has a private question, the claimant must answer it correctly (max 3 attempts before temporary lockout) to reveal contact info. Once resolved, the poster marks the item as returned by providing their one-time manage code, archiving the item from active matching.

## Screens and Layout

### 1. Main Feed (`/`)
- **Header:** App title "Campus Lost & Found", with primary action buttons "I lost something" and "I found something".
- **Filter Row:** 
  - Type: All / Lost / Found (default: All).
  - Category: All, bag, phone, bottle, umbrella, laptop, book, other (default: All).
  - Status: Active / Returned (default: Active).
- **Cards Grid:** 1 column on mobile, 2–3 columns on desktop, ordered newest first.
  - Card components: Photo thumbnail (consistent aspect ratio), Lost/Found badge (color-coded with explicit text), category & color tag pills, truncated 1–2 line description, location & date metadata, and status badge ("Active" / "Returned"). Contact info is strictly excluded.
- **Empty State:** When no items match the active filters, display "No items match these filters" with a "Clear filters" action button.

### 2. Report Item Page (`/report`)
- Top navigation link: "← Back to feed".
- Pre-set header: "Report Lost Item" or "Report Found Item".
- Form fields in vertical order:
  1. Photo upload input: Required, images only (JPG, PNG, WebP), max ~5 MB, with clear error message if empty or file is invalid/too large. Renders instant image preview.
  2. Category dropdown (`bag`, `phone`, `bottle`, `umbrella`, `laptop`, `book`, `other`) — Required.
  3. Color dropdown (`black`, `white`, `grey`, `red`, `blue`, `green`, `yellow`, `brown`, `other`) — Required.
  4. Description input (text area) with hint text: *"Add details that aren’t obvious from the photo, such as a sticker, a scratch, or what’s inside."*
  5. Location input (e.g., campus building/area) — Required.
  6. Date input (date picker defaulting to today, editable) — Required.
  7. Contact info input (email or phone) — Required, accompanied by privacy notice: *"Contact info is hidden from the feed and shown only when someone clicks Contact the poster."*
  8. Current custody input (*Found items only*): "Where is the item now?" (e.g., "Left at Library 2nd floor desk" or "With me, contact to claim") — Required for Found.
  9. Private verification question & answer (*Found items only, Optional*): "Set an ownership question only the true owner can answer" and "Expected answer (stored hashed, case-insensitive, never revealed publicly)".
- Submission payoff: On successful creation, a one-time manage code (e.g. `RET-XXXX`) is displayed once in a modal/banner with a copy button and a notice that it is required to mark the item as returned later.
- Inline validation errors display under empty or invalid required fields upon submit without resetting user input.

### 3. Item Detail & Match Page (`/items/:id`)
- Top navigation link: "← Back to feed".
- Desktop layout: 2 columns (Item Details on left, Top Matches on right). Mobile layout: vertically stacked.
- **Left Column (Item Details):** Full-size photo, Lost/Found badge, category & color tags, full description, location, date, status, and "Where it is now" (if found).
- **Action Area:** 
  - "Contact the poster" button: When clicked, if the item has a private question, prompts the claimant with the question in a challenge modal. Validates the answer via `/api/items/:id/reveal-contact`. Caps attempts at 3 before a 5-minute lockout. If correct (or if no private question was configured), reveals contact phone/email and a "Copy" button.
  - "Mark as returned" button: Prompts modal with an input for the item's one-time manage code. On submit with valid code, updates status to "Returned", disables further matching, and replaces action buttons with *"This item has been returned."* Requests without the valid code are rejected.
- **Right Column ("Top matches"):**
  - Up to 3 opposite-side active items ordered by match score.
  - **Match Qualification Rule:** An item is only qualified as a match if it shares the **same category** OR has **at least two matching reasons** (e.g., same color + shared keyword).
  - Match card contents: Thumbnail, Lost/Found badge, category/color tags, short description, location, date, confidence label ("Strong match" / "Good match" / "Possible match"), and plain-language reason chips.
  - **Location Reason Definition:** A match on location is triggered when a meaningful word (case-insensitive, ignoring common stopwords) is shared in the location text (e.g. "Library", "Canteen", "Hostel").
  - Clicking any match card opens that item's detail view.
  - **No Matches State:** Displays *"No matches yet. We’ll show likely matches here when someone posts a matching item. Check back later."* with a helpful tip suggesting the user add more descriptive details.

## Look and Feel
Source: `scope.md > Inspiration & Identity`.
- **Aesthetic:** Clean, friendly campus community board; trustworthy, uncluttered, similar to a modern university directory.
- **Theme:** Light mode only. White cards on a very light grey-blue background (`#f8fafc`).
- **Color Palette (Single Hex Values):**
  - Page Background: `#f8fafc`
  - Card Background: `#ffffff`
  - Card Border: `#e2e8f0`
  - Primary Accent: `#4338ca` (buttons, links, active filter pills)
  - "Lost" Badge: Background `#fef3c7`, Text `#d97706`
  - "Found" Badge: Background `#ccfbf1`, Text `#0d9488`
  - "Returned" Badge: Background `#f3f4f6`, Text `#6b7280`
  - Match "Strong match": `#16a34a`
  - Match "Good match": `#2563eb`
  - Match "Possible match": `#64748b`
  - Reason Chips: Background `#e0f2fe`, Text `#0369a1`
  - Body Text: `#0f172a`
  - Secondary / Metadata Text: `#64748b`
- **Typography:** Modern clean sans-serif (Inter with system fallback). Clear typographical hierarchy: bold page titles, medium semibold card titles, small secondary metadata.
- **Card & UI Shapes:** Rounded corners (`rounded-lg` / `rounded-xl`), soft shadows (`shadow-sm`), consistent photo aspect ratios (4:3), and tap-friendly touch targets.
- **Accessibility:** Color is never the sole indicator of meaning; explicit text labels accompany all badges and statuses. High contrast compliant text across all backgrounds.

## Features and Behavior

### Item Feed & Filtering
Source: `scope.md > The POC Boundary`.
- As a student, I want to filter campus items by Type, Category, and Status so that I can quickly check if my item was posted.
  - [ ] Feed updates instantly when filter pills are toggled.
  - [ ] Default view displays All types, All categories, Active status only.
  - [ ] Selecting "Returned" displays resolved items with muted grey indicators.
  - [ ] Display "No items match these filters" with "Clear filters" when results are empty.

### Manual-First Reporting & AI Auto-Tagging
Source: `scope.md > The Unique Kernel`.
- As a student posting an item, I want automatic tag suggestions without being blocked if the AI fails.
  - [ ] Photo upload is mandatory, restricted to images (JPG/PNG/WebP, max ~5 MB), with clear inline error if invalid.
  - [ ] Uploading an image renders an instant client-side preview.
  - [ ] Category and color dropdowns remain fully visible and selectable at all times.
  - [ ] Background call to CV service suggests category and color with a subtle "Suggested automatically. Please check" label.
  - [ ] If CV service times out or fails to recognize the item, category defaults to "other" without blocking the user.
  - [ ] Submitting required fields saves the post and navigates immediately to its detail page.

### Explainable Top-3 Matching
Source: `scope.md > The Unique Kernel`.
- As a student viewing an item, I want to see the top 3 opposite-side matches with clear reasons why they matched.
  - [ ] Shows up to 3 opposite-type (Lost vs. Found) items with `status: active`.
  - [ ] Requires same category OR at least two matching reasons to qualify as a match.
  - [ ] Displays human-readable reason chips for each match factor that applied (category, color, keywords, date, shared location word).
  - [ ] Displays a qualitative match tier badge: "Strong match", "Good match", or "Possible match".
  - [ ] Shows "No matches yet" placeholder when no opposite-side items meet the qualification rule.

### Privacy-Preserving Contact & Resolution
Source: `scope.md > Core Loop`, `scope.md > Known Limitations`.
- As a claimant, I want to reveal contact info and mark items as returned when resolved.
  - [ ] Feed and initial item payloads omit contact details.
  - [ ] If an item has a private question, `/api/items/:id/reveal-contact` requires the correct answer (trimmed, lowercased, validated against hash).
  - [ ] Enforces a maximum of 3 failed attempts per item, followed by a 5-minute lockout period.
  - [ ] Items without a private question reveal contact details directly upon request.
  - [ ] Clicking "Mark as returned" requires entering the item's one-time manage code.
  - [ ] On valid manage code confirmation, status updates to "Returned", the item is excluded from active matching feeds, and action buttons are replaced with a resolution notice.

## States and Boundaries
- **First Use / Seeded State:** The database starts pre-populated with:
  1. A found blue backpack (`bag`, `blue`, Active)
  2. A lost black water bottle (`bottle`, `black`, Active)
  3. A lost grey smartphone (`phone`, `grey`, Active)
  4. A found red umbrella (`umbrella`, `red`, Active)
  5. One resolved returned item (`bag` or `phone`, `returned`)
- **Empty Feed State:** Occurs when filters yield no matches; displays clear message and a reset button.
- **No Matches Detail State:** When an item has zero qualified opposite-type matches, shows an encouraging message suggesting more description details.
- **CV Offline / Error State:** If the Flask vision service is offline or takes too long, the UI displays no blocking error; dropdowns simply remain open for manual entry.
- **Returned State:** A returned item retains its detail URL but displays a muted "Returned" badge, excludes contact/return buttons, and does not appear in active match panels.

## Product Decisions
- **Photo Mandate & Size Limit:** Required image upload capped at ~5 MB prevents empty photo cards and server memory pressure while ensuring realistic CV inputs.
- **Match Qualification Threshold:** Requiring same category OR at least two matching reasons ensures random weak coincidences (e.g. only matching on "blue" across a phone and a bag) do not pollute top matches.
- **Location Word Matching:** Evaluates shared significant words in the location text (e.g., "Library", "Canteen") rather than brittle coordinate mapping.
- **Separate Report Page over Modal:** Selected a full page (`/report`) because image preview and detailed input fields benefit from vertical breathing room on both desktop and mobile.
- **Qualitative Match Tiers:** Displaying "Strong match" / "Good match" / "Possible match" alongside reason chips provides an intuitive, non-intimidating experience compared to an arbitrary percentage number.
- **Separate Contact Reveal API:** Kept contact info out of feed and item JSON payloads, requiring an explicit user click on the detail page to fetch contact details.
- **Manual-First AI Interaction:** Ensuring dropdowns are always visible and editable guarantees users are never stuck if the CV detector model struggles.

## What We're Building
- Single-page responsive React frontend with Feed, Report Form, and Item Detail with Top-3 Match view.
- Express API with CRUD endpoints, separate contact reveal endpoint, seed data script (5 items: 4 active across bag, bottle, phone, umbrella + 1 returned), and explainable heuristic matching logic.
- Lightweight Flask CV service (YOLOv8 + OpenCV) for image category and color inference.
- Local startup workflow with Docker Compose configuration as the final step.

## Deferred From the POC
- **Interactive Campus Map:** Real coordinates and pin drops deferred to keep the build focused on CV matching and explainable scoring.
- **Automated Notifications:** Email/SMS alerts deferred to avoid third-party messaging service dependencies.
- **Multimodal Embeddings:** Vector DB / CLIP embeddings deferred in favor of clear, explainable heuristic scoring.

## Non-Goals
- **Full User Accounts / Passwords:** No persistent user accounts, session tokens, or profile management; protection is handled via lightweight per-item manage codes and private question hashes.
- **In-App Messaging / Chat:** No live WebSocket chat; users coordinate pickup via disclosed email/phone.
- **Native Mobile Apps:** No iOS/Android builds; fully responsive mobile browser web app only.
- **Complex Multi-Stage Claim Arbitration:** No legalistic verification or campus admin adjudication; verification uses direct question challenges and physical confirmation.

## Open Questions
None. All product behaviors, threshold rules, and visual guidelines are approved.
