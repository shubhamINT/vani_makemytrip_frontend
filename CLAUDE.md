# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

MakeMyTrip AI Travel Concierge — a full-page conversational travel site (React 19 + Vite). The whole site *is* the chat: the user talks (voice or text) to a LiveKit backend agent, and the agent renders flights/hotels/trips as cards inline and books them. No widget, no iframe.

## Commands

Package manager is **bun** (`bun.lock` is the source of truth; `package-lock.json` also present but ignore it).

```bash
bun install
bun dev                       # vite dev → http://localhost:5173
bun run build                 # tsc -b && vite build → dist/ (static deploy)
bun run lint                  # eslint .
bun run preview               # serve dist/
bun src/hooks/useToken.check.ts   # run a *.check.ts assertion file (node:assert, no framework)
```

Tests are `*.check.ts` files run directly with `bun` (plain `node:assert`). They are **excluded from the build** (`tsconfig.app.json`). Add a `.check.ts` next to non-trivial logic; there is no test runner.

Dev preview with no backend: open `http://localhost:5173/?mock=1` — seeds the full cockpit from `src/dev/fixtures.ts`.

## Environment

`.env` (see `.env.example`). Backend contract:
- `VITE_TOKEN_ENDPOINT` — POST returns a LiveKit token + url. Body `{ agent_name }`. Response parsed by `parseTokenResponse` (accepts `data:{token,url}`, flat `token/url`, or `participantToken/serverUrl` — see `useToken.ts`).
- `VITE_LIVEKIT_URL` — fallback if response omits url.
- `VITE_AGENT_NAME` — persona name (currently `Vani-makemytrip`).

## Architecture

**Flow:** `App.tsx` (OpenUI `ThemeProvider` + `mmtTheme`) → `Concierge.tsx` (the shell). Concierge shows a hero landing page until first interaction, then `fetchToken()` → `<LiveKitRoom>` → `LiveShell` (3-column cockpit: `ChatPanel | MainStage | UtilityRail` + floating `VoiceDock`). Everything under LiveShell must render inside a `LiveKitRoom`.

**The render contract (the core of this app).** The backend agent drives the UI over two LiveKit channels:

1. **Typed JSON topics** — one JSON snapshot per stream, each send *replaces* the last (snapshot semantics). Subscribed via `useTopicJSON<T>(topic)` / `useTopicJSONList<T>`. All payload shapes live in `src/lib/streamTypes.ts`. Topics: `trip.hero`, `hotels.list`, `flights.list`, `experiences.list`, `food.list` (last three share the `HotelsList` shape), `detail.view`, `trip.summary`, `booking.confirmation`. Each renders a dedicated native card component in `src/components/live/`.

2. **`ui.render` topic** — arbitrary UI streamed as **openui-lang** (`@openuidev/react-lang` `Renderer`), read **incrementally chunk-by-chunk** (not `readAll` — that would block until close and kill the live build) and grouped into dashboard tabs via the stream's `attributes.tab`/`attributes.title`. Rendered by `OpenUIEmbed`.

`MainStage.tsx` orchestrates both: canonical tab order is `TAB_ORDER`; the freshest result auto-focuses its tab; only tabs with content show.

**Outbound intents are just chat messages.** Every button (Book, View Rooms, related chips) and every openui `ActionEvent` is sent back to the agent via `useChat().send(message)` — same channel as typed chat. `open_url` actions open a new tab instead. The `sendAction` callback threads through every card component's `onAction` prop.

**Conversation feed:** `useConversation()` merges typed `useChat` messages with live `useTranscriptions` (voice), sorted by timestamp; local identity determines user-vs-agent side.

## Styling — two systems, do not mix

- **Hero / landing page** (`Concierge.tsx` hero branch): legacy hand-written CSS in `src/styles/site.css`, all classes `mmt-` namespaced. Untouched by Tailwind.
- **Live shell** (everything under `LiveShell`): **Tailwind v4** with custom design tokens defined in `src/index.css` `@theme inline` (e.g. `bg-paper`, `text-ink`, `text-muted`, `border-line`, `text-coral`, `rounded-card`, `font-display`). Tailwind preflight is replaced by a scoped mini-reset in `@layer base`. Use these token utilities, not raw hex.
- OpenUI components are themed centrally via `src/theme.ts` (`mmtTheme`), which maps OpenUI tokens onto the same `index.css` brand vars (`--coral`, `--ink`, etc.) — one palette. Note the gotcha documented there: OpenUI `foreground` = elevated surface, not text.

## Gotchas

- **React Compiler is on** (`babel-plugin-react-compiler` via vite). Don't hand-add `useMemo`/`useCallback` for perf; the compiler handles memoization. Follow the rules of hooks strictly.
- Path alias `@/*` → `src/*`.
- LiveKit text-stream handlers must be registered/unregistered in effects keyed on `room` — see `useTopicJSON` and `MainStage`'s `ui.render` handler for the pattern.
- README references `FRONTEND_AGENT.md` / `BACKEND_AGENT.md`; they are not currently in the repo. `streamTypes.ts` is the live source of the backend contract.
