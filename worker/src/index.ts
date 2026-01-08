import { MemoryDO } from "./MemoryDO";
import { buildGradeMessages, buildQuestionMessages, rubricForMode } from "./prompts";
import type { ChatRequest, ChatResponse, GradeJson, InterviewMode, SessionData } from "./types";
import {
	clampScore,
	corsPreflight,
	currentFocusFromSignals,
	formatGradeReply,
	jsonResponse,
	safeJsonParse,
	withCors,
} from "./utils";

export { MemoryDO };

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

async function aiChat(env: Env, messages: ChatMsg[]): Promise<string | null> {
	const anyEnv = env as any;
	if (!anyEnv.AI) return null;
	try {
		const out = await anyEnv.AI.run(MODEL, {
			messages,
			max_tokens: 900,
			temperature: 0.6,
		});
		return (out?.response as string | undefined) ?? null;
	} catch {
		// If the model name/binding is misconfigured, fall back to local canned logic.
		return null;
	}
}

async function aiJson<T>(env: Env, messages: ChatMsg[]): Promise<T | null> {
	const raw = await aiChat(env, messages);
	if (!raw) return null;
	const parsed = safeJsonParse<T>(raw);
	if (parsed.ok) return parsed.value;

	// Retry once with a stronger constraint.
	const retryRaw = await aiChat(env, [
		...messages,
		{ role: "user", content: "Return ONLY valid JSON for the schema. No markdown. No extra keys." },
	]);
	if (!retryRaw) return null;
	const parsed2 = safeJsonParse<T>(retryRaw);
	return parsed2.ok ? parsed2.value : null;
}

function fallbackQuestion(mode: InterviewMode): { question: string; rubric_focus: string } {
	if (mode === "technical") {
		return {
			question:
				"Design a rate limiter for an API. Walk me through your approach, data structures, and tradeoffs (burstiness, distributed instances, and storage).",
			rubric_focus: "Explain assumptions, algorithm, complexity, and edge cases.",
		};
	}
	return {
		question:
			"Tell me about a time you faced a tight deadline. What was the situation, what was your task, what actions did you take, and what was the result?",
		rubric_focus: "Use STAR, include measurable results, and keep it concise.",
	};
}

function fallbackGrade(): GradeJson {
	return {
		overallScore: 5,
		star: { situation: 5, task: 5, action: 5, result: 4 },
		clarity: 5,
		impact: 4,
		strengths: ["You provided a coherent narrative."],
		improvements: ["Add concrete actions you personally took.", "Add measurable results/impact."],
		missing: ["Key metric/result", "Specific actions and decisions"],
		improvedAnswer: "",
		signalUpdates: { missing_metrics: 1, weak_result: 1 },
		nextQuestionStrategy: "Ask follow-ups that force specific actions + measurable results.",
	};
}

function parseCommand(input: string): { cmd: string; args: string } | null {
	const trimmed = input.trim();
	if (!trimmed.startsWith("/")) return null;
	const [cmd, ...rest] = trimmed.slice(1).split(/\s+/);
	return { cmd: cmd.toLowerCase(), args: rest.join(" ").trim() };
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env): Promise<Response> {
		const preflight = corsPreflight(request);
		if (preflight) return preflight;

		const origin = request.headers.get("origin");
		const url = new URL(request.url);

		try {
			if (url.pathname === "/api/chat" && request.method === "POST") {
				const resp = await handleChat(request, env);
				return withCors(resp, origin);
			}

			if (url.pathname === "/api/reset" && request.method === "POST") {
				const resp = await handleReset(request, env);
				return withCors(resp, origin);
			}

			if (url.pathname === "/api/summary" && request.method === "GET") {
				const resp = await handleSummary(url, env);
				return withCors(resp, origin);
			}

			return withCors(jsonResponse({ error: "Not found" }, { status: 404 }), origin);
		} catch (e) {
			return withCors(jsonResponse({ error: String(e) }, { status: 500 }), origin);
		}
	},
} satisfies ExportedHandler<Env>;

async function readJson<T>(request: Request): Promise<T | null> {
	try {
		return (await request.json()) as T;
	} catch {
		return null;
	}
}

function getStub(env: Env, sessionId: string) {
	return env.MEMORY_DO.getByName(sessionId);
}

async function ensureSession(env: Env, sessionId: string, body: ChatRequest): Promise<SessionData> {
	const stub = getStub(env, sessionId);
	const cur = await stub.getSession(sessionId);

	const shouldPatch =
		body.mode !== undefined ||
		body.targetRole !== undefined ||
		body.level !== undefined ||
		(body.focus !== undefined && Array.isArray(body.focus));

	if (!shouldPatch) return cur;

	return await stub.patchProfile(sessionId, {
		mode: body.mode,
		targetRole: body.targetRole,
		level: body.level,
		focus: body.focus,
	});
}

async function handleReset(request: Request, env: Env): Promise<Response> {
	const body = await readJson<{ sessionId?: string }>(request);
	const sessionId = body?.sessionId?.trim();
	if (!sessionId) return jsonResponse({ error: "Missing sessionId" }, { status: 400 });
	await getStub(env, sessionId).reset(sessionId);
	return jsonResponse({ ok: true });
}

async function handleSummary(url: URL, env: Env): Promise<Response> {
	const sessionId = (url.searchParams.get("sessionId") ?? "").trim();
	if (!sessionId) return jsonResponse({ error: "Missing sessionId" }, { status: 400 });
	const session = await getStub(env, sessionId).getSession(sessionId);

	const focus = currentFocusFromSignals(session.state.signals);
	const topSignals = Object.entries(session.state.signals)
		.sort((a, b) => (b[1] as number) - (a[1] as number))
		.slice(0, 3);

	const summary = {
		sessionId,
		mode: session.state.mode,
		targetRole: session.state.targetRole,
		level: session.state.level,
		stats: session.state.stats,
		currentFocus: focus,
		topSignals,
		lastGrade: session.lastGrade ?? null,
	};

	return jsonResponse(summary);
}

async function handleChat(request: Request, env: Env): Promise<Response> {
	const body = (await readJson<ChatRequest>(request)) ?? {};
	const sessionId = (body.sessionId?.trim() || crypto.randomUUID()).trim();
	let rawMessage = (body.message ?? "").trim();

	// Handle very long user answers (truncate to ~3000 chars to avoid token limits)
	const MAX_ANSWER_LENGTH = 3000;
	if (rawMessage.length > MAX_ANSWER_LENGTH) {
		rawMessage = rawMessage.slice(0, MAX_ANSWER_LENGTH) + `\n\n[Note: Answer truncated from ${body.message?.length} characters to fit processing limits]`;
	}

	const session = await ensureSession(env, sessionId, body);
	const stub = getStub(env, sessionId);

	const cmd = rawMessage ? parseCommand(rawMessage) : null;
	const hasProfilePatch =
		body.mode !== undefined ||
		body.targetRole !== undefined ||
		body.level !== undefined ||
		(body.focus !== undefined && Array.isArray(body.focus));

	// Command: /reset
	if (cmd?.cmd === "reset") {
		await stub.reset(sessionId);
		return jsonResponse({
			sessionId,
			reply: "Session reset. Send `/start behavioral`, `/start technical`, or just say hi to begin.",
			stats: {
				avgScore: 0,
				lastScores: [],
				currentFocus: "General improvement",
				questionsAnswered: 0,
			},
		} satisfies ChatResponse);
	}

	// Command: /summary
	if (cmd?.cmd === "summary") {
		const s = await stub.getSession(sessionId);
		const currentFocus = currentFocusFromSignals(s.state.signals);
		const reply = [
			`Progress summary`,
			`- Questions answered: ${s.state.stats.questionsAnswered}`,
			`- Average score: ${s.state.stats.avgScore}`,
			`- Current focus: ${currentFocus}`,
			``,
			`Tip: use \`/focus metrics\` to bias feedback toward quantification.`,
		].join("\n");

		return jsonResponse({
			sessionId,
			reply,
			stats: {
				avgScore: s.state.stats.avgScore,
				lastScores: s.state.stats.lastScores,
				currentFocus,
				questionsAnswered: s.state.stats.questionsAnswered,
			},
			lastGrade: s.lastGrade,
		} satisfies ChatResponse);
	}

	// Command: /focus <topic>
	if (cmd?.cmd === "focus") {
		const topic = cmd.args.trim();
		const nextFocus = topic ? Array.from(new Set([...session.state.focus, topic])) : session.state.focus;
		const next = await stub.patchProfile(sessionId, { focus: nextFocus });
		const currentFocus = currentFocusFromSignals(next.state.signals);
		return jsonResponse({
			sessionId,
			reply: topic ? `Focus updated: ${next.state.focus.join(", ")}` : `Current focus: ${next.state.focus.join(", ") || "none"}`,
			stats: {
				avgScore: next.state.stats.avgScore,
				lastScores: next.state.stats.lastScores,
				currentFocus,
				questionsAnswered: next.state.stats.questionsAnswered,
			},
			lastGrade: next.lastGrade,
		} satisfies ChatResponse);
	}

	// Command: /role <job title>
	if (cmd?.cmd === "role") {
		const role = cmd.args.trim();
		const next = await stub.patchProfile(sessionId, { targetRole: role || session.state.targetRole });
		const currentFocus = currentFocusFromSignals(next.state.signals);
		return jsonResponse({
			sessionId,
			reply: role ? `Target role updated to: ${next.state.targetRole}` : `Current target role: ${next.state.targetRole}`,
			stats: {
				avgScore: next.state.stats.avgScore,
				lastScores: next.state.stats.lastScores,
				currentFocus,
				questionsAnswered: next.state.stats.questionsAnswered,
			},
			lastGrade: next.lastGrade,
		} satisfies ChatResponse);
	}

	// Command: /start [mode]
	if (cmd?.cmd === "start") {
		const arg = cmd.args.toLowerCase();
		const mode: InterviewMode =
			arg.includes("tech") ? "technical" : arg.includes("behav") ? "behavioral" : arg.includes("mixed") ? "mixed" : session.state.mode;
		await stub.patchProfile(sessionId, { mode });
		await stub.clearLastQuestion(sessionId);
		return await sendNextQuestion(env, sessionId);
	}

	// If no message but profile fields were provided, treat as profile update ack (do not start interview).
	if (!rawMessage && hasProfilePatch) {
		const s = await stub.getSession(sessionId);
		const currentFocus = currentFocusFromSignals(s.state.signals);
		return jsonResponse({
			sessionId,
			reply: "Profile updated.",
			stats: {
				avgScore: s.state.stats.avgScore,
				lastScores: s.state.stats.lastScores,
				currentFocus,
				questionsAnswered: s.state.stats.questionsAnswered,
			},
			lastGrade: s.lastGrade,
		} satisfies ChatResponse);
	}

	// If no message, treat as "start" in current mode.
	if (!rawMessage) {
		return await sendNextQuestion(env, sessionId);
	}

	// If we don't have a last question yet, ask one.
	if (!session.state.lastQuestion) {
		return await sendNextQuestion(env, sessionId);
	}

	// Otherwise, grade the answer and ask the next question.
	await stub.appendMessage(sessionId, "user", rawMessage);

	const rubric = rubricForMode(session.state.mode);
	const grade = (await aiJson<GradeJson>(
		env,
		buildGradeMessages({
			mode: session.state.mode,
			questionText: session.state.lastQuestion.text,
			rubric,
			answerText: rawMessage,
			targetRole: session.state.targetRole,
			level: session.state.level,
			focus: session.state.focus,
		}) as unknown as ChatMsg[],
	)) ?? fallbackGrade();

	const score = clampScore(grade.overallScore);
	await stub.setLastGrade(sessionId, grade);
	const updated = await stub.updateAfterGrade({
		sessionId,
		score,
		signalUpdates: grade.signalUpdates,
	});

	const gradeReply = formatGradeReply(grade);
	await stub.appendMessage(sessionId, "assistant", gradeReply);
	const nextQ = await nextQuestion(env, sessionId, updated);

	// Inject grade + next question into a single reply.
	const combinedReply = [
		gradeReply,
		"",
		"Next question:",
		nextQ.questionText,
	].join("\n").trim();

	const currentFocus = currentFocusFromSignals(updated.state.signals);
	return jsonResponse({
		sessionId,
		reply: combinedReply,
		stats: {
			avgScore: updated.state.stats.avgScore,
			lastScores: updated.state.stats.lastScores,
			currentFocus,
			questionsAnswered: updated.state.stats.questionsAnswered,
		},
		lastGrade: grade,
	} satisfies ChatResponse);
}

async function sendNextQuestion(env: Env, sessionId: string, session?: SessionData): Promise<Response> {
	const next = await nextQuestion(env, sessionId, session);
	return jsonResponse(next.response);
}

async function nextQuestion(
	env: Env,
	sessionId: string,
	session?: SessionData,
): Promise<{ questionText: string; response: ChatResponse }> {
	const stub = getStub(env, sessionId);
	const current = session ?? (await stub.getSession(sessionId));
	const mode = current.state.mode;

	const q =
		(await aiJson<{ question: string; rubric_focus: string }>(
			env,
			buildQuestionMessages({
				mode,
				targetRole: current.state.targetRole,
				level: current.state.level,
				focus: current.state.focus,
				signals: current.state.signals,
				recentMessages: current.messages,
			}) as unknown as ChatMsg[],
		)) ?? fallbackQuestion(mode);

	const questionText = q.question?.trim() || fallbackQuestion(mode).question;
	const rubric = [rubricForMode(mode), "", `Rubric focus: ${q.rubric_focus ?? ""}`].join("\n").trim();

	await stub.setLastQuestion(sessionId, questionText, rubric);

	const latest = await stub.getSession(sessionId);
	const currentFocus = currentFocusFromSignals(latest.state.signals);

	const response: ChatResponse = {
		sessionId,
		reply: questionText,
		stats: {
			avgScore: latest.state.stats.avgScore,
			lastScores: latest.state.stats.lastScores,
			currentFocus,
			questionsAnswered: latest.state.stats.questionsAnswered,
		},
		lastGrade: latest.lastGrade,
	};

	return { questionText, response };
}
