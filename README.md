# IUBAT EEE Academic Dashboard

An independent, student-built academic dashboard for IUBAT EEE students: GPA and CGPA
calculators, a semester planner, an attendance tracker, degree-progress tracking, and a
searchable course catalog — all calculated in your browser and saved only on your device.

**Not an official IUBAT website.** It is not affiliated with, endorsed by, or connected to
IUBAT — International University of Business Agriculture and Technology.

Live site: https://ahammadibnamazhar.github.io/iubat-eee-grade-calculator/
Repository: https://github.com/ahammadibnamazhar/iubat-eee-grade-calculator

---

## Features

- **Dashboard** — current GPA, CGPA, completed/remaining credits, degree progress,
  semester count, and a Target CGPA card, all computed live from your own data.
- **GPA calculator** — add/remove courses, live grade-point calculation, correct handling
  of F and I grades (their credits are excluded from both sides of the average, per the
  rules effective from Spring 2024).
- **CGPA calculator** — two methods: by semester (name, credits, GPA) or by individual
  course; both save independently.
- **Required / Target GPA calculator** — the average GPA needed across your remaining
  credits to reach a target CGPA, with a clear message when a target is mathematically
  impossible under a 4.00 scale.
- **Semester planner** — plan a future semester (including terms like Summer 2026),
  enter expected grades, and see the projected semester GPA and an estimated CGPA.
- **Marks → grade** — converts a mark out of 100 into the official letter grade and grade
  point, with the exact published mark range shown.
- **Attendance tracker** — current attendance percentage, how many of your remaining
  classes you need to attend for a target percentage, and how many absences you can
  still afford. Uses plain arithmetic only; no official attendance threshold is
  hard-coded (see *Academic data* below).
- **Course catalog** — every course in `data/courses.json`, browsable by subject and
  searchable by code or name.
- **Charts** — CGPA progress (semester GPA and cumulative CGPA) and grade distribution,
  built with Chart.js and updating automatically as you add data.
- **Import / export** — a full JSON backup (re-importable) and a flat CSV export of every
  table, plus a print-friendly academic summary view.
- **Dark / light theme**, saved per device.
- **Offline support** — a service worker caches the app shell so the core calculators
  keep working without a connection after your first visit.

## Technology stack

Plain HTML5, CSS3 and ES5-compatible JavaScript — no build step, no framework, no
bundler. Chosen deliberately: the project is small enough that React/TypeScript would add
build tooling and indirection without a matching benefit, and a plain static site is what
GitHub Pages serves best. The code is organized into clearly separated, commented
sections (course catalog, calculation engine, storage, each calculator, dashboard,
import/export) so a future move to TypeScript or a component framework would not require
starting over.

Chart.js is loaded from a CDN (`cdn.jsdelivr.net`) only for the two dashboard charts; if
it fails to load (for example, offline before the service worker has cached it), the rest
of the app is unaffected and the chart areas simply show an empty-state message.

## Architecture / project structure

```
iubat-eee-grade-calculator/
│
├── index.html            All markup, all sections
├── style.css              One stylesheet: design tokens, light/dark theme, layout, print
├── script.js               All application logic (single IIFE, sectioned with comments)
├── manifest.json          PWA manifest
├── service-worker.js      Offline caching for the app shell
├── README.md
├── LICENSE
│
├── data/
│   └── courses.json        Single source of truth for every course code/name/credit
│
└── assets/
    ├── favicon.svg
    └── icons/
        ├── icon-192.png
        ├── icon-512.png
        └── apple-touch-icon.png
```

A single HTML/CSS/JS file each was chosen over the larger `css/`, `js/` split some plans
for this project have suggested. At this project's size, splitting `script.js` into ten
files (`app.js`, `calculator.js`, `cgpa.js`, `courses.js`, `planner.js`, `analytics.js`,
`attendance.js`, `storage.js`, `export.js`, `ui.js`) would mean juggling `<script>` load
order and shared global state across files with no build step to catch mistakes — real
risk for very little benefit at ~2,000 lines. The single file is already organized into
the same logical sections internally (each is clearly commented and numbered), so it can
be mechanically split into those files later if the project grows enough to justify a
bundler.

## Academic data

- **Course catalog** (`data/courses.json`) is the only place course codes, names and
  credit hours are defined. Nothing duplicates it — every calculator loads from this file
  at runtime.
- **ENG 203** (Advanced English Composition) = **2 credits**; **ENG 250** (Public
  Speaking) = **3 credits**, as corrected.
- **Degree total** for the progress tracker defaults to **158 credits**, editable in the
  dashboard (saved for next time). It is a default, not a locked value, since a program's
  exact total can vary by catalog year — the field exists precisely so it's never silently
  wrong for you.
- **Summer 2026** (and other Spring/Summer/Fall terms) is supported as a normal, typed
  semester name everywhere a semester is entered (CGPA-by-semester, the planner) — the
  input is free text with suggestions, not a fixed list, so any term works.
- **Attendance policy**: no official attendance percentage threshold is hard-coded. The
  Attendance tracker performs the arithmetic you ask for on the numbers you provide; the
  *Academic rules* section separately documents attendance rules found in current IUBAT
  notices (verified below).

## Grading verification

Grading rules verified against iubat.edu on 17 September 2026

## Privacy

This is a fully client-side application:

- No backend, no database, no login.
- No analytics, trackers, or third-party scripts other than a Google Fonts stylesheet and
  the Chart.js library (loaded from a CDN, used only to draw charts — no data is sent to
  either).
- All academic data (courses, grades, semesters, planner, attendance, theme) is stored
  only in your browser's LocalStorage. Nothing is transmitted anywhere. You can export a
  backup or clear everything at any time from the dashboard.

## Running locally

No build step or server is required.

```bash
git clone https://github.com/ahammadibnamazhar/iubat-eee-grade-calculator.git
cd iubat-eee-grade-calculator
python3 -m http.server 8000
# then open http://localhost:8000
```

A local static server (rather than opening `index.html` directly with `file://`) is
needed because the app fetches `data/courses.json` and registers a service worker, both
of which most browsers block on the `file://` protocol.

## Deploying to GitHub Pages

1. Push this repository's contents to the `main` branch (or your default branch).
2. In the repository settings, under **Pages**, set the source to the `main` branch and
   the `/ (root)` folder.
3. GitHub Pages will serve the site at
   `https://<your-username>.github.io/<repository-name>/`.
4. No further configuration is needed — every path in this project (`style.css`,
   `script.js`, `data/courses.json`, `manifest.json`, `service-worker.js`, icons) is
   referenced relatively, so it works whether the site is served from a custom domain or
   from a GitHub Pages project subpath.

## Future roadmap

Items intentionally deferred rather than half-built in this pass:

- A prerequisite checker — needs prerequisite data added to `data/courses.json` first;
  no verified prerequisite list exists yet, so none is invented.
- A full Settings page (decimal-place precision, auto-save toggle) beyond the existing
  theme toggle and data-management tools.
- A global `Ctrl+K` search across courses, tools and rules.
- Client-side PDF generation beyond the existing browser print-to-PDF flow.
- Splitting `script.js`/`style.css` into the fuller `js/`/`css/` module layout, if the
  project grows enough to need a build step.
