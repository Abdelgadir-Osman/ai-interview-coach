import { DurableObject } from "cloudflare:workers";
import type {
	CoachingSignals,
	SessionData,
	SessionState,
	TranscriptMessage,
} from "./types";
import { now, trimTranscript } from "./utils";

const SESSION_KEY = "session:v1";

function defaultSignals(): CoachingSignals {
	return { missing_metrics: 0, weak_result: 0, unclear_task: 0, rambling: 0 };
}

function defaultState(sessionId: string): SessionState {
	return {
		sessionId,
		mode: "mixed",
		targetRole: "Software Engineering Intern",
		level: "intern",
		focus: [],
		signals: defaultSignals(),
		stats: { questionsAnswered: 0, avgScore: 0, lastScores: [] },
	};
}

export class MemoryDO extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async getSession(sessionId: string): Promise<SessionData> {
		const existing = (await this.ctx.storage.get<SessionData>(SESSION_KEY)) ?? null;
		if (existing) return existing;

		const created: SessionData = {
			state: defaultState(sessionId),
			messages: [],
		};
		await this.ctx.storage.put(SESSION_KEY, created);
		return created;
	}

	async setSession(next: SessionData): Promise<void> {
		// Always enforce transcript trimming on write.
		next.messages = trimTranscript(next.messages, 20);
		await this.ctx.storage.put(SESSION_KEY, next);
	}

	async patchProfile(
		sessionId: string,
		patch: Partial<Pick<SessionState, "mode" | "targetRole" | "level" | "focus">>,
	): Promise<SessionData> {
		const cur = await this.getSession(sessionId);

		const next: SessionData = {
			...cur,
			state: {
				...cur.state,
				mode: patch.mode ?? cur.state.mode,
				targetRole: patch.targetRole ?? cur.state.targetRole,
				level: patch.level ?? cur.state.level,
				focus: patch.focus ?? cur.state.focus,
			},
		};

		await this.setSession(next);
		return next;
	}

	async appendMessage(sessionId: string, role: TranscriptMessage["role"], content: string): Promise<void> {
		const session = await this.getSession(sessionId);
		session.messages.push({ role, content, ts: now() });
		await this.setSession(session);
	}

	async setLastQuestion(sessionId: string, text: string, rubric: string): Promise<void> {
		const session = await this.getSession(sessionId);
		session.state.lastQuestion = { text, rubric, askedAt: now() };
		session.messages.push({ role: "assistant", content: text, ts: now() });
		await this.setSession(session);
	}

	async clearLastQuestion(sessionId: string): Promise<void> {
		const session = await this.getSession(sessionId);
		delete session.state.lastQuestion;
		await this.setSession(session);
	}

	async setLastGrade(sessionId: string, grade: SessionData["lastGrade"]): Promise<void> {
		const session = await this.getSession(sessionId);
		session.lastGrade = grade;
		await this.setSession(session);
	}

	async updateAfterGrade(args: {
		sessionId: string;
		score: number;
		signalUpdates?: Partial<CoachingSignals>;
	}): Promise<SessionData> {
		const session = await this.getSession(args.sessionId);
		const { score, signalUpdates } = args;

		const lastScores = [...session.state.stats.lastScores, score].slice(-10);
		const avg = lastScores.reduce((a, b) => a + b, 0) / (lastScores.length || 1);

		session.state = {
			...session.state,
			signals: {
				missing_metrics: session.state.signals.missing_metrics + (signalUpdates?.missing_metrics ?? 0),
				weak_result: session.state.signals.weak_result + (signalUpdates?.weak_result ?? 0),
				unclear_task: session.state.signals.unclear_task + (signalUpdates?.unclear_task ?? 0),
				rambling: session.state.signals.rambling + (signalUpdates?.rambling ?? 0),
			},
			stats: {
				questionsAnswered: session.state.stats.questionsAnswered + 1,
				lastScores,
				avgScore: Math.round(avg * 10) / 10,
			},
		};

		await this.setSession(session);
		return session;
	}

	async reset(sessionId: string): Promise<void> {
		const next: SessionData = { state: defaultState(sessionId), messages: [] };
		await this.ctx.storage.put(SESSION_KEY, next);
	}
}


