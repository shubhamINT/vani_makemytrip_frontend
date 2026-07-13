---
name: frontend
description: Build and maintain the Vani SBI Frontend — a React + LiveKit voice/chat widget embedded via iframe, with OpenUI generative UI rendering. Use this whenever working on the widget UI, styling, voice integration, token fetching, transcription display, OpenUI rendering, or the connection state machine. Covers the single-file CSS architecture (vw- namespace), colour tokens, component tree, LiveKit room lifecycle, and voice-assistant state display. Always understand existing components before making changes.
---

# Vani SBI Frontend — Widget Architecture

This project is a **single-widget** React application designed for iframe embedding. It provides a voice + text chat interface backed by a LiveKit voice agent, with generative UI cards rendered via OpenUI Lang.

## Step 0 — Understand before you change anything

Never jump straight to code. Before writing or editing a single line:

1. **Read `README.md` first** for the project overview, folder structure, and how the widget embeds. This skill covers UI implementation details only.
2. **Read the current files.** The entire UI lives in `src/widget/` — open the specific component(s) and `widget.css`. Understand the existing component structure, state management, and CSS conventions so new code matches rather than fights them.
3. **Clarify the ask.** Is this a visual change to an existing component, a new LiveKit integration, or a change to the connection/state flow? Most work is scoped to `src/widget/`.
4. **State your plan in 1–2 sentences** before building, so the direction can be corrected cheaply.

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 + Babel (React Compiler) |
| Voice / real-time | `livekit-client` + `@livekit/components-react` |
| Generative UI | `@openuidev/react-lang` + `@openuidev/react-ui` |
| Styling | **Plain CSS** (single file: `widget.css`) |
| Runtime | Bun (dev / build) |

**No** Tailwind, no CSS-in-JS, no Sass, no routing, no state library.

## Color system

Defined as CSS custom properties at `:root` in `widget.css`. Never hard-code hex values in components.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0b1b3a` | Primary text colour |
| `--blue` | `#1b4298` | Primary blue — buttons, header, start/retry buttons |
| `--blue-bright` | `#2d6be1` | Bright accent — user bubble bg, send button, focus rings, active highlights |
| `--blue-soft` | `#eaf0fc` | Light blue tint — header gradient, mute button bg, OpenUI card headers |
| `--border` | `#e2e8f5` | Borders, dividers, hairline separators |
| `--muted` | `#64748b` | Muted text — timestamps, status labels, captions, placeholders |
| `--danger` | `#e5484d` | Errors, end-call button, mic-muted state |
| `--radius` | `20px` | Global card border radius |
| `--font` | `ui-sans-serif, system-ui, ...` | Font stack |

Additional hard-coded colours (used sparingly):
- White `#fff` — card background, agent bubble text
- Green `#22c55e` — connected dot + pulse animation
- Light gray `#f1f5f9` — agent message bubble background
- Light red `#fdeaea` — muted mic / error icon backgrounds
- Light blue `#f8faff` — input field background

## Component architecture

```
createRoot → <App>
  └── <Widget>                    [state machine: idle → connecting → connected / error]
      ├── header (.vw-head)       [agent name + connection status dot]
      │
      ├── [idle state]
      │   ├── .vw-orb             [animated breathing gradient orb]
      │   ├── .vw-error           [error message text, shown on error]
      │   └── button              ["Start call" / "Connecting…"]
      │
      └── [connected state — LiveKitRoom]
          └── <ErrorBoundary>     [catches render errors, shows retry UI]
               └── <LiveKitRoom>
                   ├── <RoomAudioRenderer />
                   ├── <StartAudio />
                   ├── .vw-body (scrollable)
                   │   ├── <Transcript />     [unified: messages + transcriptions + OpenUI cards]
                   │   └── <Visualizer />     [compact BarVisualizer + status label]
                   └── <Controls />           [text input + mic toggle + end call]
```

### Key components

| Component | File | Role |
|---|---|---|
| `Widget` | `Widget.tsx` | Orchestrator — fetches token, manages connection state machine |
| `Transcript` | `Transcript.tsx` | Unified chat feed: merges `useChat()` + `useTranscriptions()` + `ui.render` OpenUI cards into a single timestamp-sorted list; auto-scrolls; handles minimize/dismiss on UI cards |
| `Visualizer` | `Visualizer.tsx` | Renders compact `<BarVisualizer>` from LiveKit with 5 bars + state label |
| `Controls` | `Controls.tsx` | Text input + send, mic mute/unmute toggle, end-call button; inline SVG icons |
| `ErrorBoundary` | `ErrorBoundary.tsx` | Class component; catches render errors; shows "Try Again" button |

## Layout

The widget is an **iframe-embedded card**, not a full-page app:

```
┌──────────────────────────────────────┐
│ .vw-card (max-width: 420px)          │  ← border, shadow, flex column, full height
│ ┌──────────────────────────────────┐ │
│ │ header                           │ │  ← gradient bg (blue-soft → white), border-bottom
│ │ [dot]  Voice Assistant           │ │
│ └──────────────────────────────────┘ │
│                                       │
│ ┌──────────────────────────────────┐ │
│ │ .vw-body (flex: 1, scrollable)  │ │
│ │ ┌────────────────────────────┐  │ │
│ │ │ .vw-transcript             │  │ │  ← grows with content
│ │ │ [agent ← left, user → right]│  │ │
│ │ │ [OpenUI cards inline]    │  │ │
│ │ └────────────────────────────┘  │ │
│ │ ┌────────────────────────────┐  │ │
│ │ │ .vw-visualizer             │  │ │  ← compact, no flex-grow
│ │ │ [5 bars + status label]    │  │ │
│ │ └────────────────────────────┘  │ │
│ └──────────────────────────────────┘ │
│                                       │
│ ┌──────────────────────────────────┐ │
│ │ .vw-controls                     │ │  ← border-top, fixed bottom
│ │ [text input] [send]              │ │
│ │ [mute/unmute] [end]             │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

- `max-width: 420px`, `width: 100%` — shrinks on smaller viewports but is not responsive beyond that
- `min-height: 480px` ensures minimum usable space
- Transparent `body` background so the host page shows through
- The embed host typically uses a 420×600 iframe with `allow="microphone"`

## State machine

```
idle → (click "Start call") → connecting → (token received) → connected
  ↑                              ↓ (error)                       ↓
  └──────────────────────────── error ←───────────────────── disconnect
```

State is managed with `useState` in `Widget.tsx`:
- `idle` — shows gradient orb + "Start call" button
- `connecting` — orb animation speeds up, button shows "Connecting…" (disabled)
- `connected` — renders `<LiveKitRoom>` with all child components
- `error` — shows error message, allows retry

## Voice & transcription

### Connection flow

1. User clicks "Start call" → `fetchToken()` → `POST VITE_TOKEN_ENDPOINT`
2. Backend returns `{ token, url }` → stored as `creds`
3. `<LiveKitRoom>` connects using the token + URL
4. `onConnected` sets status to `connected`; `onDisconnected` / `onError` resets to idle/error

### Microphone

- Controlled via `localParticipant.setMicrophoneEnabled()` in `Controls.tsx`
- Mute button shows `MicOn` / `MicOff` SVGs, toggles `aria-pressed`
- Requires `allow="microphone"` on the embedding iframe

### Voice assistant states

`useVoiceAssistant()` returns `state` which can be: `connecting`, `initializing`, `listening`, `thinking`, `speaking`. Displayed as a label in the visualizer area. The `<BarVisualizer>` shows animated bars when an audio track is present.

### Transcription

- `useTranscriptions()` from `@livekit/components-react` subscribes to `lk.transcription` topic
- `useChat()` provides typed chat messages on `lk.chat` topic
- `<Transcript />` merges chat + transcriptions + OpenUI UI cards into a single timestamp-sorted array, so everything appears in chronological order (like ChatGPT/Claude conversation flow)
- Agent identity is determined by comparing against `localParticipant.identity` (via `useLocalParticipant`), not by hardcoded strings — fixes misalignment when the backend assigns different participant identities
- Messages show: label ("You" / agent name), text, time
- Agent bubbles: left-aligned, light gray bg (`#f1f5f9`), dark text
- User bubbles: right-aligned, blue bg (`--blue-bright`), white text
- OpenUI cards appear inline right after the agent's text message, not in a separate section below
- Bubbles have asymmetric border-radius (squared corner toward edge)
- Auto-scrolls on new content; respects manual scroll position

### Chat

Text input in `Controls.tsx` uses `send()` from `useChat()` to send typed messages.

## OpenUI generative UI

- Agent pushes UI data on topic `ui.render` via `room.registerTextStreamHandler('ui.render', ...)`
- `<Transcript />` registers this handler alongside its chat/transcription listeners, so UI cards flow into the same timestamp-sorted feed as text messages
- Each card has a collapsible header (minimize/expand + dismiss)
- Cards are styled with `vw-openui-*` classes; OpenUI component internals are reset (no shadow, no border, no padding) to keep them clean inside the widget
- Refer to `FRONTEND_AGENT.md` for the full OpenUI Lang specification and examples (tables, charts, cards, callouts, follow-up buttons, steps, tabs, accordions, and more)

## CSS conventions

- **Single file**: All widget styles in `src/widget/widget.css` (428 lines)
- **Namespace prefix**: All classes prefixed `vw-` (e.g. `vw-card`, `vw-msg`, `vw-btn`) to avoid collisions in embedded context
- **Custom properties**: Colours defined at `:root`, referenced via `var(--token)` everywhere
- **Animations**: `vw-breathe` (idle orb), `vw-pulse` (connected dot), `vw-msg-in` (message fade-in-slide-up)
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables orb/dot animations
- **Vendor overrides**: LiveKit `--lk-*` variables overridden in `.vw-bars`; OpenUI card styles reset in `.vw-openui-body`
- **Inline SVG icons**: No icon library — SVG elements defined as React components in `Controls.tsx`

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_TOKEN_ENDPOINT` | Backend URL for POST token request |
| `VITE_LIVEKIT_URL` | Fallback LiveKit server URL |
| `VITE_AGENT_NAME` | Display name in header (default: "Voice Assistant") |

## Accessibility

- Buttons have `aria-label` descriptions
- Mute toggle uses `aria-pressed` for state
- Decorative SVGs use `aria-hidden="true"`
- `prefers-reduced-motion` media query disables animations
- No `aria-live` region on transcript (note: this is a gap)

## Build checklist (self-critique before calling it done)

- [ ] Read the actual component(s) and `widget.css` before editing (Step 0).
- [ ] All colours come from CSS custom properties, not scattered hex values.
- [ ] New CSS classes follow the `vw-` namespace convention.
- [ ] The widget still fits in a 420×600 iframe with no horizontal scroll.
- [ ] Agent vs. user message bubbles are visually distinct (left/light vs. right/blue).
- [ ] Voice assistant states are displayed correctly (connecting → listening → thinking → speaking).
- [ ] Transcript auto-scrolls on new content; manual scroll position is respected.
- [ ] Tap targets are ≥44px on touchable elements.
- [ ] Keyboard focus states are visible (`:focus-visible` on buttons).
- [ ] Reduced-motion preference is respected for animations.
- [ ] Inline SVGs have `aria-hidden="true"`; interactive elements have `aria-label`.
