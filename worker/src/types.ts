export type InterviewMode = "behavioral" | "technical" | "mixed";
export type CandidateLevel = "intern" | "newgrad" | "mid";

export type TranscriptRole = "system" | "user" | "assistant";

export interface TranscriptMessage {
	role: TranscriptRole;
	content: string;
	ts: number;
}

export interface CoachingSignals {
	missing_metrics: number;
	weak_result: number;
	unclear_task: number;
	rambling: number;
}

export interface Stats {
	questionsAnswered: number;
	avgScore: number;
	lastScores: number[]; // keep last 10
}

export interface LastQuestion {
	text: string;
	rubric: string;
	askedAt: number;
}

export interface SessionState {
	sessionId: string;
	mode: InterviewMode;
	targetRole: string;
	level: CandidateLevel;
	focus: string[];
	signals: CoachingSignals;
	stats: Stats;
	lastQuestion?: LastQuestion;
}

export interface GradeJson {
	overallScore: number; // 0..10
	star?: {
		situation?: number;
		task?: number;
		action?: number;
		result?: number;
	};
	clarity?: number; // 0..10
	impact?: number; // 0..10
	missing?: string[];
	strengths?: string[];
	improvements?: string[];
	improvedAnswer?: string;
	signalUpdates?: Partial<CoachingSignals>;
	nextQuestionStrategy?: string;
}

export interface SessionData {
	state: SessionState;
	messages: TranscriptMessage[];
	lastGrade?: GradeJson;
}

export interface ChatRequest {
	sessionId?: string;
	message?: string;
	mode?: InterviewMode;
	targetRole?: string;
	level?: CandidateLevel;
	focus?: string[];
}

export interface ChatResponse {
	sessionId: string;
	reply: string;
	stats: {
		avgScore: number;
		lastScores: number[];
		currentFocus: string;
		questionsAnswered: number;
	};
	lastGrade?: GradeJson;
}


