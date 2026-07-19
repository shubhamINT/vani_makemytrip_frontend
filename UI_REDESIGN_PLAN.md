# Live Screen Redesign Plan — MakeMyTrip Reference (makemytrip2.png)

## 1. Context

1. Landing page approved — must not change visually.
2. Live screen (after agent connects) rebuilt to match reference: 3-column layout, hero destination card, rich hotel cards, flights section, floating pill voice dock, animated thinking checklist.
3. Approved decisions:
   - **Hybrid rendering** — new typed JSON LiveKit topics (`trip.hero`, `hotels.list`, `flights.list`) rendered by bespoke React components; openui `ui.render` stays for long-tail tabs (experiences / food / itinerary / budget / visa) and open-ended answers.
   - **Tailwind v4 + shadcn-style components** for the live shell only; landing stays on legacy `site.css`.
   - **3-column layout**: chat left (320px) · tabbed content center (flex) · utility rail right (300px).
   - **Thinking checklist frontend-simulated** off `useVoiceAssistant()` state `'thinking'`.
4. Invariants preserved:
   - `src/theme.ts` `--openui-*` mapping + `:root` vars in `index.css` untouched (streamed openui content depends on them).
   - All Composer/Stage logic ported, not rewritten: pending-first-message send, mic toggle, waveform track selection, `ui.render` incremental upsert, `handleAction` → `useChat().send`.

## 2. Phase 0 — Tooling (DONE)

1. Deps installed: `tailwindcss`, `@tailwindcss/vite`, `motion`, `embla-carousel-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-tabs|avatar|scroll-area|slot`.
2. `vite.config.ts`: `tailwindcss()` plugin + `@` → `src` alias.
3. `tsconfig.app.json`: `paths: { "@/*": ["./src/*"] }`.
4. `src/index.css`: Tailwind imported **without preflight** (landing safety); `@theme inline` maps brand vars (`--color-coral: var(--coral)` etc.) + extras (lavender, amber, emerald); scoped mini-reset under `.live-shell` (border-style reset mandatory for Tailwind border utilities).
5. shadcn-style primitives hand-written (brand-mapped, no CLI): `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `avatar.tsx`, `tabs.tsx`, `scroll-area.tsx` + `src/lib/utils.ts` (cn).
6. Verified: `npm run build` green.

## 3. Phase 1 — Data layer + dev mock harness (DONE)

1. `src/lib/streamTypes.ts` — TS contracts: `TripHero`, `HotelsList`, `Hotel`, `FlightsList`, `Flight`, `TripSummaryData`.
2. `src/hooks/useTopicJSON.ts` — generic LiveKit text-stream topic → JSON snapshot hook; dev listener for `mock:topic` CustomEvents.
3. `src/hooks/useConversation.ts` — chat + transcription merge (lifted from Transcript.tsx) + dev `mock:chat` lines.
4. `src/hooks/useWeather.ts` — extended with daily high/low (`hi`/`lo`).
5. `src/dev/fixtures.ts` — Kolkata fixtures matching contracts; `src/dev/MockPanel.tsx` — floating dev panel (summary/hero/hotels/flights/chat/think/clear) + `window.__mock(topic, data)`.
6. `?mock=1` mode: full live screen without backend (`LiveKitRoom connect={false}`) — wiring pending in Concierge.

## 4. Phase 2 — Shell (files DONE, wiring PENDING)

1. `src/components/live/LiveShell.tsx` — `.live-shell` root, header, error banner, responsive grid `grid-cols-1 lg:[280px_1fr_260px] xl:[320px_1fr_300px]`, VoiceDock.
2. `src/components/live/LiveHeader.tsx` — MMT logo + MYRA badge (click = end session), live status pill with pulsing green dot.
3. `src/lib/connState.ts` — shared `ConnState` type.
4. **PENDING**: `Concierge.tsx` live branch swap — replace `.mmt-cockpit` + `.mmt-dock` block with `<LiveShell/>`; add `MOCK` mode; landing branch byte-for-byte unchanged. (Edit was started, reverted on request — file currently at original state.)

## 5. Phase 3 — Center stage (DONE)

1. `src/components/live/MainStage.tsx` — ported Stage logic (stream handler, seq/upsert, tab auto-follow, action round-trip) + typed topics; shadcn Tabs, lucide icons, coral underline active state; typed lists never steal user-selected tab.
   - Overview tab: HeroCard → HotelsSection (first 4) → FlightsSection (first 3) → openui renders → RelatedQueries.
   - Hotels/Flights tabs: full sections + their openui renders. Other tabs: openui only.
2. `HeroCard.tsx` — 8:3 banner + white gradient overlay, destination + bookmark toggle, region, ≤4 stat chips (icon enum → lucide).
3. `HotelsSection.tsx` + `HotelCard.tsx` — embla carousel (align start, dragFree), 272px cards, edge fade + prev/next chevrons, "View all" → `viewAllAction`; card = 4:3 image, optional "Popular" badge, name, filled star + rating + (reviews), MapPin location, amenity badges, price + **blue** "View Rooms" (reference CTA is sky, coral reserved for brand/tabs/mic).
4. `FlightsSection.tsx` — logo avatar (initials fallback), airline + flightNo, depart/arrive times + codes, duration/stops line ornament, price + green "Lowest fare" badge, Book button; staggered fade-in.
5. `RelatedQueries.tsx` — pill chips, hover coral tint, click → send as chat.
6. `OpenUIEmbed.tsx` + `src/styles/openui-embed.css` — streamed openui renders in matching card surface (polish ported from `.mmt-dash-card` block).

## 6. Phase 4 — Chat panel (DONE)

1. `ChatPanel.tsx` — card shell, Myra gradient avatar header, auto-scrolling feed, `aria-live="polite"`.
2. `MessageBubble.tsx` — user: sky-blue right-aligned bubble + timestamp; agent: Myra label + white bordered bubble with markdown (`.mmt-md` reused).
3. `ThinkingChecklist.tsx` — mounts when thinking >400ms; 4 steps ("Finding best flights", "Checking hotel availability", "Exploring top experiences", "Almost done…") revealed ~900ms apart, green checks flip in, fade-out on exit; `useReducedMotion` honored.

## 7. Phase 5 — Utility rail (DONE)

1. `UtilityRail.tsx` — column; own `useChat` send.
2. `TripSummaryCard.tsx` — overlapping traveler avatars, dl rows (Destination/Dates/Duration/Travelers/Budget), outline "View Full Plan →" → `fullPlanAction`.
3. `WeatherCard.tsx` — 34px temp, condition + H/L, tinted lucide weather icon.
4. `HelpCard.tsx` — lavender card, headset icon, "Need help? Talk to Myra anytime"; click dispatches `dock:focus`.

## 8. Phase 6 — VoiceDock (DONE)

1. `VoiceDock.tsx` — floating centered pill (`rounded-full`, shadow, backdrop blur, `w-[min(94vw,620px)]`); all Composer logic ported.
2. Mic 44px coral with motion pulse ring while listening; speaker toggle; status dot (emerald=listening, amber=thinking, coral=speaking) + label; restyled BarVisualizer; input; blue send; divider; danger hang-up.
3. Listens for `dock:focus` (Help card).

## 9. Phase 7 — Responsive + a11y (PENDING polish)

1. Breakpoints wired in LiveShell: xl 3-col, lg narrower 3-col, <lg stacked (main → rail → chat, chat h-105).
2. Radix Tabs keyboard nav free; icon buttons aria-labeled; `.live-shell :focus-visible` ring in index.css; reduced-motion gates on all motion + CSS pulses.
3. Remaining: visual pass at 1440/1150/900/390, error banner/spinner restyle check.

## 10. Phase 8 — Cleanup + docs (PENDING)

1. After LiveShell wired + verified: delete `Stage.tsx`, `Transcript.tsx`, `TripSummary.tsx`, `Composer.tsx`; strip site.css live-screen sections (~lines 390–620, 663–860) keeping landing + `.mmt-md` + shared rules; drop unused `ui/scroll-area.tsx` if still unused.
2. Update `BACKEND_AGENT.md` (section 11 below).
3. Full verification (section 13).

## 11. Backend contract — what backend must send

New topics, agent → user, **single JSON snapshot per stream** (frontend does `readAll()` + parse; each re-send replaces previous). Every button `action` string is sent back verbatim on `lk.chat` (same semantics as `@ToAssistant`) — must be self-sufficient (name + dates + pax).

### 11.1 `trip.hero`

```json
{
  "destination": "Kolkata",
  "region": "West Bengal, India",
  "image": { "src": "https://cdn…/kolkata-hero-1600x600.webp", "alt": "Victoria Memorial" },
  "stats": [
    { "icon": "sun",      "label": "Good Weather",     "value": "28°C" },
    { "icon": "calendar", "label": "Best Season",      "value": "Oct – Mar" },
    { "icon": "tag",      "label": "Avg. Hotel Price", "value": "₹3,000 / night" }
  ],
  "related": ["Best time to visit Kolkata", "3-day Kolkata itinerary"]
}
```

- `icon` enum: `sun | cloud | calendar | tag | wallet | thermometer | umbrella` (unknown → generic dot).
- `stats` ≤ 4, `related` ≤ 5 short strings (clicking one sends it as chat).

### 11.2 `hotels.list`

```json
{
  "title": "Top Hotels for You",
  "destination": "Kolkata",
  "viewAllAction": "Show me all hotel options in Kolkata for 24–26 May, 2 adults",
  "hotels": [{
    "id": "abhiray-grand",
    "name": "Abhiray Grand Hotel",
    "image": { "src": "https://cdn…/abhiray-640x480.webp", "alt": "…" },
    "badge": "Popular",
    "rating": 4.6,
    "reviews": 1248,
    "location": "New Market, Kolkata",
    "amenities": ["Breakfast incl.", "Free cancellation"],
    "price": "₹4,200",
    "priceUnit": "/ night",
    "action": "Show me rooms at Abhiray Grand Hotel, New Market, Kolkata for 24–26 May, 2 adults"
  }]
}
```

- `badge`, `rating`, `reviews`, `location`, `amenities` optional; `amenities` ≤ 3 shown; 3–8 hotels (overview shows first 4).
- `action` powers the "View Rooms" button.

### 11.3 `flights.list`

```json
{
  "title": "Recommended Flights",
  "viewAllAction": "Show me all flights from Delhi to Kolkata on 24 May",
  "flights": [{
    "id": "6e-2041",
    "airline": "IndiGo",
    "logo": "https://cdn…/airlines/indigo-96.webp",
    "flightNo": "6E 2041",
    "depart": { "time": "06:20", "code": "DEL" },
    "arrive": { "time": "08:45", "code": "CCU" },
    "duration": "2h 25m",
    "stops": "Non-stop",
    "price": "₹5,600",
    "tag": "Lowest fare",
    "action": "Book IndiGo 6E 2041, Delhi to Kolkata, departing 06:20 on 24 May, 2 adults"
  }]
}
```

- `tag` optional → green badge; `logo` optional (fallback = airline-initials avatar); 2–6 rows (overview shows first 3).

### 11.4 `trip.summary` (updated, backward compatible)

Existing fields unchanged; add optional `"fullPlanAction": "Show me the full trip plan for Kolkata"` (powers "View Full Plan →"; frontend default if absent: "Show me the full trip plan").

### 11.5 Routing rule

- Hotel/flight **search results** → typed topics above (stop emitting openui for these).
- `ui.render` (unchanged: attrs `tab`, `title`) stays for experiences, food, itinerary, budget, visa, booking confirmations, charts, open-ended answers.

## 12. Image sizes (backend must follow)

| Asset | Aspect | Send (2x) | Format | Budget |
|---|---|---|---|---|
| Hero banner | ~8:3 | **1600×600** | WebP q75–80 | ≤ 200 KB |
| Hotel card thumb | 4:3 | **640×480** | WebP q75 | ≤ 60 KB |
| Airline logo | 1:1 | **96×96** | WebP/PNG alpha (SVG ideal) | ≤ 10 KB |

1. HTTPS only (mixed content blocked); URLs must actually resolve; meaningful `alt`.
2. Prefer resizing CDN params (`?w=640&q=75&fm=webp`); `Cache-Control: public, max-age=31536000, immutable`.
3. Frontend already handles: lazy-load (except hero), fixed aspect boxes (no layout shift), `onError` fallbacks.

## 13. Verification checklist

1. `npm run dev` → landing pixel-identical to approved version.
2. `localhost:5173/?mock=1` → MockPanel: summary → hero → hotels → flights → chat → think; verify overview composition, tab switching, carousel drag + chevrons, action strings logged.
3. Real backend smoke (`VITE_TOKEN_ENDPOINT`): voice states drive dock + checklist; openui streams render themed in long-tail tabs; pending first message; mic/speaker toggles; hang-up resets.
4. Edge payloads via `window.__mock`: missing badge/logo/rating, 8 hotels, broken image URL, long names.
5. Widths 1440/1150/900/390; keyboard-only pass; OS reduced-motion on.
6. `npm run build && npm run preview` + `npm run lint`; `src/dev/` absent from prod bundle.

## 14. Current status

| Phase | Status |
|---|---|
| 0 Tooling | done |
| 1 Data layer + mocks | done |
| 2 Shell files | done — **Concierge wiring pending** (file reverted to original on request) |
| 3 Center stage | done |
| 4 Chat panel | done |
| 5 Utility rail | done |
| 6 VoiceDock | done |
| 7 Responsive polish | partial (breakpoints wired, visual pass pending) |
| 8 Cleanup + BACKEND_AGENT.md | pending |

Next step when resumed: wire `Concierge.tsx` live branch to `LiveShell` + `?mock=1` mode, then verify, then cleanup + docs.
