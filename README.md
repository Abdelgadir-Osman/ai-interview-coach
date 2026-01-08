# AI Interview Coach

[![Deploy to Cloudflare](https://github.com/Abdelgadir-Osman/ai-interview-coach/actions/workflows/deploy.yml/badge.svg)](https://github.com/Abdelgadir-Osman/ai-interview-coach/actions/workflows/deploy.yml)

An interview coaching app that runs mock interviews (behavioral + technical), grades answers with a rubric, tracks recurring weaknesses, and adapts future questions to help you improve. Built on Cloudflare (Pages + Workers + Durable Objects + Workers AI).

## 🚀 Try it (preferred)

- **Web app**: `https://interview-coach.pages.dev`
- **Worker API**: `https://worker.o-abdelgadir32.workers.dev`

### What to try in the UI
- **Guided onboarding**: choose mode → set role → optional focus → Start
- **Quick action chips**: Start / Summary / Focus / Reset
- **Scorecard** (after you answer): overall + clarity + impact (+ STAR breakdown in behavioral/mixed)
- **Help panel**: commands + mode explanations (scrollable)

## 🧑‍💻 Run locally

### Prereqs
- Node.js 18+ (Node 20 recommended)
- A Cloudflare account (only required if you want real model responses via Workers AI)

### 1) Start the Worker API

```bash
cd worker
npm install
npm run dev
```

This runs the Worker locally at `http://localhost:8787`.

### 2) Start the Web UI

```bash
cd apps/web
npm install
npm run dev
```

This runs the UI at `http://localhost:5173` and proxies `/api/*` to the Worker.

### Using the deployed Worker from local UI (optional)

Set `VITE_API_URL`:

```bash
cd apps/web
VITE_API_URL="https://worker.o-abdelgadir32.workers.dev/api" npm run dev
```

On Windows PowerShell:

```powershell
cd apps/web
$env:VITE_API_URL="https://worker.o-abdelgadir32.workers.dev/api"
npm run dev
```

## 🧠 How it works (high level)

- **Worker (`worker/src/index.ts`)**: coordinates the interview loop and exposes:
  - `POST /api/chat` (chat + commands)
  - `POST /api/reset`
  - `GET /api/summary?sessionId=...`
- **Durable Object (`worker/src/MemoryDO.ts`)**: stores per-session state (mode, role, focus, transcript, signals, stats)
- **Workers AI**: generates the next question and grades answers (strict JSON), then the Worker formats that into feedback + updates state

## 🧩 Commands (type in chat)

- **`/start behavioral|technical|mixed`**: start/continue an interview
- **`/summary`**: performance snapshot
- **`/reset`**: clear session state
- **`/focus <topic>`**: bias feedback/questions (examples: `metrics`, `clarity`, `system-design`)
- **`/role <job title>`**: set target role (example: `/role Product Manager`)

## 📡 API reference (minimal)

### POST /api/chat

Main endpoint for chat interactions.

**Request:**
```json
{
  "sessionId": "optional-session-id",
  "message": "your answer or command",
  "mode": "behavioral" | "technical" | "mixed",
  "targetRole": "Software Engineering Intern",
  "level": "intern" | "newgrad" | "mid",
  "focus": ["metrics", "clarity"]
}
```

**Response:**
```json
{
  "sessionId": "generated-or-provided-id",
  "reply": "question or feedback",
  "stats": {
    "avgScore": 7.5,
    "lastScores": [8, 7, 6],
    "currentFocus": "Add measurable impact/metrics",
    "questionsAnswered": 5
  },
  "lastGrade": {
    "overallScore": 8,
    "star": { "situation": 8, "task": 8, "action": 8, "result": 7 },
    "clarity": 9,
    "impact": 7,
    "strengths": ["Clear situation description", "Good structure"],
    "improvements": ["Add more metrics", "Quantify the impact"],
    "missing": ["Specific numbers", "Measurable outcomes"],
    "improvedAnswer": "Suggested rewrite...",
    "signalUpdates": { "missing_metrics": 1 }
  }
}
```

### POST /api/reset

Clear session data.

**Request:**
```json
{
  "sessionId": "session-id"
}
```

**Response:**
```json
{
  "ok": true
}
```

### GET /api/summary?sessionId=...

Get performance summary.

**Response:**
```json
{
  "sessionId": "session-id",
  "mode": "behavioral",
  "targetRole": "Software Engineering Intern",
  "level": "intern",
  "stats": { ... },
  "currentFocus": "Add measurable impact/metrics",
  "topSignals": [["missing_metrics", 3], ["weak_result", 2]],
  "lastGrade": { ... }
}
```

### Commands

You can use commands in the chat:

- `/start behavioral` - Start a behavioral interview
- `/start technical` - Start a technical interview
- `/start mixed` - Start a mixed interview
- `/reset` - Reset the session
- `/summary` - Show performance summary
- `/focus metrics` - Add "metrics" to focus areas

## 💾 How Memory Works

The application uses Durable Objects to persist state across requests:

- **Session State**: mode, targetRole, level, focus areas
- **Signals**: Aggregated weakness counters (missing_metrics, weak_result, unclear_task, rambling)
- **Stats**: questionsAnswered, avgScore, lastScores (last 10)
- **Transcript**: Rolling message history (trimmed to last 20 messages)
- **Last Question**: Current question and rubric for grading context

Each session is identified by a `sessionId` stored in the browser's localStorage. The Durable Object automatically creates a new session on first access and persists all state changes.

**Adaptive Questioning**: Based on accumulated signals (e.g., frequent "missing_metrics"), the AI adapts future questions to focus on improving those specific areas.

## 🚢 Deployment

### Deploy Worker

```bash
cd worker
wrangler login
wrangler deploy
```

Note the deployed Worker URL (e.g., `https://worker.your-subdomain.workers.dev`).

### Deploy Pages

```bash
cd apps/web
npm run build
wrangler pages deploy dist
```

Or connect to a Git repository and enable automatic deployments.

### Configure Pages Environment Variables

In Cloudflare Pages dashboard, set:

```
VITE_API_URL=https://worker.your-subdomain.workers.dev
```

### Update CORS (if needed)

If your Pages domain differs from the Worker domain, update CORS settings in `worker/src/utils.ts`.

## 🧪 Testing with cURL

```bash
# Start a chat session
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "message": "/start behavioral"
  }'

# Answer a question
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "message": "I once faced a tight deadline when..."
  }'

# Get summary
curl "http://localhost:8787/api/summary?sessionId=test-session"
```

## 📁 Project Structure

```
cf_ai_interview_coach/
├── apps/
│   └── web/                  # Pages frontend
│       ├── src/
│       │   ├── App.tsx       # Main chat component
│       │   ├── App.css       # Styles
│       │   └── main.tsx      # React entry
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── worker/                   # Worker backend
│   ├── src/
│   │   ├── index.ts          # API routes & coordination
│   │   ├── MemoryDO.ts       # Durable Object
│   │   ├── prompts.ts        # AI prompt templates
│   │   ├── types.ts          # TypeScript types
│   │   └── utils.ts          # Utilities
│   ├── wrangler.jsonc        # Wrangler config
│   └── package.json
├── README.md                 # This file
├── PROMPTS.md                # AI prompts documentation
├── REQUIREMENTS.md           # Requirements checklist
└── Plan.md                   # Project plan
```

## ⚙️ Configuration

### Worker Configuration (`worker/wrangler.jsonc`)

- **Durable Objects**: `MEMORY_DO` binding for `MemoryDO` class
- **AI Binding**: `AI` binding for Workers AI
- **Migrations**: SQLite migration for Durable Objects

### Pages Configuration (`apps/web/vite.config.ts`)

- **API Proxy**: Proxies `/api/*` to `http://localhost:8787` in development
- **Build Output**: `dist/` directory for deployment

## 🐛 Known Limitations

- **AI Model**: Uses Llama 3.3 via Workers AI. May fall back to hardcoded responses if binding is unavailable.
- **Transcript Limits**: Transcripts are trimmed to last 20 messages to control token usage.
- **Answer Length**: Very long answers (>3000 chars) are truncated with a warning.
- **Local Mode**: Full AI functionality requires remote mode or deployed Worker (local mode has limitations).
- **Rate Limiting**: No built-in rate limiting (add for production use).

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare Agents](https://developers.cloudflare.com/agents/)

## 📄 License

MIT (see `LICENSE`)

