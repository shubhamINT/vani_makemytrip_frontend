# Vaani — LiveKit Voice Agent Widget

An embeddable voice-agent widget (React + Vite) that you can drop into **any**
website. It connects to your LiveKit backend agent for voice + text chat and
renders OpenUI generative UI cards inline.

## Project Structure

```
src/
├── main.tsx               # React entry point
├── App.tsx                # Root component — renders <Widget />
├── index.css              # Global resets, transparent bg
└── widget/                # All UI lives here
    ├── Widget.tsx         # Orchestrator: state machine, token fetch, LiveKitRoom
    ├── Transcript.tsx     # Unified chat feed: messages + transcriptions + OpenUI cards
    ├── Visualizer.tsx     # LiveKit BarVisualizer + voice-assistant state label
    ├── Controls.tsx       # Text input, mic toggle, end-call button
    ├── ErrorBoundary.tsx  # Catches render errors, shows retry UI
    ├── useToken.ts        # Token fetch + response parsing from backend
    ├── useToken.check.ts  # Assertion tests for parseTokenResponse
    └── widget.css         # All component styles (single file, vw- namespace)

public/
├── embed.js               # Self-contained embed script (recommended)
└── embed-test.html        # Demo page showing both embed methods
```

## Controls
- **FAB button** — floating action button (bottom-right); click to fetch a token and connect.
- **Mute / Unmute** — toggles your microphone.
- **Text input** — type a message to the agent.
- **End** — disconnects.

## Setup

```bash
bun install
cp .env.example .env    # set VITE_TOKEN_ENDPOINT to your backend token URL
bun dev
```

The frontend calls your token endpoint as a POST with JSON body:
```json
{ "agent_name": "voice-agent" }
```
Expected response: `{ "token": "<jwt>", "url": "wss://your-livekit-host" }`

Edit `src/widget/useToken.ts` if your endpoint's shape differs (one place).

## Embed in another site

Two approaches — pick the one that fits your host page.

### A — Script embed (recommended, no CSS/JS work)

Include one `<script>` tag. The widget appears as a floating FAB at bottom-right
and expands to a full chat panel when active. Sizing is automatic.

```html
<script src="https://your-deploy-url/embed.js"></script>
```

For a custom deployment URL:
```html
<script src="https://your-deploy-url/embed.js" data-src="https://your-domain.com"></script>
```

### B — Simple `<iframe>` tag (no JS)

Works everywhere. Width/height are fixed, so the FAB sits in the bottom-right
corner of the iframe with transparent space above.

```html
<iframe src="https://your-deploy-url/"
  allow="microphone; autoplay"
  title="Vaani Voice Assistant"
  style="
    position: fixed;
    bottom: 0;
    right: 0;
    border: 0;
    width: 420px;
    height: 750px;
    z-index: 2147483647;
    background: transparent;
  ">
</iframe>
```

### Requirements

| Requirement | Detail |
|---|---|
| `allow="microphone; autoplay"` | **Required** on the iframe — without it the browser blocks mic access and audio playback |
| CORS | Your token endpoint must include `Access-Control-Allow-Origin: *` (or your host origin) |
| `sandbox` | If your host page uses a restrictive `sandbox`, include `allow-scripts allow-same-origin allow-popups` |

## Embed API (postMessage)

The widget communicates with the host page via `window.postMessage`.

### Widget → Host

| Event | When | Payload |
|---|---|---|
| `vani:ready` | Widget loaded and initialised | `{ type: 'vani:ready' }` |
| `vani:resize` | Panel opened or closed | `{ type: 'vani:resize', mode: 'collapsed' \| 'open' }` |
| `vani:state` | Connection state changed | `{ type: 'vani:state', status: 'idle' \| 'connecting' \| 'connected' \| 'error' }` |

### Host → Widget

| Command | Payload | Effect |
|---|---|---|
| `vani:start` | `{ type: 'vani:start' }` | Initiates token fetch and connection |
| `vani:end` | `{ type: 'vani:end' }` | Disconnects and resets to idle |

## Local demo

```bash
bun dev
```

Open `http://localhost:5173/embed-test.html` to see both embed methods in action.

## Build

```bash
bun run build   # tsc + vite → dist/  (deploy dist/ anywhere static)
```
