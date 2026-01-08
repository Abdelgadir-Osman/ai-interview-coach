# AI Interview Coach

[![Deploy to Cloudflare](https://github.com/yourusername/ai-interview-coach/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/ai-interview-coach/actions/workflows/deploy.yml)

An AI-powered interview coaching application built on Cloudflare that runs mock interviews (behavioral + technical), grades answers with a structured rubric, remembers your weak spots, and adapts subsequent questions to help you improve.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-interview-coach.git
cd ai-interview-coach

# Setup Worker
cd worker
npm install
npx wrangler login

# Setup Web App
cd ../apps/web
npm install

# Start development
npm run dev
```

See [ENABLE_AI.md](./ENABLE_AI.md) for enabling Workers AI and [DEPLOY.md](./DEPLOY.md) for deployment instructions.

## 🎯 Overview

This application helps candidates prepare for technical and behavioral interviews by:

- **Running mock interviews** in behavioral, technical, or mixed modes
- **Grading answers** using STAR methodology (Situation, Task, Action, Result) + clarity + impact
- **Tracking weaknesses** across sessions and adapting questions to focus on improvement areas
- **Providing actionable feedback** with scores, strengths, improvements, and rewrites

Built entirely on Cloudflare's platform using Workers AI (Llama 3.3), Durable Objects for state management, Workers for API coordination, and Pages for the chat interface.

## 🏗️ Architecture

```
┌─────────────────┐
│  Cloudflare     │
│     Pages       │◄─── User
│   (React UI)    │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Cloudflare    │
│    Worker       │
│   (API Routes)  │
└────┬─────────┬──┘
     │         │
     │         │
     ▼         ▼
┌─────────┐ ┌──────────┐
│ Workers │ │ Durable  │
│   AI    │ │ Objects  │
│ (Llama) │ │ (Memory) │
└─────────┘ └──────────┘
```

### Components

- **Cloudflare Pages** (`apps/web/`): React + Vite frontend with real-time chat interface
- **Cloudflare Worker** (`worker/src/index.ts`): API coordinator handling `/api/chat`, `/api/reset`, `/api/summary`
- **Durable Objects** (`worker/src/MemoryDO.ts`): Persistent state management for sessions, transcripts, signals, and stats
- **Workers AI** (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`): LLM for question generation and answer grading

## ✅ Requirements Compliance

All 4 Cloudflare AI application requirements are met:

1. ✅ **LLM**: Workers AI with Llama 3.3
2. ✅ **Workflow/Coordination**: Worker + Durable Objects for multi-step coordination
3. ✅ **User Input**: Cloudflare Pages chat interface
4. ✅ **Memory/State**: Durable Objects with persistent session storage

See [REQUIREMENTS.md](./REQUIREMENTS.md) for detailed verification.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment)
- Wrangler CLI: `npm install -g wrangler`

### Local Development

#### 1. Start the Worker

```bash
cd worker
npm install
npm run dev
```

The Worker will start on `http://localhost:8787` in local mode.

**Note**: For full AI functionality, you may need to run in remote mode (`npm run dev:remote`) after authenticating with Cloudflare and registering a workers.dev subdomain.

**📖 See [ENABLE_AI.md](./ENABLE_AI.md) for detailed steps to enable Workers AI.**

#### 2. Start the Pages UI

```bash
cd apps/web
npm install
npm run dev
```

The UI will start on `http://localhost:5173` with proxy to the Worker at `http://localhost:8787`.

#### 3. Open the Application

Navigate to `http://localhost:5173` in your browser and start chatting!

## 📡 API Documentation

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

## 🤝 Contributing

This is a demonstration project. For production use, consider:

- Adding authentication
- Implementing rate limiting
- Adding more granular error handling
- Expanding the rubric for different interview types
- Adding voice input support
- Implementing session export/import

## 📄 License

Original work only. See project requirements.

---

**Built with ❤️ on Cloudflare**

