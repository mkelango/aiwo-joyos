# Joy OS — Front-End Platform Plan (approved · as built)

**Built from:** Joy OS Technical Memorandum (Ed. 1, 30 Oct 2026) · Joy OS Technical Architecture · AIWO Brand Identity Playbook · competitive research (`research/competitors/`).
**Scope:** front end only, end to end, on specimen data — a React web app (`joy-os-web/`) and a native Expo app (`joy-os-mobile/`). No back end; every screen reads from a typed mock layer shaped like the future API, so the back end can be built against it later.

**Changes since approval:** the public marketing site (§4A as first planned) was removed at the client's request — sign-in is the front door, and the old public addresses redirect into the app. A native mobile app was added (§4F).

---

## 1. What the documents actually say (the deep read, in one page)

| The idea | What it means for the product |
|---|---|
| **One equation runs the company.** Joyspan = Healthspan + Purpose + Relationships + Freedom + Daily Pleasure − Preventable Suffering | The equation *is* the information architecture: six term services → six "spaces" (Body, Purpose, People, Freedom, Pleasure, Ease) + Today. |
| **One number that can go down.** JI = GM(H,P,R,F,D) − 0.25·B, method pinned on every score | The Index is the hero element (Mono, largest on screen), always shown with the Wheel, its method version, date and next-measure date. Falls are shown honestly — as a sentence and a named person, never red, never pushed. |
| **Three grades, one engine.** Check (free, bands only) → Index (~60 items, 90-day) → Clinical (physician-signed) | Three distinct funnels/screens; Check never shows a number. |
| **One action a day.** Lowest term picks today's action; one Daybreak button per screen; no streaks, badges, confetti, leaderboards | Today screen = one card, one reason, "Not today" never punished. |
| **The 90-day loop is the heartbeat.** Measure → Name lowest term → Plan → Act daily → Review D15/45 → Talk D60 → Re-measure D76/90 → Publish | Loop progress (Day N of 90) visible everywhere; Day-90 re-measure is the easiest thing in the quarter. |
| **A person behind every number.** Drift becomes a *task* for a named coach/clinician with an SLA | Coach & clinical consoles with drift queues, SLAs, audit. |
| **AI drafts, a person signs.** VIVA typed tools; no AI text on Suffering results; emergency intercept first | VIVA companion surfaces with provenance ("drafted by VIVA · method v1.0"), refusal states, crisis path (Tele-MANAS 14416). |
| **The member owns it.** Trust centre one tap from the Index; 3 separate consents (Care, Data, Publishing) + per-purpose | Trust centre: who has seen my data, consents, export (JSON/FHIR), delete. Employers see aggregates of 50+, no cell < 10. |
| **Made for two, welcoming to one.** Households are first-class; partner answers private | Household page shows only what both agree to share; Couples Check shows agree/differ, never who said what. |
| **Built to be licensed.** Members, Joyspan@Work, insurers, hospitals, Houses, residences, regions | Tenant admin and partner consoles; region/tenant switcher. |
| **Evidence in public.** Cohort deltas published up *and* down; falsifier (<50% improve lowest term → publish and redesign) | Evidence views in the Science Office console and the Creds deck. |
| **Milk → Mountain → Moonshot.** J0–J5 releases, gates, rungs R1–R6 | Roadmap + scoreboard views in the Exec console and the Creds deck. |

## 2. Competitive position (summary — full analysis in `research/competitors/competitive-analysis.md`)

Every competitor sells **one term** of the equation as if it were the whole:
- **Body:** Oura, WHOOP, Apple Health, Ultrahuman, Function Health, Superpower → signals and biomarkers, but no reason the body matters.
- **Mind / Ease:** Headspace, Calm, Lyra/Spring/Modern Health → content and therapy access; no purpose or joy measure.
- **Pleasure / habit:** Finch, gratitude apps → gamified (streaks, pets) — exactly what AIWO forbids.
- **Employer:** Personify Health/Virgin Pulse, Wellable → activity points and leaderboards, not a validated outcome.
- **India:** HealthifyMe, Cult.fit → mass reach, single term.

**Joy OS white space:** a single, validated, *balance-rewarding* six-term index · real places and real people (’cations, coaches, physicians) · households · honest falls · 90-day loop with published deltas · privacy as the product.

**Market fact (from 15 profiles + 59 screenshots):** no competitor covers more than 2 of the 5 whole-life rows (purpose, relationships, freedom, pleasure, retreats); none combines a composite index + explainability + multi-brand device aggregation + INR pricing. The market has converged on *wearable + blood test + an "age" number + an AI companion* — all body-only.

**What we adopt and push 10× (each tied to the best-in-class source):**
| # | Pattern | Best today | Joy OS move |
|---|---|---|---|
| 1 | Score always decomposable | Apple Sleep Score ring, Oura contributors | The Wheel → each term → its instruments and signals as rows, with method and "what moved" |
| 2 | Verdict first, numbers second | Oura detail pages | Every screen opens with one plain sentence; falls told as a sentence + a named person |
| 3 | Show your measurement set | Function "What we test" | Public, searchable method page: every instrument, source, cadence, licence, weight, λ |
| 4 | Score → ranked actions → retest | Superpower top-5 + retest pin | One action a day (not five), each with its reason; the 90-day re-measure is the retest pin |
| 5 | Intent-first onboarding, value before data | Headspace intent tiles | "What would raise your life right now?" six tiles → mini Check → recap → consents → device last |
| 6 | Stepped care as a visible ladder | Headspace, Spring | Care ladder: Practice → VIVA → Circle → Coach → Psychologist / Physician → ’cation, with clinician matching by language, city, gender |
| 7 | Memory the member can see and edit | WHOOP Coach "My Memory" | "What VIVA knows" with per-space toggles and forget controls |
| 8 | Severity bars over time | Calm Health PHQ/GAD | Ease space: screen history in pre-approved copy, never AI text |
| 9 | Early-warning radar | Oura Symptom Radar | Drift → a call from a named person, never a red alert |
| 10 | Opt-in, de-identified org dashboard | Oura for Organizations | Joyspan@Work aggregates, k ≥ 10, employers ≥ 50, no drill-down |
| 11 | Portability | Function share chips | Index card PDF, JSON/FHIR export, ABHA link |

**Recommendations we deliberately reject** (they break AIWO's own rules): streaks or streak recoveries, "joy jar" or pet mechanics, leaderboards, "Joyspan days gained" as a headline unit (JALY stays a research metric until validated), a different "atmospheric" palette per space (the Spectrum is fixed), fear framing, points-for-rewards, supplement commerce near a score, phone-number gate before value.

## 3. Design system — AIWO brand, Joy OS colour

- **Paper-first** light theme by default; dark = warm **Ink**, never black-and-gold.
- **Daybreak** (Joy OS action colour) for the single primary button per screen.
- **Joyspan Spectrum**: each term in its colour, *always with its name*; Burden petal hatched and signed with a minus.
- **Type:** brand sans for UI, an italic serif for emphasis words, **Mono for every number**; 17 px body minimum; built for readers of fifty and beyond.
- Tokens as a file (DTCG-style CSS variables), WCAG 2.2 AA, keyboard-complete, reduced-motion aware, focus rings, Dynamic-Type-style scaling.
- Signature components: **Joyspan Wheel** (5 petals + hatched burden), Index numeral, Term chip, Band label (STEADY · UNEVEN · THIN), Loop ring (Day N of 90), Method footer, Daybreak button, Person card, Trust link.

## 4. Information architecture — what gets built

### A. Front door (no public marketing site)
1. **Sign-in** (`/`) — the product promise and formula, AIWO ID / passkey / phone, specimen accounts for every role. `/signin` redirects here.
2. **The Joyspan Check** (`/check`) — 18 statements, 5 min, no login → **bands only** → three doors (the Letter, a baseline, the app).
3. **Onboarding** (`/onboarding`) — see §4B.
4. **The method** — moved inside the app (`/app/method`): formula, instruments, weights, λ, versions, licences, "what the AI will never do".
5. **Not found** — a calm 404 in the member app, the console and at the top level; an error boundary so a failed screen is never blank.

Removed: Home, How it works, the public ’Cations catalogue, Organisations, Pricing, public Trust and Evidence, and the public header/footer. Their old addresses redirect: `/method` → `/app/method`, `/pricing` → `/app/membership`, `/cations` → `/app/cation`, `/trust` → `/app/trust`, `/evidence` → `/console/science`, `/organisations` → `/console/tenant`, `/how-it-works` → `/journeys`.

### B. Member app (web, responsive; mobile-first frame on small screens) — five tabs
- **Onboarding** — AIWO ID / passkey, three consents (Care · Data · Publishing), device link (Oura default, Apple Health, Health Connect, Whoop, Garmin), household invite, language (EN · தமிழ் · हिन्दी), quiet hours.
- **Take the Index** — ~60 items in two sittings, progress saving, per-instrument intros, licence attribution.
- **Index result & history** — Wheel, JI, term bands, lowest term + one next step, method/date/next measure, history across methods with markers, Day-90 "it went down" honest screen, printable Index card.
- **Today** — Index + Wheel, Day N of 90, the one action (Daybreak button) with its reason, "Not today", circle's next call, this week.
- **Joy Ledger** — three ten-second prompts, tags/word/photo, weekly "where joy came from".
- **Spaces** — hub + six full spaces, each with score, band, history, framework tool, three actions, VIVA tool:
  - Body: device link, LE8 tracker, biomarker vault, capacity battery, signal trends.
  - Purpose: Ikigai map, Tomorrow Question, 25-year statement, contribution log.
  - People: your 5 and 15 (orbit), the 2 a.m. list, circle of eight, State of Us, Couples Check.
  - Freedom: time audit, the No list, digital sabbath, peace-of-mind checklist.
  - Pleasure: Ledger insights, one planned pleasure, savouring prompts, Moments of Joy.
  - Ease: Second Arrow journal, sleep plan & wind-down, keep-meaning-to list, screens with clinician routing, Tele-MANAS 14416.
- **’Cation** — before/during/after timeline, itinerary, readings, hand-off, the 90 days, Joy Passport, browse & book.
- **Practice** — eight weeks, Mentor audio player, science note, daily practice, weekly circle, before/after Index.
- **Care** — my people (coach, concierge, physician, psychologist), messages, consults, results, clinical sign-offs.
- **VIVA companion** — explain my Index, why today's action, Ikigai coach, couples prompts; provenance and guardrail states.
- **Circles & Events** — circle of eight call room, events, passes, Sessions.
- **Household** — partners, elders mode, minors (not scored), shared-by-agreement page.
- **Trust centre** — who has seen my data, consents by purpose, export, delete, method pages, claims log.
- **Crisis screen (P0)** — reachable from any text input via the intercept: Tele-MANAS 14416, on-call clinician, emergency contact.
- **WhatsApp and watch** — simulated chat for the Check and Ledger prompts (never clinical content); a watch complication for quick-add joy moments.
- **Global states** — offline banner and sync queue, "not yet measured" terms, survey-only Index, "awaiting physician sign-off", payments grace.
- **Membership & settings** — plan, invoices (GST), notifications (≤3/day, quiet hours), language, accessibility.
- **Notifications centre & profile** — everything Joy OS sent you, read state, per-channel prefs; personal details, AIWO ID, emergency contact, sign out.

### C. Consoles (role-gated, desktop)
- **Coach & concierge** — caseload by loop day, drift tasks with SLA timers, VIVA coach_digest, circle schedule, call notes.
- **Clinical portal** — screen-threshold queue, P0 board, Clinical-grade sign-off, results review, audit.
- **Partner / venue** — ’cation arrivals (no PHI), itineraries, Signal Points, 40% hotel-cost rule, aggregate deltas.
- **Tenant admin** (Joyspan@Work / insurer) — eligibility & SSO, enrolment, aggregate outcomes (≥50, no cell <10), EAP routing volume.
- **Science Office** — instrument registry & licences, method versions (weights, λ), cohorts, falsifier, publications, claims gate.
- **Control plane (engineering & ops)** — feature flags and per-AI-tool kill switches, evaluation plane (evals by language, red-team, traces), SLO and error budgets, cost per member per service, tenants and region cells, audit viewer and JIT access, signals ingest health, rights-request jobs (export ≤72 h, erase ≤24 h).
- **Leadership scoreboard** — north star, Day-90 rate, falsifier, WAU, cost per member-year, P0 SLA, J0–J5 roadmap, seven moats, flywheel.

### D. Connecting the dots
- **Platform map** — interactive: modules ↔ terms ↔ consoles ↔ outcomes (the "which term does it raise?" test on every module).
- **Journey explorer** — the five journeys and the 90-day loop as an interactive timeline; one click jumps into the screen that serves each step.
- **Role switcher** — a demo bar to move between Member, Coach, Clinician, Partner, Tenant, Science, Control plane, Leadership.

### E. Creds
A presentable **credentials deck** inside the platform (`/creds`, keyboard-navigable slides, print-to-PDF): the problem, the category, the equation, the product, screens, journeys, AI & trust, competition, moats, roadmap, economics, team & decisions. Plus **demo sign-in credentials** for each role (specimen accounts, no real auth).

### F. Mobile app (native, `joy-os-mobile/`)
The member experience as a native iOS/Android app: the five tabs (Today, Spaces with all six rooms, ’Cation, Practice, Care) plus welcome, sign-in, onboarding, the Check, Take the Index, Index result, Day 90, Ledger, VIVA, method, messages, circles, events, passport, household, devices, membership, trust centre, notifications, profile and settings. Same brand rules, light and warm-Ink dark, a signed-out gate, and a notifications bell on every tab. Consoles stay on the web (desktop work).

## 5. Engineering

- **Web stack:** React 19 + TypeScript + Vite, React Router, Tailwind (mapped to brand tokens), Framer Motion (reduced-motion aware), Recharts for trends, custom SVG Wheel; installable PWA. Matches the architecture's TypeScript-end-to-end choice; the web member app ports to Next.js later.
- **Mobile stack:** Expo + expo-router + react-native-svg, sharing the domain types, Index engine and specimen data with the web.
- **Run it:** web `npm --prefix joy-os-web run dev` → http://localhost:5190 · mobile `cd joy-os-mobile && npx expo start` → http://localhost:8081, or Expo Go on a phone on the same Wi-Fi.
- **Mock API layer:** `src/domain` (types + Index engine) and `src/data` (specimens) so screens never hard-code numbers; the engine computes JI from term scores.
- **Quality bar:** typecheck + production build clean; every route renders; AA contrast; keyboard nav; mobile 375 px and desktop 1440 px verified with screenshots.
- **Build approach:** I build the foundation (tokens, components, layouts, routing, data) myself, then a multi-agent workflow builds the route groups in parallel on disjoint folders, then an independent verifier pass and a visual QA pass.
- **Completeness pass (done):** 10 areas each audited → fixed → independently re-verified, then a cross-cutting pass. Result: 73 web routes and 34 mobile screens render real content with one page title each, fit 390 px in light and dark, every link resolves, no stub text; both apps typecheck and build. Not yet verified: the mobile app on a real iOS/Android device (only its web export was driven).

## 6. Out of scope (front end only)
Real auth, payments, device APIs, WhatsApp, video, AI calls, persistence beyond local storage. Each appears as a faithful UI with specimen data and a clear "specimen" label.
