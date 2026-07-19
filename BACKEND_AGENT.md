# Backend agent contract — MakeMyTrip AI Travel Concierge

Hand this to the backend/agent developer. It defines everything the LiveKit agent
must provide so the frontend (this repo) works: the token endpoint, the room topics,
and the **hybrid rendering protocol** — typed JSON topics for structured data
(hotels, flights, hero), and openui-lang for long-tail content.

**Important:** The frontend now uses hybrid rendering. Hotel/flight search results
**must** be sent as typed JSON topics (not openui-lang). openui-lang remains only for
experiences, food, itinerary, budget, visa, booking confirmations, charts, and
open-ended answers. See the routing rule in §5.

---

## 1. Token endpoint

The frontend calls `POST {VITE_TOKEN_ENDPOINT}`:

Request:
```json
{ "agent_name": "Vani-makemytrip", "id": "optional-user-id" }
```
- `agent_name` — room naming + persona. Frontend sends `VITE_AGENT_NAME` (currently `Vani-makemytrip`).
- `id` — optional user id; if set, load the traveler's context (past trips, preferences).

Response (envelope; flat `{token,url}` also accepted):
```json
{ "success": true, "message": "token created",
  "data": { "token": "eyJ...", "url": "wss://your-livekit-host", "room": "..." } }
```
- Mint the token **and dispatch the agent into the room** before responding.
- Return `502` if dispatch fails — the frontend shows a retry state.
- CORS: allow the site origin.

---

## 2. Room protocol

| Direction | Topic | Payload | Meaning |
|---|---|---|---|
| agent → user | audio track | — | spoken replies (agent greets first) |
| both | `lk.transcription` | reserved | live captions (LiveKit-managed, do not write) |
| user → agent | `lk.chat` | text | typed messages **and booking/action strings** (see §6) |
| agent → user | `trip.hero` | JSON (readAll + parse) | destination hero banner card |
| agent → user | `hotels.list` | JSON (readAll + parse) | hotel search results carousel |
| agent → user | `flights.list` | JSON (readAll + parse) | flight search results section |
| agent → user | `trip.summary` | JSON (readAll + parse) | trip summary card in the utility rail |
| agent → user | `ui.render` | raw openui-lang text | **long-tail only** — experiences, food, itinerary, budget, visa, bookings, charts |

Each typed JSON topic (`trip.hero`, `hotels.list`, `flights.list`, `trip.summary`)
is a **single JSON snapshot per stream** — the frontend calls `readAll()` then parses.
Every re-send replaces the previous value on that topic.

`ui.render` streams carry two **attributes** the dashboard uses:
- `tab` — one of `overview / hotels / flights / experiences / food / itinerary / budget / visa` (which dashboard tab to file the render under; untagged → overview).
- `title` — a short heading shown above the render (e.g. `"Kolkata Street Food Tour"`).

`trip.summary` — existing fields unchanged; add optional
`"fullPlanAction"` (string, powers "View Full Plan →" button; frontend default:
`"Show me the full trip plan"` if absent). Example:
```json
{"destination":"Kolkata","dates":"24–26 May 2025","duration":"2 nights / 3 days","travelers":"2 adults","budget":"₹28,000 – ₹32,000","fullPlanAction":"Show me the full trip plan for Kolkata"}
```

Rules:
- Greet first with a short spoken line.
- When data is better **shown** than spoken (search results, a confirmation, an
  itinerary), send the appropriate typed JSON topic or openui-lang render.
  Say a short line too ("Here are your options") so voice users look at the screen.
- **No persistence** — all topics/transcripts are realtime only. Persist server-side.

---

## 3. Typed JSON topics — `trip.hero`

Sent once when the destination is known. Renders the hero banner card in the overview tab.

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
- `stats` ≤ 4, `related` ≤ 5 short strings (clicking one sends it as a chat message).
- Image: 1600×600 WebP q75–80, ≤ 200 KB.

---

## 4. Typed JSON topics — `hotels.list`

Sent when hotel search results arrive. Renders as a carousel in the overview + full list in the Hotels tab.

```json
{
  "title": "Top Hotels for You",
  "destination": "Kolkata",
  "viewAllAction": "Show me all hotel options in Kolkata for 24–26 May, 2 adults",
  "hotels": [{
    "id": "abhiray-grand",
    "name": "Abhiray Grand Hotel",
    "image": { "src": "https://cdn…/abhiray-640x480.webp", "alt": "Abhiray Grand exterior" },
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

- `badge`, `rating`, `reviews`, `location`, `amenities` optional.
- `amenities` ≤ 3 shown; 3–8 hotels (overview shows first 4, Hotels tab shows all).
- `action` powers the blue "View Rooms" button — sent verbatim back on `lk.chat`.
- `viewAllAction` powers the "View all" link — sent verbatim back on `lk.chat`.
- Image: 640×480 WebP q75, ≤ 60 KB per hotel.

---

## 5. Typed JSON topics — `flights.list`

Sent when flight search results arrive. Renders as a staggered list in the overview + full list in the Flights tab.

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

- `tag` optional → shown as a green "Lowest fare" badge.
- `logo` optional → fallback = airline-initials avatar.
- 2–6 rows (overview shows first 3, Flights tab shows all).
- `action` powers the "Book" button — sent verbatim back on `lk.chat`.
- Logo: 96×96 WebP/PNG/SVG, ≤ 10 KB per airline.

---

## 6. Routing rule — typed JSON vs openui-lang

| Scenario | Topic |
|---|---|
| Hotel search results | `hotels.list` |
| Flight search results | `flights.list` |
| Destination hero card | `trip.hero` |
| Trip summary sidebar | `trip.summary` |
| Experiences, food, itinerary, budget, visa | `ui.render` (openui-lang) |
| Booking confirmations, charts, open-ended answers | `ui.render` (openui-lang) |

**Stop emitting openui-lang for hotel and flight search results.** Use the typed JSON
topics above. Every button `action` string is sent back verbatim on `lk.chat` (same
semantics as `@ToAssistant(...)`) — must be self-sufficient (name + dates + pax).

---

## 7. Image requirements

All image URLs must be HTTPS only (mixed content blocked), actually resolvable,
and include meaningful `alt` text. Prefer CDN resize params (`?w=640&q=75&fm=webp`).

| Asset | Aspect | Send (2x) | Format | Budget |
|---|---|---|---|---|
| Hero banner | ~8:3 | **1600×600** | WebP q75–80 | ≤ 200 KB |
| Hotel card thumb | 4:3 | **640×480** | WebP q75 | ≤ 60 KB |
| Airline logo | 1:1 | **96×96** | WebP/PNG alpha (SVG ideal) | ≤ 10 KB |

`Cache-Control: public, max-age=31536000, immutable` recommended.

---

## 8. Booking round-trip — how actions come back

Buttons carry an `Action(...)`. When the user clicks one, the frontend does:

- `@OpenUrl("...")` → opens the URL in a new tab (use for e-tickets, receipts, payment pages).
- `@ToAssistant("...")` → sends that text back to the agent **on `lk.chat`** as a normal
  user message.

So a "Book" button becomes an incoming chat message like `"Book Hotel Plaza Athénée"`.
The agent must handle these strings: confirm details, run the booking tool, then stream a
**confirmation `ui.render`** (the ticket pattern above). Write action strings to be
self-sufficient — include enough to identify the item (name, flight number, time), since
they arrive with no extra structured payload.

Payment/checkout that must happen in-browser → send the user to a URL with `@OpenUrl`.

---

## 9. Allowed components — openui-lang (for `ui.render` long-tail only)

The following applies only to `ui.render` topics (experiences, food, itinerary,
budget, visa, booking confirmations, charts, open-ended answers). Do **not** use
these for hotel/flight search results — use the typed JSON topics in §3–5 instead.

Emit only these. Argument order matters (positional). Verify new shapes with the parser
before shipping (`createParser(openuiChatLibrary.toJSONSchema(), "Card").parse(src)`,
check `result.meta.errors`).

```
Card, CardHeader, TextContent, MarkDownRenderer, Callout, TextCallout,
Image, ImageBlock, ImageGallery, Carousel, Separator,
Table, Col, ListBlock, ListItem, TagBlock, Tag, SectionBlock, SectionItem,
Steps, StepsItem, FollowUpBlock, FollowUpItem, Tabs, TabItem, Accordion, AccordionItem,
Buttons, Button, Form, FormControl, Input, TextArea, Select, SelectItem,
DatePicker, Slider, CheckBoxGroup, CheckBoxItem, RadioGroup, RadioItem, SwitchGroup, SwitchItem, Label,
BarChart, LineChart, AreaChart, PieChart, RadarChart, RadialChart, ScatterChart,
HorizontalBarChart, SingleStackedBarChart, Series, Point, ScatterSeries, Slice, CodeBlock
```

Key signatures to watch (source of the mistakes above):
- `Image(alt, src)` — **alt is first**.
- `Tag(text, icon, size, variant)` — variant is 4th; pass `null` for skipped middle args.
- `CardHeader(title, subtitle)`, `Button(label, action, variant, type, size)`.
- `Carousel(children, variant)` — children are components (nest `Card`s for hotel/flight cards).
- Actions: `@ToAssistant(message)`, `@OpenUrl(url)`, wrapped in `Action([...])`.
```
