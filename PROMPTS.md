# Build Prompts

This document contains the prompts used to build the AI Interview Coach application. These prompts were designed to guide the development process from initial architecture through implementation and refinement.

## Phase 1: Architecture & Planning

### Initial Project Setup

```
I want to build an AI-powered interview coach application that runs entirely on Cloudflare's platform. The application should:

1. Use Cloudflare Workers for the API backend
2. Use Durable Objects for persistent session state and memory
3. Use Workers AI (Llama 3.3) for generating interview questions and grading answers
4. Use Cloudflare Pages for the frontend chat interface
5. Support multiple interview modes (behavioral, technical, mixed)
6. Provide real-time feedback with scoring, strengths, improvements, and example answers
7. Track conversation history and adapt questions based on candidate weaknesses
8. Include a clean, modern UI with stats visualization

Please create a detailed plan that covers:
- System architecture and data flow
- API endpoints and request/response formats
- Durable Object state structure
- Prompt engineering for question generation and grading
- Frontend component structure
- Deployment strategy
```

### Architecture Refinement

```
Based on the plan, I need to refine the coordination flow. The system should:

1. Start with a welcome message and mode selection
2. Generate questions using Workers AI with context about the candidate's profile and weaknesses
3. Grade answers using a structured rubric (STAR format for behavioral, technical depth for technical)
4. Update weakness signals based on grading results
5. Adapt subsequent questions to target identified weaknesses
6. Provide a summary at the end with overall performance

Please detail:
- The exact state structure for the Durable Object
- The prompt templates for question generation and grading
- The JSON schemas for AI responses
- Error handling and fallback strategies
```

## Phase 2: Backend Implementation

### Worker & Durable Object Setup

```
I need to implement the Cloudflare Worker with the following requirements:

1. Create a Worker that handles API routes:
   - POST /api/chat - Main chat endpoint for questions and answers
   - POST /api/reset - Reset session state
   - GET /api/summary - Get session summary
   - POST /api/role - Update target role
   - GET /api/health - Check Workers AI status

2. Create a Durable Object class (MemoryDO) that stores:
   - Session state (mode, level, targetRole, focus areas)
   - Conversation transcript (trimmed to last N messages)
   - Weakness signals (missing_metrics, weak_result, unclear_task, rambling)
   - Statistics (questionsAsked, averageScore, lastGrade)
   - Last question asked (to avoid repetition)

3. Implement coordination logic:
   - Detect when a new question is needed (empty message or explicit command)
   - Call Workers AI to generate questions with context
   - Call Workers AI to grade answers with structured rubrics
   - Update state after each interaction

Please provide TypeScript implementation with proper error handling, CORS support, and JSON parsing with retry logic.
```

### Prompt Engineering

```
I need to design prompts for Workers AI that:

1. Generate interview questions that:
   - Are tailored to the candidate's target role and level
   - Avoid repeating recently asked questions
   - Target identified weakness areas
   - Return strict JSON: { "question": string, "rubric_focus": string }

2. Grade answers that:
   - Use STAR format for behavioral questions (Situation, Task, Action, Result)
   - Evaluate technical depth for technical questions
   - Score 0-10 on multiple dimensions (overall, STAR components, clarity, impact)
   - Provide actionable feedback (strengths, improvements, missing elements)
   - Include an improved example answer
   - Update weakness signals based on the answer quality
   - Suggest next question strategy

3. Return strict JSON matching this schema:
{
  "overallScore": number,
  "star": {"situation": number, "task": number, "action": number, "result": number},
  "clarity": number,
  "impact": number,
  "strengths": string[],
  "improvements": string[],
  "missing": string[],
  "improvedAnswer": string,
  "signalUpdates": object,
  "nextQuestionStrategy": string
}

Please create prompt templates that are concise, explicit about JSON requirements, and include examples.
```

### Error Handling & Edge Cases

```
I need to handle the following edge cases:

1. Workers AI returns invalid JSON or markdown-wrapped JSON
2. Workers AI is unavailable or rate-limited
3. Conversation transcript exceeds token limits
4. Empty or very short user messages
5. User sends commands like "/reset" or "/summary" mid-conversation
6. Session state corruption or missing fields

Please implement:
- Safe JSON parsing with retry logic (ask AI to return JSON-only on failure)
- Graceful fallbacks when AI is unavailable
- Transcript trimming to keep last N messages
- Input validation and sanitization
- Default state initialization
```

## Phase 3: Frontend Implementation

### UI Design & Components

```
I need to build a React frontend (Vite + TypeScript) for Cloudflare Pages with:

1. A clean, modern chat interface with:
   - Message history with avatars and timestamps
   - Input field with voice-to-text support
   - Mode selector (behavioral, technical, mixed)
   - Role input field for customization
   - Quick action chips for common commands

2. A stats panel showing:
   - Questions asked count
   - Average score
   - Last grade breakdown (scorecard visualization)
   - Performance trends

3. A guided onboarding panel that:
   - Explains what the coach does
   - Shows available modes and their purposes
   - Lists available commands
   - Provides usage tips

4. A top bar with:
   - Brand/logo
   - Connection status indicator
   - Help button

Please implement with:
- Responsive design
- Clean, professional styling (Cloudflare-inspired)
- Proper state management
- Error handling for API calls
- Loading states
```

### Voice Input Integration

```
I need to add voice-to-text functionality using the Web Speech API:

1. Add a microphone button next to the text input
2. Use browser's SpeechRecognition API (with webkit fallback)
3. Show visual feedback when recording (pulsing animation)
4. Handle errors gracefully (browser not supported, permissions denied)
5. Insert transcribed text into the input field

Please implement with proper error handling and cross-browser compatibility.
```

## Phase 4: Testing & Refinement

### Testing Strategy

```
I need a comprehensive testing approach:

1. Create a test checklist covering:
   - API endpoints (chat, reset, summary, health)
   - Question generation and grading accuracy
   - State persistence in Durable Objects
   - UI interactions and edge cases
   - Error handling and fallbacks

2. Create a quick test script (PowerShell) that:
   - Tests the /api/chat endpoint with sample messages
   - Verifies JSON responses
   - Tests session reset
   - Checks health endpoint

Please provide both a manual testing checklist and an automated test script.
```

### UI/UX Improvements

```
Based on user feedback, I need to improve:

1. Mode selector visibility (fix white text on white background)
2. Help documentation (add help panel with commands and mode descriptions)
3. Visual feedback (add scorecard for last grade, improve stats panel)
4. Onboarding (replace welcome message with guided panel)
5. Message presentation (add avatars and timestamps)
6. Quick actions (add command chips for common actions)
7. Global theming (clean up dark mode defaults, improve contrast)

Please implement all these improvements while maintaining a professional, modern aesthetic.
```

## Phase 5: Deployment & Documentation

### Deployment Setup

```
I need to set up deployment:

1. Configure Wrangler for:
   - Worker deployment with Durable Object bindings
   - Pages deployment with build output
   - Environment variables for API URLs

2. Create GitHub Actions workflows for:
   - Automated testing on pull requests
   - Automated deployment to Cloudflare on main branch

3. Set up:
   - Workers AI binding in wrangler.jsonc
   - Pages project in Cloudflare dashboard
   - Environment variables for production

Please provide step-by-step deployment instructions and CI/CD configuration.
```

### Documentation

```
I need comprehensive documentation:

1. README.md with:
   - Project overview and architecture
   - Quick start guide
   - API reference
   - Deployment instructions
   - Troubleshooting guide

2. PROMPTS.md (this file) documenting:
   - The prompts used to build the project
   - Architecture decisions
   - Implementation approach

3. PROMPTS_RUNTIME.md documenting:
   - The actual runtime prompts used by the application
   - Prompt templates and examples
   - Rubric definitions

Please create clear, professional documentation that's accessible to both technical and non-technical readers.
```

## Phase 6: Repository Setup

### GitHub Configuration

```
I need to set up a professional GitHub repository:

1. Create .gitignore for:
   - node_modules
   - dist folders
   - .wrangler
   - .dev.vars
   - Build artifacts

2. Add LICENSE (MIT)

3. Create GitHub Actions workflows:
   - deploy.yml for automated deployment
   - test.yml for type checking and testing

4. Add issue templates:
   - bug_report.md
   - feature_request.md

5. Update README.md with:
   - GitHub badge
   - Clear setup instructions
   - Less technical language for general audience

Please set up all repository infrastructure and ensure the codebase is clean and professional.
```

## Key Design Principles

Throughout the build process, these principles guided development:

1. **Cloudflare-Native**: Leverage Workers, Durable Objects, Workers AI, and Pages for a fully serverless architecture
2. **Type Safety**: Use TypeScript throughout for reliability and maintainability
3. **Structured AI Responses**: Enforce strict JSON schemas for predictable parsing
4. **Adaptive Coaching**: Use weakness signals to personalize the interview experience
5. **Professional UX**: Clean, modern interface that feels production-ready
6. **Error Resilience**: Graceful fallbacks and robust error handling
7. **Documentation First**: Clear documentation for users and developers
