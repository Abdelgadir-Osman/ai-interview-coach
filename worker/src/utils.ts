import type { CoachingSignals, GradeJson, TranscriptMessage } from "./types";

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return new Response(JSON.stringify(body, null, 2), { ...init, headers });
}

export function textResponse(body: string, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	headers.set("content-type", "text/plain; charset=utf-8");
	return new Response(body, { ...init, headers });
}

export function withCors(resp: Response, origin: string | null): Response {
	const headers = new Headers(resp.headers);
	// For a hackathon/demo app we allow all origins; tighten this in production.
	const allowOrigin = origin ?? "*";
	headers.set("access-control-allow-origin", allowOrigin);
	headers.set("vary", "origin");
	// If we return "*", we must not set allow-credentials to true (it would be invalid CORS).
	if (allowOrigin !== "*") headers.set("access-control-allow-credentials", "true");
	return new Response(resp.body, { ...resp, headers });
}

export function corsPreflight(request: Request): Response | null {
	if (request.method !== "OPTIONS") return null;
	const origin = request.headers.get("origin");
	const reqHeaders = request.headers.get("access-control-request-headers") ?? "content-type";

	return withCors(
		new Response(null, {
			status: 204,
			headers: {
				"access-control-allow-methods": "GET,POST,OPTIONS",
				"access-control-allow-headers": reqHeaders,
				"access-control-max-age": "86400",
			},
		}),
		origin,
	);
}

export function now(): number {
	return Date.now();
}

export function trimTranscript(messages: TranscriptMessage[], max: number): TranscriptMessage[] {
	if (messages.length <= max) return messages;
	return messages.slice(messages.length - max);
}

export function safeJsonParse<T>(raw: unknown): { ok: true; value: T } | { ok: false; error: string } {
	if (raw === null || raw === undefined) return { ok: false, error: "Input is null or undefined" };

	// If it's already an object, treat it as the parsed value.
	if (typeof raw === "object") return { ok: true, value: raw as T };

	const s = typeof raw === "string" ? raw : String(raw);
	try {
		return { ok: true, value: JSON.parse(s) as T };
	} catch (e) {
		const extracted = extractJsonObject(s);
		if (extracted) {
			try {
				return { ok: true, value: JSON.parse(extracted) as T };
			} catch (e2) {
				return { ok: false, error: String(e2) };
			}
		}
		return { ok: false, error: String(e) };
	}
}

function extractJsonObject(raw: string): string | null {
	// Best-effort: grab the first {...} block.
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start === -1 || end === -1 || end <= start) return null;
	return raw.slice(start, end + 1);
}

export function clampScore(n: unknown): number {
	const x = typeof n === "number" ? n : Number(n);
	if (!Number.isFinite(x)) return 0;
	return Math.max(0, Math.min(10, x));
}

export function applySignalUpdates(base: CoachingSignals, updates?: Partial<CoachingSignals>): CoachingSignals {
	if (!updates) return base;
	return {
		missing_metrics: base.missing_metrics + (updates.missing_metrics ?? 0),
		weak_result: base.weak_result + (updates.weak_result ?? 0),
		unclear_task: base.unclear_task + (updates.unclear_task ?? 0),
		rambling: base.rambling + (updates.rambling ?? 0),
	};
}

export function computeStatsAfterGrade(lastScores: number[], newScore: number): {
	lastScores: number[];
	avgScore: number;
} {
	const next = [...lastScores, newScore].slice(-10);
	const avg = next.reduce((a, b) => a + b, 0) / (next.length || 1);
	return { lastScores: next, avgScore: Math.round(avg * 10) / 10 };
}

export function currentFocusFromSignals(signals: CoachingSignals): string {
	const pairs: Array<[keyof CoachingSignals, string]> = [
		["missing_metrics", "Add measurable impact/metrics"],
		["weak_result", "Stronger results + reflection"],
		["unclear_task", "Clarify task/constraints"],
		["rambling", "Be more concise/structured"],
	];

	let best: (typeof pairs)[number] | null = null;
	for (const p of pairs) {
		if (!best || signals[p[0]] > signals[best[0]]) best = p;
	}
	return best ? best[1] : "General improvement";
}

export function formatGradeReply(grade: GradeJson): string {
	const overall = clampScore(grade.overallScore);
	const strengths = (grade.strengths ?? []).slice(0, 3);
	const improvements = (grade.improvements ?? []).slice(0, 3);
	const missing = (grade.missing ?? []).slice(0, 5);

	const lines: string[] = [];
	lines.push(`Score: ${overall}/10`);
	if (strengths.length) {
		lines.push("");
		lines.push("What you did well:");
		for (const s of strengths) lines.push(`- ${s}`);
	}
	if (improvements.length) {
		lines.push("");
		lines.push("Top improvements:");
		for (const i of improvements) lines.push(`- ${i}`);
	}
	if (missing.length) {
		lines.push("");
		lines.push("Missing details to add next time:");
		for (const m of missing) lines.push(`- ${m}`);
	}
	if (grade.improvedAnswer) {
		lines.push("");
		lines.push("Improved answer (rewrite):");
		lines.push(grade.improvedAnswer.trim());
	}

	return lines.join("\n").trim();
}


