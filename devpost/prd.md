---
doc: prd
status: approved
---

# Campus Lost & Found — Product Requirements

A streamlined, AI-assisted lost-and-found web application for college campuses that auto-tags uploaded item photos and surfaces top-3 explainable matches with plain-language reasons.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`.

## The Core Journey
1. **Arrival & Feed:** The student lands on the home feed (`#/`). They see active lost/found items arranged in a responsive grid, with filters at the top and the global navbar. The navbar provides quick access to Home, a Report dropdown ("Report Lost Item" and "Report Found Item"), About, desktop Search, and authentication controls.
2. **Reporting an Item:** The user selects "Report Lost Item" or "Report Found Item" from the Report dropdown. If logged out, they are redirected to `#/login?redirect=...` and automatically returned to the report form upon authenticating.
3. **Photo & Auto-Tagging:** The user uploads a photo (required, images only, ~5 MB max). An immediate preview displays. The Flask detector analyzes the image in the background; category and color dropdowns remain always visible and editable. If recognized, tags auto-fill with a subtle "Suggested automatically. Please check" label; if unrecognized or slow, category defaults to "other" with manual selection.
4. **Submission:** The user fills in category, color, description, location, date, required contact details (and "Where is the item now?" plus an optional private question/answer for found items), and submits. The item is saved with the authenticated user set as owner.
5. **Payoff on Detail Page:** Upon saving, the user is redirected directly to the item's redesigned detail page (`#/items/:id`). The item is displayed in a modern two-column layout alongside the "Top Likely Matches" panel, presenting up to 3 opposite-side active items that share the same category OR have at least two matching factors.
6. **Claim & Resolution:** A logged-in claimant clicks "Contact the poster" on a matching item. If the item has a private question, the claimant must answer it correctly (max 3 attempts before temporary lockout) to reveal contact info. Once resolved, the item's owner clicks "Mark as returned" (available on the item detail page or on the "My Profile" page), which archives the item from active matching. Non-owners cannot mark an item returned.

## Screens and Layout

### 1. Main Feed (`#/`)
- **Global Header:**
  - Left: Graduation-cap icon and application name "Campus Lost & Found", linking to `#/`.
  - Center: "Home" link, "Report" dropdown (options: "Report Lost Item" and "Report Found Item"), and "About" link (`#/about`). Note: "Browse" is removed; the feed serves as the catalog.
  - Right (Logged out): Desktop Search input, interactive Notification bell icon with unread badge counter, and "Login" button (styled consistently with primary action buttons: deep indigo background, rounded corners, white text).
  - Right (Logged in): Desktop Search input, interactive Notification bell icon with real-time unread badge counter, followed by circular Profile avatar with a white Lucide `User` icon.
    - Notification Bell Popover: Toggles an accessible dropdown menu. Before login, displays all public campus upload broadcasts; after login, displays strictly the reports and candidate match alerts belonging to the authenticated owner. Features filter tabs ("All" and "Matches"), timestamps, active indicator dots, "✓ Returned" status badges, and direct click-to-view navigation. Unread count represents active unrecovered items and decrements strictly when an owner marks an item returned.
    - Profile Avatar Dropdown: Clicking toggles a menu with:
      - User email header: `Signed in as` with the user's email.
      - "My Profile" link navigating to `#/profile`.
      - "Logout" button that ends the session and returns the user to the feed.
      - Dropdown closes on click-outside, Escape key, or menu item selection, with visible focus styles and keyboard accessibility (`aria-haspopup`, `aria-expanded`).
  - Mobile: Responsive hamburger menu drawer containing Home, Report Lost/Found options, About, Search input, Notification bell with unread count badge, and appropriate auth controls.
- **Filter Row:**
  - Type: All / Lost / Found (default: All).
  - Category: All, bag, phone, bottle, umbrella, laptop, book, headphone, earbuds, airphone, other (default: All).
  - Status: Active / Returned (default: Active).
- **Cards Grid:** 1 column on mobile, 2–3 columns on desktop, ordered newest first.
  - Card components: Photo thumbnail (consistent 4:3 aspect ratio), Lost/Found badge (color-coded with explicit text), category & color tag pills, truncated 1–2 line description, location & date metadata, and status badge ("Active" / "Returned"). Contact info is strictly excluded.
- **Empty State:** When no items match the active filters, display "No items match these filters" with a "Clear filters" action button.

### 2. Report Item Page (`#/report`)
- Header: "Report Lost Item" or "Report Found Item" depending on selected type.
- Auth guard: Unauthenticated visitors are redirected to `#/login?redirect=/report` with their intended form preserved.
- Form fields in vertical order:
  1. Photo upload input: Required, images only (JPG, PNG, WebP), max ~5 MB, with clear error message if empty or file is invalid/too large. Renders instant image preview.
  2. Category dropdown (`bag`, `phone`, `bottle`, `umbrella`, `laptop`, `book`, `headphone`, `earbuds`, `airphone`, `earphone`, `hearphone`, `other`) — Required.
  3. Color dropdown (`black`, `white`, `grey`, `red`, `blue`, `green`, `yellow`, `brown`, `other`) — Required.
  4. Description input (text area) with hint text: *"Add details that aren’t obvious from the photo, such as a sticker, a scratch, or what’s inside."*
  5. Location input (e.g., campus building/area) — Required.
  6. Date input (date picker defaulting to today, editable) — Required.
  7. Contact info input (email or phone) — Required, accompanied by privacy notice: *"Contact info is hidden from the feed and shown only when someone clicks Contact the poster."*
  8. Current custody input (*Found items only*): "Where is the item now?" (e.g., "Left at Library 2nd floor desk" or "With me, contact to claim") — Required for Found.
  9. Private verification question & answer (*Found items only, Optional*): "Set an ownership question only the true owner can answer" and "Expected answer (stored hashed, case-insensitive, never revealed publicly)".
- Submission payoff: On successful creation, redirects directly to `#/items/:id`.
- Inline validation errors display under empty or invalid required fields upon submit without resetting user input.

### 3. Redesigned Item Detail & Matches Page (`#/items/:id`)
- Clean layout without "Back to feed" link (navigation via global navbar).
- Desktop layout: Two-column layout with generous spacing (Item Details on left ~55%, Top Likely Matches panel on right ~45%). Mobile layout: vertically stacked.
- **Left Column (Item Details Card):**
  - Rounded photo card with overlaid pill badges:
    - Type badge: Amber/orange `! Lost Item` or Emerald/teal `✓ Found Item`.
    - Status badge: Neutral `Active` or `Returned`.
    - Maximize button (`Maximize2` icon) opening photo in a full-screen image lightbox modal.
  - Item title, category pill badge, and color pill badge.
  - Current custody section (*Found items only*): Shows where the item is stored.
  - Description block: Full user-submitted description.
  - Metadata block: Location and Date rendered with circular iconography.
  - Poster metadata: Poster email and post date.
  - **Action Area:**
    - "Contact the poster" button: Deep royal blue button. Requires login. If the item has a private question, opens challenge modal. Validates answer via `/api/items/:id/reveal-contact` (max 3 attempts before a 5-minute lockout). When unlocked, displays contact info with a one-click "Copy" button.
    - "Mark as returned" button: Visible ONLY to the item's owner. Opens confirmation dialog, calls `PATCH /api/items/:id/return`, updates status badge to "Returned", disables further matching, and shows *"This item has been returned."* Non-owners never see this button (and any API call returns 403 Forbidden).
- **Right Column ("Top Likely Matches" Panel):**
  - Panel header: "Top Likely Matches" with candidate count badge (e.g. `2 Found`) and subtle AI engine explanation.
  - Candidate cards: Displays up to 3 opposite-side active items scored by the matching engine.
  - Match card contents: Thumbnail, Lost/Found badge, category & color tags, confidence label ("Strong match" / "Good match" / "Possible match"), plain-language reason chips (`"Same category"`, `"Same color"`, `"2 shared keywords: straps, zip"`, `"Same location area"`, `"Close date"`), location, and date.
  - Clicking any candidate card navigates directly to that item's detail view.
  - **Empty State:** When no opposite-side items qualify, renders a custom SVG illustration (`MatchesEmptyIllustration`) with the heading "No matches yet", explanatory text, and an amber "Tip" card advising the user to add more descriptive details.

### 4. User Profile Page (`#/profile` / `#/my-posts`)
- Displays authenticated user information: Email address, membership join date, and "Active Member" badge.
- Quick statistics grid: Total Reports, Active Listings, and Resolved / Returned count.
- Filter tabs: "All", "Active", and "Returned".
- Reported items list: Cards with photo thumbnail, title, category/color, date, location, and status.
- Direct Actions: "Mark as returned" button for active items owned by the user, and "Details & Matches" button linking to `#/items/:id`.
- Protected route: Redirects unauthenticated visitors to `#/login?redirect=/profile`.
- Clean header: Standalone Logout button and duplicate Report buttons are omitted (Logout is in the navbar profile dropdown).

### 5. Login Page (`#/login`)
- Clean centered card layout with title "Login to Campus Lost & Found".
- Inputs for Email and Password.
- Submit button with loading state.
- Clear error message banner for invalid credentials or server errors.
- Redirect parameter support (`?redirect=/report` or `?redirect=/profile`).
- Link to Register page: "Don't have an account? Register".
- Guest route: Logged-in users navigating here are safely redirected to `#/` (Feed) without breaking browser history.

### 6. Register Page (`#/register`)
- Clean centered card layout with title "Create an Account".
- Inputs for Email and Password (valid email format, password at least 8 characters).
- Client-side validation feedback.
- Submit button with loading state.
- Seamless Redirect: On successful registration, automatically redirects to `#/login?registered=true&email=...` with the registered email pre-filled and a green confirmation banner displayed.
- Link to Login page: "Already have an account? Login".
- Guest route: Logged-in users navigating here are safely redirected to `#/` (Feed).

### 7. About Page (`#/about`)
- Campus Lost & Found mission, explainable matching explanation, and privacy overview.
- Explains how CV tag suggestions and privacy-first contact reveal work.

### 8. Global Footer
- **Brand Column:** Logo, "Campus Lost & Found" brand, and mission statement.
- **Navigation Column:** Home, About, and Contact Support (`mailto:ck263022@gmail.com`). (No Browse).
- **Community Column:** "Report Lost Item" and "Report Found Item" links (both intercept unauthenticated users and route to `/login`).
- **Bottom Bar:** Dynamic copyright year (`© {new Date().getFullYear()}`) and hackathon proof-of-concept disclaimer.

## Look and Feel
Source: `scope.md > Inspiration & Identity`.
- **Aesthetic:** Clean, modern university community platform; trustworthy, uncluttered, generous spacing, Inter typography.
- **Theme:** Strict light mode. White cards on a very light grey-blue background (`#f8fafc`).
- **Color Palette (Single Hex Values):**
  - Page Background: `#f8fafc`
  - Card Background: `#ffffff`
  - Card Border: `#e2e8f0`
  - Primary Accent: `#4338ca` / `#3b82f6` (deep royal blue for buttons, links, active filter pills)
  - "Lost" Badge: Background `#fef3c7`, Text `#d97706` (warm amber/orange)
  - "Found" Badge: Background `#ccfbf1`, Text `#0d9488` (fresh teal/emerald)
  - "Returned" Badge: Background `#f3f4f6`, Text `#6b7280` (soft neutral)
  - Match "Strong match": `#16a34a`
  - Match "Good match": `#2563eb`
  - Match "Possible match": `#64748b`
  - Reason Chips: Background `#e0f2fe`, Text `#0369a1`
  - Body Text: `#0f172a`
  - Secondary / Metadata Text: `#64748b`
- **Typography:** Modern clean sans-serif (Inter with system fallback). Clear typographical hierarchy: bold page titles, semibold card titles, small secondary metadata.
- **Card & UI Shapes:** Rounded corners (`rounded-xl` / `rounded-2xl` on cards), soft shadows (`shadow-sm` / `shadow-md`), consistent photo aspect ratios (4:3), and tap-friendly touch targets.
- **Accessibility:** Color is never the sole indicator of meaning; explicit text labels accompany all badges and statuses. High contrast compliant text across all backgrounds.

## Features and Behavior

### Item Feed & Filtering
Source: `scope.md > The POC Boundary`.
- As a student, I want to filter campus items by Type, Category, and Status so that I can quickly check if my item was posted.
  - [x] Feed updates instantly when filter pills are toggled.
  - [x] Default view displays All types, All categories, Active status only.
  - [x] Selecting "Returned" displays resolved items with muted grey indicators.
  - [x] Display "No items match these filters" with "Clear filters" when results are empty.

### Manual-First Reporting & AI Auto-Tagging
Source: `scope.md > The Unique Kernel`.
- As a student posting an item, I want automatic tag suggestions without being blocked if the AI fails.
  - [x] Photo upload is mandatory, restricted to images (JPG/PNG/WebP, max ~5 MB), with clear inline error if invalid.
  - [x] Uploading an image renders an instant client-side preview.
  - [x] Category and color dropdowns remain fully visible and selectable at all times.
  - [x] Background call to CV service suggests category and color with a subtle "Suggested automatically. Please check" label.
  - [x] If CV service times out or fails to recognize the item, category defaults to "other" without blocking the user.
  - [x] Submitting required fields saves the post and navigates immediately to its detail page.

### Explainable Top-3 Matching
Source: `scope.md > The Unique Kernel`.
- As a student viewing an item, I want to see the top 3 opposite-side matches with clear reasons why they matched.
  - [x] Shows up to 3 opposite-type (Lost vs. Found) items with `status: active`.
  - [x] Requires same category OR at least two matching reasons to qualify as a match.
  - [x] Displays human-readable reason chips for each match factor that applied (category, color, keywords, date, shared location word).
  - [x] Displays a qualitative match tier badge: "Strong match", "Good match", or "Possible match".
  - [x] Shows "No matches yet" placeholder when no opposite-side items meet the qualification rule.

### Privacy-Preserving Contact & Resolution
Source: `scope.md > Core Loop`, `scope.md > Known Limitations`.
- As a claimant, I want to reveal contact info and mark items as returned when resolved.
  - [x] Feed and initial item payloads omit contact details.
  - [x] Revealing contact info requires user authentication (`POST /api/items/:id/reveal-contact`).
  - [x] If an item has a private question, `/api/items/:id/reveal-contact` requires the correct answer (trimmed, lowercased, validated against hash).
  - [x] Enforces a maximum of 3 failed attempts per item, followed by a 5-minute lockout period.
  - [x] Items without a private question reveal contact details directly upon authenticated request.
  - [x] "Mark as returned" is strictly restricted to the item's owner (`PATCH /api/items/:id/return` returns 403 for non-owners).
  - [x] On owner confirmation, status updates to "Returned", the item is excluded from active matching feeds, and action buttons are replaced with a resolution notice.

## States and Boundaries
- **First Use / Seeded State:** The database starts pre-populated with:
  1. Two demo user accounts (`alice@campus.edu` and `bob@campus.edu`).
  2. A found blue backpack (`bag`, `blue`, Active) owned by Alice.
  3. A lost black water bottle (`bottle`, `black`, Active) owned by Bob.
  4. A lost grey smartphone (`phone`, `grey`, Active) owned by Alice.
  5. A found red umbrella (`umbrella`, `red`, Active) owned by Bob.
  6. One resolved returned item (`bag`, `returned`) owned by Alice.
- **Empty Feed State:** Occurs when filters yield no matches; displays clear message and a reset button.
- **No Matches Detail State:** When an item has zero qualified opposite-type matches, displays the custom empty illustration, helpful text, and the amber descriptive tip card.
- **CV Offline / Error State:** If the Flask vision service is offline or takes too long, the UI displays no blocking error; dropdowns simply remain open for manual entry.
- **Returned State:** A returned item retains its detail URL but displays a muted "Returned" badge, excludes contact/return buttons, and does not appear in active match panels.

## Product Decisions
- **Photo Mandate & Size Limit:** Required image upload capped at ~5 MB prevents empty photo cards and server memory pressure while ensuring realistic CV inputs.
- **Match Qualification Threshold:** Requiring same category OR at least two matching reasons ensures random weak coincidences (e.g. only matching on "blue" across a phone and a bag) do not pollute top matches.
- **Location Word Matching:** Evaluates shared significant words in the location text (e.g., "Library", "Canteen") rather than brittle coordinate mapping.
- **Separate Report Page over Modal:** Selected a full page (`#/report`) because image preview and detailed input fields benefit from vertical breathing room on both desktop and mobile.
- **Qualitative Match Tiers:** Displaying "Strong match" / "Good match" / "Possible match" alongside reason chips provides an intuitive, non-intimidating experience compared to an arbitrary percentage number.
- **Separate Contact Reveal API:** Kept contact info out of feed and item JSON payloads, requiring an explicit authenticated request to `/api/items/:id/reveal-contact`.
- **User Ownership over Manage Codes:** Replaced fragile one-time manage codes with authenticated user accounts, ensuring posters can manage their items reliably from "My Profile".

## What We're Building
- Single-page responsive React frontend with Feed, Report Form, Redesigned Item Detail with Top-3 Match view, Login, Register, Profile, and About pages.
- Express API with JWT authentication, CRUD endpoints, separate contact reveal endpoint, seed data script (2 demo users + 5 items), and explainable heuristic matching logic.
- Lightweight Flask CV service (YOLOv8 + OpenCV) for image category and color inference.
- Local startup workflow with Docker Compose configuration.

## Deferred From the POC
- **Interactive Campus Map:** Real coordinates and pin drops deferred to keep the build focused on CV matching and explainable scoring.
- **External Push/SMS Gateways:** External push/SMS gateways deferred; all campus upload broadcasts and targeted match alerts are delivered directly in-app through the interactive navbar notification dropdown.
- **Multimodal Embeddings:** Vector DB / CLIP embeddings deferred in favor of clear, explainable heuristic scoring.

## Non-Goals
- **Email Verification & Password Reset:** Simplified account model without third-party email service dependencies.
- **Roles & Admin UI:** All users have standard privileges; no dedicated administrative dashboard in the prototype.
- **OAuth / SSO & Refresh Tokens:** Local bcrypt authentication with standard 7-day JWTs; campus single sign-on deferred.
- **In-App Messaging / Chat:** No live WebSocket chat; users coordinate pickup via disclosed email/phone.
- **Native Mobile Apps:** No iOS/Android builds; fully responsive mobile browser web app only.
- **Complex Multi-Stage Claim Arbitration:** No legalistic verification or campus admin adjudication; verification uses direct question challenges and physical confirmation.

## Open Questions
None. All product behaviors, threshold rules, and visual guidelines are approved.
