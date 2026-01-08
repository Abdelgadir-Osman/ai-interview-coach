# PROMPTS_RUNTIME.md

This document contains the **runtime prompts used by the AI Interview Coach** when calling Workers AI. Prompts are designed to be:

- strict JSON (machine-parseable)
- concise and interview-realistic
- robust against formatting drift
- explicit about rubrics and expectations

## Table of Contents

1. [Question Generation Prompts](#question-generation-prompts)
2. [Grading Prompts](#grading-prompts)
3. [Rubrics](#rubrics)

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

## Rubrics

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

## Runtime behavior notes (implementation)

The Worker enforces:
- strict JSON parsing (with one retry asking for JSON-only)
- transcript trimming to control token usage
- fallbacks when the model is unavailable

