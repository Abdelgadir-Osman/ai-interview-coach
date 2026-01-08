# AI Prompts Documentation

This document logs the AI prompts used in building and operating the AI Interview Coach application. All prompts are designed for use with Workers AI (Llama 3.3) via structured JSON output.

## Table of Contents

1. [Question Generation Prompts](#question-generation-prompts)
2. [Grading Prompts](#grading-prompts)
3. [Prompt Engineering Decisions](#prompt-engineering-decisions)

## Question Generation Prompts

### System Prompt

**Location**: `worker/src/prompts.ts` - `questionSystemPrompt()`

```
You are an AI interview coach.
Your job: ask ONE interview question at a time and tailor it to the candidate's profile and weaknesses.
Keep questions realistic for a real interview and appropriate to the level.
Output ONLY valid JSON matching this schema:
{
  "question": string,
  "rubric_focus": string
}
```

### User Prompt Template

**Location**: `worker/src/prompts.ts` - `buildQuestionMessages()`

```
Mode: {mode}
Target role: {targetRole}
Level: {level}
Focus areas (if any): {focus.join(", ") || "none"}
Weakness signals (higher means more frequent): {JSON.stringify(signals)}
Recently asked (avoid repeating):
- {lastTopics.join("\n- ")}
Ask the next question now.
```

**Example Input**:
```
Mode: behavioral
Target role: Software Engineering Intern
Level: intern
Focus areas (if any): metrics
Weakness signals (higher means more frequent): {"missing_metrics":3,"weak_result":2,"unclear_task":0,"rambling":1}
Recently asked (avoid repeating):
- Tell me about a time you faced a tight deadline...
- Describe a challenging project...
Ask the next question now.
```

**Expected Output**:
```json
{
  "question": "Tell me about a project where you had to collaborate with a team. What was your specific role, what challenges did you face, and how did you measure success?",
  "rubric_focus": "Use STAR format, include specific metrics or quantifiable outcomes, and clarify your personal contribution."
}
```

## Grading Prompts

### System Prompt

**Location**: `worker/src/prompts.ts` - `gradeSystemPrompt()`

```
You are an interview grader and coach.
Return STRICT JSON only. No markdown, no commentary.
Use 0-10 scores. Be fair but demanding.
Schema:
{
  "overallScore": number,
  "star": {"situation": number, "task": number, "action": number, "result": number},
  "clarity": number,
  "impact": number,
  "strengths": string[],
  "improvements": string[],
  "missing": string[],
  "improvedAnswer": string,
  "signalUpdates": {"missing_metrics"?: number, "weak_result"?: number, "unclear_task"?: number, "rambling"?: number},
  "nextQuestionStrategy": string
}
```

### User Prompt Template

**Location**: `worker/src/prompts.ts` - `buildGradeMessages()`

```
Mode: {mode}
Target role: {targetRole}
Level: {level}
Focus: {focus.join(", ") || "none"}

Interview question:
{questionText}

Rubric:
{rubric}

Candidate answer:
{answerText}
```

**Example Input**:
```
Mode: behavioral
Target role: Software Engineering Intern
Level: intern
Focus: metrics

Interview question:
Tell me about a time you faced a tight deadline. What was the situation, what was your task, what actions did you take, and what was the result?

Rubric:
Grade the answer 0-10 using STAR + communication:
- Situation: context is clear
- Task: goal/responsibility is explicit
- Action: concrete steps, ownership, tradeoffs
- Result: measurable outcome + reflection
- Clarity: structured, concise
- Impact: scale, metrics, stakes

Candidate answer:
I had to finish a project in two days. I worked hard and got it done on time.
```

**Expected Output**:
```json
{
  "overallScore": 4,
  "star": {"situation": 5, "task": 4, "action": 3, "result": 3},
  "clarity": 6,
  "impact": 2,
  "strengths": ["Concise response", "Addressed the deadline"],
  "improvements": ["Add specific actions taken", "Include measurable results", "Provide more context"],
  "missing": ["Key metrics", "Specific actions", "Quantifiable results"],
  "improvedAnswer": "I faced a tight deadline when our team had 2 days to deliver a feature that normally takes a week. My task was to implement the backend API endpoints. I broke down the work into smaller tasks, focused on core functionality first, and worked 10-hour days to complete it. The result was that we delivered on time and the feature handled 1,000 requests per minute without errors. I learned the importance of prioritization and time management.",
  "signalUpdates": {"missing_metrics": 1, "weak_result": 1, "unclear_task": 1},
  "nextQuestionStrategy": "Ask follow-ups that require specific actions and measurable results."
}
```

## Rubric Prompts

### Behavioral/Mixed Mode Rubric

**Location**: `worker/src/prompts.ts` - `rubricForMode()`

```
Grade the answer 0-10 using STAR + communication:
- Situation: context is clear
- Task: goal/responsibility is explicit
- Action: concrete steps, ownership, tradeoffs
- Result: measurable outcome + reflection
- Clarity: structured, concise
- Impact: scale, metrics, stakes
```

### Technical Mode Rubric

```
Grade the answer 0-10 based on:
- correctness/feasibility of approach
- clarity of explanation
- tradeoffs and complexity discussion
- structured communication (steps, assumptions)
- impact (realism, constraints, edge cases)
```

## Prompt Engineering Decisions

### 1. Structured JSON Output

**Decision**: Require strict JSON schema with retry logic on parse failure.

**Rationale**: 
- Ensures reliable parsing and type safety
- Prevents markdown formatting issues
- Allows for structured data extraction

**Implementation**:
- Primary attempt: Normal prompt with schema
- Retry attempt: Add "Return ONLY valid JSON. No markdown. No extra keys."
- Fallback: Hardcoded minimal grade/question

### 2. Context in Prompts

**Decision**: Include mode, role, level, focus areas, and signals in all prompts.

**Rationale**:
- Allows AI to tailor questions and grading to candidate profile
- Enables adaptive questioning based on accumulated weaknesses
- Provides context for appropriate difficulty level

### 3. Weakness Signals

**Decision**: Track aggregated counters (missing_metrics, weak_result, unclear_task, rambling).

**Rationale**:
- Simple aggregation mechanism that doesn't require complex analysis
- Allows AI to see patterns across multiple answers
- Enables adaptive question generation focused on improvement areas

### 4. Transcript Trimming

**Decision**: Keep only last 20 messages in transcript.

**Rationale**:
- Controls token usage and costs
- Maintains recent context without overwhelming the model
- Prevents token limit errors

### 5. Question Avoidance

**Decision**: Include recently asked questions in prompt to avoid repetition.

**Rationale**:
- Prevents asking the same question multiple times
- Ensures variety in interview experience
- Maintains engagement

### 6. Fallback Logic

**Decision**: Use hardcoded fallbacks when AI is unavailable or fails.

**Rationale**:
- Ensures application works even when AI binding is unavailable
- Allows for graceful degradation
- Useful for local development without Cloudflare account

**Fallback Question (Behavioral)**:
```
Tell me about a time you faced a tight deadline. What was the situation, what was your task, what actions did you take, and what was the result?
```

**Fallback Question (Technical)**:
```
Design a rate limiter for an API. Walk me through your approach, data structures, and tradeoffs (burstiness, distributed instances, and storage).
```

**Fallback Grade**:
- Overall Score: 5/10
- Generic strengths and improvements
- Signal updates: missing_metrics: 1, weak_result: 1

## Prompt Usage Summary

| Prompt Type | Model | Temperature | Max Tokens | Use Case |
|------------|-------|-------------|------------|----------|
| Question Generation | Llama 3.3 70B | 0.6 | 900 | Generate adaptive interview questions |
| Answer Grading | Llama 3.3 70B | 0.6 | 900 | Grade answers with structured rubric |

## Future Improvements

- **Fine-tuning**: Could fine-tune a smaller model on interview Q&A datasets
- **Multi-turn context**: Could include more conversation history when available
- **Personalization**: Could add user preferences for question difficulty/style
- **Specialized prompts**: Could add role-specific prompts (e.g., frontend vs backend)
- **Prompt versioning**: Could version prompts and track performance metrics

---

**Note**: All prompts were designed and refined using AI assistance (transparently documented as per project requirements).

