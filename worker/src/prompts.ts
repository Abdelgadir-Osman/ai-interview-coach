import type { CandidateLevel, CoachingSignals, InterviewMode, TranscriptMessage } from "./types";

export function rubricForMode(mode: InterviewMode): string {
	if (mode === "technical") {
		return [
			"Grade the answer 0-10 based on:",
			"- correctness/feasibility of approach",
			"- clarity of explanation",
			"- tradeoffs and complexity discussion",
			"- structured communication (steps, assumptions)",
			"- impact (realism, constraints, edge cases)",
		].join("\n");
	}

	// behavioral + mixed both lean on STAR
	return [
		"Grade the answer 0-10 using STAR + communication:",
		"- Situation: context is clear",
		"- Task: goal/responsibility is explicit",
		"- Action: concrete steps, ownership, tradeoffs",
		"- Result: measurable outcome + reflection",
		"- Clarity: structured, concise",
		"- Impact: scale, metrics, stakes",
	].join("\n");
}

export function questionSystemPrompt(): string {
	return [
		"You are an AI interview coach.",
		"Your job: ask ONE interview question at a time and tailor it to the candidate's profile and weaknesses.",
		"Keep questions realistic for a real interview and appropriate to the level.",
		"Output ONLY valid JSON matching this schema:",
		"{",
		'  "question": string,',
		'  "rubric_focus": string',
		"}",
	].join("\n");
}

export function buildQuestionMessages(args: {
	mode: InterviewMode;
	targetRole: string;
	level: CandidateLevel;
	focus: string[];
	signals: CoachingSignals;
	recentMessages: TranscriptMessage[];
}): Array<{ role: "system" | "user"; content: string }> {
	const { mode, targetRole, level, focus, signals, recentMessages } = args;
	const lastTopics = recentMessages
		.filter((m) => m.role === "assistant")
		.slice(-6)
		.map((m) => m.content.slice(0, 140));

	return [
		{ role: "system", content: questionSystemPrompt() },
		{
			role: "user",
			content: [
				`Mode: ${mode}`,
				`Target role: ${targetRole}`,
				`Level: ${level}`,
				`Focus areas (if any): ${focus.length ? focus.join(", ") : "none"}`,
				`Weakness signals (higher means more frequent): ${JSON.stringify(signals)}`,
				lastTopics.length ? `Recently asked (avoid repeating):\n- ${lastTopics.join("\n- ")}` : "",
				"Ask the next question now.",
			]
				.filter(Boolean)
				.join("\n"),
		},
	];
}

export function gradeSystemPrompt(): string {
	return [
		"You are an interview grader and coach.",
		"Return STRICT JSON only. No markdown, no commentary.",
		"Use 0-10 scores. Be fair but demanding.",
		"Schema:",
		"{",
		'  "overallScore": number,',
		'  "star": {"situation": number, "task": number, "action": number, "result": number},',
		'  "clarity": number,',
		'  "impact": number,',
		'  "strengths": string[],',
		'  "improvements": string[],',
		'  "missing": string[],',
		'  "improvedAnswer": string,',
		'  "signalUpdates": {"missing_metrics"?: number, "weak_result"?: number, "unclear_task"?: number, "rambling"?: number},',
		'  "nextQuestionStrategy": string',
		"}",
	].join("\n");
}

export function buildGradeMessages(args: {
	mode: InterviewMode;
	questionText: string;
	rubric: string;
	answerText: string;
	targetRole: string;
	level: CandidateLevel;
	focus: string[];
}): Array<{ role: "system" | "user"; content: string }> {
	const { mode, questionText, rubric, answerText, targetRole, level, focus } = args;

	return [
		{ role: "system", content: gradeSystemPrompt() },
		{
			role: "user",
			content: [
				`Mode: ${mode}`,
				`Target role: ${targetRole}`,
				`Level: ${level}`,
				`Focus: ${focus.length ? focus.join(", ") : "none"}`,
				"",
				"Interview question:",
				questionText,
				"",
				"Rubric:",
				rubric,
				"",
				"Candidate answer:",
				answerText,
			].join("\n"),
		},
	];
}


