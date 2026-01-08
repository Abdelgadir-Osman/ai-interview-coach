# PROMPTS.md

These prompts reflect **high-level scaffolding, review, and refinement requests** used during development. All core logic, architectural decisions, and final implementations were authored and validated by the developer.

---

## Architecture & Planning

Help outline an AI interview coach built on Cloudflare using Workers, Durable Objects, Workers AI (Llama 3.3), and Pages. Focus on data flow, state management, and coordination logic.

---

## Durable Object State Design

Propose a Durable Object state schema for an interview session that tracks interview mode, conversation history, scoring metrics, and adaptive weakness signals.

---

## Interview Question Generation

You are an interview coach.

Given a target role, interview mode, and recent weaknesses, generate one interview question that targets improvement areas.

Return JSON only:
```json
{ "question": string, "rubric_focus": string }
```

---

## Answer Grading

Grade an interview answer using STAR (behavioral) or technical depth criteria.

Return JSON only with:
- overallScore
- strengths
- improvements
- missing elements
- an improved example answer
- suggested focus for the next question

---

## Backend Coordination Review

Review a Cloudflare Worker flow that loads session state from a Durable Object, calls Workers AI, updates scoring signals, and returns feedback. Suggest improvements for reliability and error handling.

---

## Frontend Scaffolding

Suggest a minimal React + TypeScript chat interface that integrates with a Cloudflare Worker API and displays interview feedback and progress.

---

## Error Handling

List edge cases to consider when parsing LLM JSON responses and managing session state in a Durable Object.

---

## Documentation Review

Review the README for clarity and suggest improvements for a technical reviewer.
