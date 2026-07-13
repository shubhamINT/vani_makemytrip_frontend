# Vani — LiveKit Voice Agent Widget

An embeddable voice-agent widget (React + Vite). Drop it into any site with an
`<iframe>`; it connects to your LiveKit backend agent for voice + text chat.

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
```

## Controls
- **Start call** — fetches a token from your backend and connects.
- **Mute / Unmute** — toggles your microphone.
- **Text input** — type a message to the agent.
- **End** — disconnects.

## Setup

```bash
bun install
cp .env.example .env    # set VITE_TOKEN_ENDPOINT to your backend token URL
bun dev
```

The frontend calls your token endpoint as:

```
GET {VITE_TOKEN_ENDPOINT}?room=voice-agent&identity=web-xxxx
→ { "token": "<jwt>", "url": "wss://your-livekit-host" }
```

`participantToken`/`serverUrl` keys are also accepted. Named **agent dispatch**
is handled by your backend when it mints the token — the frontend just connects.

Edit `src/widget/useToken.ts` if your endpoint's shape differs (one place).

## Embed in another site

```html
<iframe src="https://your-deploy-url/" allow="microphone"
        style="border:0; width:420px; height:600px"></iframe>
```

`allow="microphone"` is **required** — without it the browser blocks mic access
inside the frame. Local demo: `bun dev`, then open `/embed-test.html`.

## Build

```bash
bun run build   # tsc + vite → dist/  (deploy dist/ anywhere static)
```
