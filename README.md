# MakeMyTrip — AI Travel Concierge

A full-page conversational travel site (React + Vite). The user talks (voice or
text) to a LiveKit backend agent; the agent renders flights, hotels and trips as
**OpenUI** cards inline and can book them — all inside the conversation.

Not a widget. No iframe, no FAB. It is the whole site.

## Project structure

```
src/
├── main.tsx                # React entry point
├── App.tsx                 # renders <Concierge />
├── index.css               # theme tokens + full-page background
└── app/
    ├── Concierge.tsx       # shell: hero → conversation, first-message connect, LiveKitRoom
    ├── Conversation.tsx    # feed: chat bubbles + transcriptions + OpenUI result panels; booking round-trip
    ├── Composer.tsx        # sticky composer: text + mic; auto-sends the buffered first message
    ├── Visualizer.tsx      # voice-state pill (listening / thinking / speaking)
    ├── ErrorBoundary.tsx   # render-error fallback
    ├── useToken.ts         # token fetch + response parsing
    ├── useToken.check.ts   # assertions for parseTokenResponse
    └── site.css            # all styles (mmt- namespace, light airy horizon theme)
```

## How it works

- **Hero** — user lands on a headline + starter prompts + an ask box. Nothing connects yet.
- **First ask** — on the first message/starter, the app fetches a token, joins the
  LiveKit room, and sends that first message once connected.
- **Conversation** — plain chat renders as light bubbles; anything the agent streams on
  the `ui.render` topic renders as a distinct **boarding-pass result panel** (hotels,
  flights, tickets). The two never blur.
- **Booking** — "Book" buttons inside rendered cards send the action back to the agent as
  a normal chat message (or open a URL), so the agent can confirm and complete the booking.

Two audience docs:
- [`FRONTEND_AGENT.md`](./FRONTEND_AGENT.md) — how the browser connects and renders.
- [`BACKEND_AGENT.md`](./BACKEND_AGENT.md) — **the contract the backend agent must satisfy** (hand this to the backend agent).

## Setup

```bash
bun install
cp .env.example .env    # set VITE_TOKEN_ENDPOINT to your backend token URL
bun dev                 # http://localhost:5173
```

Env (`.env`):

| Var | Purpose |
|---|---|
| `VITE_TOKEN_ENDPOINT` | POST endpoint that mints a LiveKit token + dispatches the agent |
| `VITE_LIVEKIT_URL` | optional fallback if the token response omits `url` |
| `VITE_AGENT_NAME` | agent/persona name (default shown in UI). Currently `Vani-makemytrip` |

## Build

```bash
bun run build   # tsc -b && vite build → dist/  (deploy dist/ as a static site)
```
