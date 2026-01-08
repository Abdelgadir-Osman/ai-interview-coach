import { useMemo, useState, useEffect, useRef } from "react";
import "./App.css";

interface Message {
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}

interface Stats {
	avgScore: number;
	lastScores: number[];
	currentFocus: string;
	questionsAnswered: number;
}

interface Grade {
	overallScore: number;
	star?: { situation?: number; task?: number; action?: number; result?: number };
	clarity?: number;
	impact?: number;
	strengths?: string[];
	improvements?: string[];
}

interface ChatResponse {
	sessionId: string;
	reply: string;
	stats: Stats;
	lastGrade?: Grade;
}

type ApiStatus = "checking" | "online" | "offline";

// Use environment variable if set, otherwise default to deployed Worker URL
const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 
	(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
		? "/api"  // Local development - use proxy
		: "https://worker.o-abdelgadir32.workers.dev/api";  // Production - use Worker URL

function clamp0to10(n: unknown): number {
	const x = typeof n === "number" ? n : Number(n);
	if (!Number.isFinite(x)) return 0;
	return Math.max(0, Math.min(10, x));
}

function formatTime(ts: number): string {
	try {
		return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
	} catch {
		return new Date(ts).toLocaleTimeString();
	}
}

function App() {
	const [sessionId, setSessionId] = useState<string>("");
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [stats, setStats] = useState<Stats>({
		avgScore: 0,
		lastScores: [],
		currentFocus: "General improvement",
		questionsAnswered: 0,
	});
	const [mode, setMode] = useState<"behavioral" | "technical" | "mixed">("mixed");
	const [targetRole, setTargetRole] = useState<string>("Software Engineering Intern");
	const [isLoading, setIsLoading] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
	const [lastError, setLastError] = useState<string | null>(null);
	const [lastGrade, setLastGrade] = useState<Grade | null>(null);
	const [focusDraft, setFocusDraft] = useState<string>("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const recognitionRef = useRef<SpeechRecognition | null>(null);

	useEffect(() => {
		const stored = localStorage.getItem("interview_session_id");
		if (stored) {
			setSessionId(stored);
		} else {
			const newId = crypto.randomUUID();
			setSessionId(newId);
			localStorage.setItem("interview_session_id", newId);
		}
	}, []);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (!sessionId) return;
		let cancelled = false;

		const ping = async () => {
			try {
				setApiStatus("checking");
				const resp = await fetch(`${API_BASE}/summary?sessionId=${encodeURIComponent(sessionId)}`);
				if (!resp.ok) throw new Error(String(resp.status));
				const data = (await resp.json()) as any;
				if (cancelled) return;
				setApiStatus("online");
				setLastError(null);
				// If summary includes lastGrade, stash it for the scorecard.
				if (data?.lastGrade) setLastGrade(data.lastGrade as Grade);
				// If summary includes stats/currentFocus, update the dashboard without spamming chat.
				if (data?.stats && typeof data?.currentFocus === "string") {
					setStats({
						avgScore: data.stats.avgScore ?? 0,
						lastScores: data.stats.lastScores ?? [],
						currentFocus: data.currentFocus ?? "General improvement",
						questionsAnswered: data.stats.questionsAnswered ?? 0,
					});
				}
			} catch (e) {
				if (cancelled) return;
				setApiStatus("offline");
			}
		};

		ping();
		const id = window.setInterval(ping, 30000);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [sessionId]);

	const sendMessage = async (text: string) => {
		if (!text.trim() || isLoading) return;

		const userMessage: Message = {
			role: "user",
			content: text,
			timestamp: Date.now(),
		};
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);
		setApiStatus("checking");
		setLastError(null);

		try {
			const response = await fetch(`${API_BASE}/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionId,
					message: text,
					mode,
					targetRole,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: ChatResponse = await response.json();
			setSessionId(data.sessionId);
			localStorage.setItem("interview_session_id", data.sessionId);

			const assistantMessage: Message = {
				role: "assistant",
				content: data.reply,
				timestamp: Date.now(),
			};
			setMessages((prev) => [...prev, assistantMessage]);
			setStats(data.stats);
			setApiStatus("online");
			if (data.lastGrade) setLastGrade(data.lastGrade);
		} catch (error) {
			console.error("Error sending message:", error);
			const errorMessage: Message = {
				role: "assistant",
				content: "Sorry — I couldn’t reach the server. Check your connection / VITE_API_URL and try again.",
				timestamp: Date.now(),
			};
			setMessages((prev) => [...prev, errorMessage]);
			setApiStatus("offline");
			setLastError(error instanceof Error ? error.message : String(error));
		} finally {
			setIsLoading(false);
		}
	};

	const handleReset = async () => {
		try {
			await fetch(`${API_BASE}/reset`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sessionId }),
			});
			setMessages([]);
			setStats({
				avgScore: 0,
				lastScores: [],
				currentFocus: "General improvement",
				questionsAnswered: 0,
			});
		} catch (error) {
			console.error("Error resetting session:", error);
		}
	};

	const handleSummary = async () => {
		await sendMessage("/summary");
	};

	const handleStart = () => {
		// Send role update first, then start
		fetch(`${API_BASE}/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				sessionId,
				message: "",
				targetRole: targetRole.trim(),
			}),
		}).then(() => {
			sendMessage(`/start ${mode}`);
		}).catch(console.error);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (input.trim()) {
			sendMessage(input.trim());
		}
	};

	const quickChips = useMemo(
		() => [
			{ label: `Start (${mode})`, cmd: `/start ${mode}` },
			{ label: "Summary", cmd: "/summary" },
			{ label: "Focus: metrics", cmd: "/focus metrics" },
			{ label: "Focus: clarity", cmd: "/focus clarity" },
			{ label: "Reset", cmd: "/reset" },
		],
		[mode],
	);

	const modeDescriptions = {
		behavioral: "STAR format questions about past experiences, teamwork, and problem-solving",
		technical: "Algorithm design, system architecture, and technical problem-solving",
		mixed: "Combination of behavioral and technical questions"
	};

	const commands = [
		{ cmd: "/start [mode]", desc: "Start interview (behavioral/technical/mixed)" },
		{ cmd: "/reset", desc: "Clear session and start fresh" },
		{ cmd: "/summary", desc: "Get performance summary" },
		{ cmd: "/focus [topic]", desc: "Add focus area (e.g., /focus metrics, /focus system-design)" },
		{ cmd: "/role [job title]", desc: "Set target role (e.g., /role Product Manager, /role Data Scientist)" }
	];

	const startVoiceRecognition = () => {
		if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
			alert("Voice recognition is not supported in your browser. Try Chrome or Edge.");
			return;
		}

		const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
		const recognition = new SpeechRecognition();
		recognition.continuous = false;
		recognition.interimResults = false;
		recognition.lang = "en-US";

		recognition.onstart = () => {
			setIsRecording(true);
		};

		recognition.onresult = (event: any) => {
			const transcript = event.results[0][0].transcript;
			setInput(transcript);
			setIsRecording(false);
			recognition.stop();
		};

		recognition.onerror = (event: any) => {
			console.error("Speech recognition error:", event.error);
			setIsRecording(false);
			alert("Voice recognition error. Please try again.");
		};

		recognition.onend = () => {
			setIsRecording(false);
		};

		recognition.start();
		recognitionRef.current = recognition;
	};

	const stopVoiceRecognition = () => {
		if (recognitionRef.current) {
			recognitionRef.current.stop();
			setIsRecording(false);
		}
	};

	return (
		<div className="app">
			<div className="topbar">
				<div className="topbar-left">
					<div className="cf-dot" aria-hidden="true" />
					<div className="brand">
						<div className="brand-name">AI Interview Coach</div>
						<div className="brand-sub">Workers AI + Durable Objects</div>
					</div>
				</div>
				<div className="topbar-right">
					<div className={`status-pill ${apiStatus}`} title={lastError ?? "Connection status"}>
						<span className="status-dot" aria-hidden="true" />
						<span className="status-text">
							{apiStatus === "online" ? "Connected" : apiStatus === "checking" ? "Checking…" : "Offline"}
						</span>
					</div>
					<button type="button" className="help-link" onClick={() => setShowHelp(!showHelp)}>
						Help
					</button>
				</div>
			</div>
			<div className="main-content">
				<div className="chat-container">
					<div className="chat-header">
						<div className="chat-header-title">
							<h1>Chat</h1>
							<div className="chat-header-hint">Mode + role tailor questions</div>
						</div>
						<div className="header-actions">
							<div className="header-controls">
								<div className="mode-selector">
									<label>
										Mode:{" "}
										<select
											value={mode}
											onChange={(e) =>
												setMode(e.target.value as "behavioral" | "technical" | "mixed")
											}
											disabled={isLoading}
											title={modeDescriptions[mode]}
										>
											<option value="mixed">Mixed</option>
											<option value="behavioral">Behavioral</option>
											<option value="technical">Technical</option>
										</select>
									</label>
									<div className="mode-tooltip">{modeDescriptions[mode]}</div>
								</div>
								<div className="role-selector">
									<label>
										Role:{" "}
										<input
											type="text"
											value={targetRole}
											onChange={(e) => setTargetRole(e.target.value)}
											onBlur={() => {
												// Update role in session when user finishes editing
												if (targetRole.trim()) {
													fetch(`${API_BASE}/chat`, {
														method: "POST",
														headers: { "Content-Type": "application/json" },
														body: JSON.stringify({
															sessionId,
															message: "",
															targetRole: targetRole.trim(),
														}),
													}).catch(console.error);
												}
											}}
											placeholder="Job title..."
											disabled={isLoading}
											className="role-input"
										/>
									</label>
								</div>
							</div>
							<button type="button" onClick={handleStart} disabled={isLoading} className="start-compact">
								Start
							</button>
						</div>
					</div>

					{showHelp && (
						<div className="help-panel">
							<h3>Available Commands</h3>
							<div className="commands-list">
								{commands.map((cmd, idx) => (
									<div key={idx} className="command-item">
										<code>{cmd.cmd}</code>
										<span>{cmd.desc}</span>
									</div>
								))}
							</div>
							<div className="mode-explanations">
								<h4>Interview Modes</h4>
								<div className="mode-explanation">
									<strong>Behavioral:</strong> {modeDescriptions.behavioral}
								</div>
								<div className="mode-explanation">
									<strong>Technical:</strong> {modeDescriptions.technical}
								</div>
								<div className="mode-explanation">
									<strong>Mixed:</strong> {modeDescriptions.mixed}
								</div>
							</div>
							<div className="focus-examples">
								<h4>Focus Area Examples</h4>
								<div className="focus-example-list">
									<div><strong>Behavioral:</strong> metrics, leadership, teamwork, communication</div>
									<div><strong>Technical:</strong> algorithms, system-design, complexity, tradeoffs</div>
									<div><strong>General:</strong> clarity, impact, structure</div>
								</div>
								<div className="focus-hint">
									💡 Use <code>/focus [topic]</code> to customize what the coach emphasizes. See TOPICS.md for full list.
								</div>
							</div>
							<div className="role-info">
								<h4>Target Role</h4>
								<div className="role-explanation">
									<p>Set your target job role to customize questions. The coach adapts questions based on the role you specify.</p>
									<p><strong>Examples:</strong></p>
									<ul>
										<li>Product Manager</li>
										<li>Data Scientist</li>
										<li>UX Designer</li>
										<li>Marketing Manager</li>
										<li>Software Engineer</li>
										<li>Business Analyst</li>
									</ul>
									<p className="role-note">
										<strong>Note:</strong> Behavioral questions work for any role. Technical questions are optimized for software engineering roles, but you can use focus areas to customize.
									</p>
								</div>
							</div>
						</div>
					)}

					<div className="messages">
						{messages.length === 0 && (
							<div className="onboarding">
								<div className="onboarding-card">
									<div className="onboarding-title">Get interview-ready in 60 seconds</div>
									<div className="onboarding-steps">
										<div className="step">
											<div className="step-num">1</div>
											<div className="step-body">
												<div className="step-label">Choose a mode</div>
												<div className="mode-buttons">
													<button type="button" className={`mode-btn ${mode === "mixed" ? "active" : ""}`} onClick={() => setMode("mixed")} disabled={isLoading}>
														Mixed
													</button>
													<button type="button" className={`mode-btn ${mode === "behavioral" ? "active" : ""}`} onClick={() => setMode("behavioral")} disabled={isLoading}>
														Behavioral
													</button>
													<button type="button" className={`mode-btn ${mode === "technical" ? "active" : ""}`} onClick={() => setMode("technical")} disabled={isLoading}>
														Technical
													</button>
												</div>
											</div>
										</div>

										<div className="step">
											<div className="step-num">2</div>
											<div className="step-body">
												<div className="step-label">Set your target role</div>
												<div className="step-help">Example: “Product Manager”, “Data Scientist”, “Software Engineer”</div>
												<input
													className="onboarding-input"
													value={targetRole}
													onChange={(e) => setTargetRole(e.target.value)}
													placeholder="Job title…"
													disabled={isLoading}
												/>
											</div>
										</div>

										<div className="step">
											<div className="step-num">3</div>
											<div className="step-body">
												<div className="step-label">Optional focus area</div>
												<div className="chip-row">
													<button type="button" className="chip" onClick={() => sendMessage("/focus metrics")} disabled={isLoading}>metrics</button>
													<button type="button" className="chip" onClick={() => sendMessage("/focus clarity")} disabled={isLoading}>clarity</button>
													<button type="button" className="chip" onClick={() => sendMessage("/focus structure")} disabled={isLoading}>structure</button>
													<button type="button" className="chip" onClick={() => sendMessage("/focus impact")} disabled={isLoading}>impact</button>
												</div>
												<div className="focus-custom">
													<input
														className="onboarding-input"
														value={focusDraft}
														onChange={(e) => setFocusDraft(e.target.value)}
														placeholder="Custom focus (e.g., system-design)"
														disabled={isLoading}
														onKeyDown={(e) => {
															if (e.key === "Enter" && focusDraft.trim()) {
																e.preventDefault();
																sendMessage(`/focus ${focusDraft.trim()}`);
																setFocusDraft("");
															}
														}}
													/>
													<button
														type="button"
														className="chip-primary"
														disabled={isLoading || !focusDraft.trim()}
														onClick={() => {
															sendMessage(`/focus ${focusDraft.trim()}`);
															setFocusDraft("");
														}}
													>
														Add
													</button>
												</div>
											</div>
										</div>
									</div>

									<div className="onboarding-actions">
										<button type="button" onClick={handleStart} disabled={isLoading} className="primary-cta">
											Start interview
										</button>
										<div className="onboarding-footnote">
											Tip: use <code>/summary</code> anytime to see progress.
										</div>
									</div>
								</div>
							</div>
						)}
						{messages.map((msg, idx) => {
							const content = msg.content;
							const improvedAnswerMatch = content.match(/Improved answer \(rewrite\):\s*\n([\s\S]+)$/);
							const mainContent = improvedAnswerMatch ? content.substring(0, improvedAnswerMatch.index) : content;
							const improvedAnswer = improvedAnswerMatch ? improvedAnswerMatch[1].trim() : null;
							
							return (
								<div
									key={idx}
									className={`message-row ${msg.role === "user" ? "user" : "assistant"}`}
								>
									<div className={`avatar ${msg.role}`} aria-hidden="true">
										{msg.role === "user" ? "Y" : "AI"}
									</div>
									<div className="bubble">
										<div className="bubble-meta">
											<span className="bubble-name">{msg.role === "user" ? "You" : "Coach"}</span>
											<span className="bubble-time">{formatTime(msg.timestamp)}</span>
										</div>
										<div className="message-content" style={{ whiteSpace: "pre-wrap" }}>{mainContent}</div>
										{improvedAnswer && (
											<div className="improved-answer">
												<div className="improved-answer-header">💡 Improved Answer:</div>
												<div className="improved-answer-content" style={{ whiteSpace: "pre-wrap" }}>
													{improvedAnswer}
												</div>
											</div>
										)}
									</div>
								</div>
							);
						})}
						{isLoading && (
							<div className="message-row assistant">
								<div className="avatar assistant" aria-hidden="true">AI</div>
								<div className="bubble">
									<div className="bubble-meta">
										<span className="bubble-name">Coach</span>
										<span className="bubble-time">now</span>
									</div>
									<div className="message-content">
										<span className="typing-indicator">Thinking…</span>
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					<form onSubmit={handleSubmit} className="input-form">
						<div className="input-wrapper">
							<input
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Type your answer or a command..."
								disabled={isLoading}
								className="message-input"
								onKeyDown={(e) => {
									// Ctrl/Cmd + Enter sends the message
									if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && input.trim() && !isLoading) {
										e.preventDefault();
										sendMessage(input.trim());
									}
								}}
							/>
							<button
								type="button"
								onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
								disabled={isLoading}
								className={`voice-button ${isRecording ? "recording" : ""}`}
								title={isRecording ? "Stop recording" : "Start voice input"}
							>
								{isRecording ? "⏹️" : "🎤"}
							</button>
						</div>
						<button type="submit" disabled={isLoading || !input.trim()} className="send-button">
							Send
						</button>
						<button type="button" onClick={handleSummary} disabled={isLoading} className="action-secondary">
							Summary
						</button>
						<button type="button" onClick={handleReset} disabled={isLoading} className="action-secondary danger-outline">
							Reset
						</button>
					</form>
					<div className="quick-actions">
						{quickChips.map((c) => (
							<button key={c.cmd} type="button" className="quick-chip" disabled={isLoading} onClick={() => sendMessage(c.cmd)}>
								{c.label}
							</button>
						))}
					</div>
				</div>

				<div className="stats-panel">
					<div className="panel-title">
						<h2>Dashboard</h2>
						<div className="panel-sub">{targetRole}</div>
					</div>

					<div className="kpi-grid">
						<div className="kpi">
							<div className="kpi-label">Avg Score</div>
							<div className="kpi-value">{stats.avgScore.toFixed(1)}</div>
						</div>
						<div className="kpi">
							<div className="kpi-label">Answered</div>
							<div className="kpi-value">{stats.questionsAnswered}</div>
						</div>
					</div>

					<div className="focus-card">
						<div className="focus-label">Current Focus</div>
						<div className="focus-value">{stats.currentFocus}</div>
					</div>

					<div className="trend-card">
						<div className="trend-head">
							<div className="trend-label">Recent scores</div>
							<div className="trend-badges">
								{stats.lastScores.length > 0 ? (
									stats.lastScores.slice(-3).map((score, idx) => (
										<span key={idx} className="score-badge">
											{score.toFixed(1)}
										</span>
									))
								) : (
									<span className="no-scores">No scores yet</span>
								)}
							</div>
						</div>
						<div className="sparkline" aria-hidden="true">
							{stats.lastScores.length >= 2 ? (
								<svg viewBox="0 0 100 28" preserveAspectRatio="none">
									<polyline
										fill="none"
										stroke="currentColor"
										strokeWidth="3"
										strokeLinecap="round"
										strokeLinejoin="round"
										points={stats.lastScores
											.slice(-12)
											.map((v, i, arr) => {
												const x = (i / Math.max(1, arr.length - 1)) * 100;
												const y = 26 - (clamp0to10(v) / 10) * 22;
												return `${x.toFixed(2)},${y.toFixed(2)}`;
											})
											.join(" ")}
									/>
								</svg>
							) : (
								<div className="sparkline-empty" />
							)}
						</div>
					</div>

					<div className="scorecard">
						<div className="scorecard-title">Scorecard</div>
						{lastGrade ? (
							<div className="scorecard-body">
								<div className="overall-pill">
									<div className="overall-label">Overall</div>
									<div className="overall-value">{clamp0to10(lastGrade.overallScore).toFixed(1)}/10</div>
								</div>

								<div className="bar-list">
									<div className="bar-row">
										<div className="bar-label">Clarity</div>
										<div className="bar-track"><div className="bar-fill" style={{ width: `${(clamp0to10(lastGrade.clarity) / 10) * 100}%` }} /></div>
										<div className="bar-num">{clamp0to10(lastGrade.clarity).toFixed(1)}</div>
									</div>
									<div className="bar-row">
										<div className="bar-label">Impact</div>
										<div className="bar-track"><div className="bar-fill orange" style={{ width: `${(clamp0to10(lastGrade.impact) / 10) * 100}%` }} /></div>
										<div className="bar-num">{clamp0to10(lastGrade.impact).toFixed(1)}</div>
									</div>
									{lastGrade.star && (
										<>
											<div className="bar-row">
												<div className="bar-label">STAR: S</div>
												<div className="bar-track"><div className="bar-fill" style={{ width: `${(clamp0to10(lastGrade.star.situation) / 10) * 100}%` }} /></div>
												<div className="bar-num">{clamp0to10(lastGrade.star.situation).toFixed(1)}</div>
											</div>
											<div className="bar-row">
												<div className="bar-label">STAR: T</div>
												<div className="bar-track"><div className="bar-fill" style={{ width: `${(clamp0to10(lastGrade.star.task) / 10) * 100}%` }} /></div>
												<div className="bar-num">{clamp0to10(lastGrade.star.task).toFixed(1)}</div>
											</div>
											<div className="bar-row">
												<div className="bar-label">STAR: A</div>
												<div className="bar-track"><div className="bar-fill" style={{ width: `${(clamp0to10(lastGrade.star.action) / 10) * 100}%` }} /></div>
												<div className="bar-num">{clamp0to10(lastGrade.star.action).toFixed(1)}</div>
											</div>
											<div className="bar-row">
												<div className="bar-label">STAR: R</div>
												<div className="bar-track"><div className="bar-fill" style={{ width: `${(clamp0to10(lastGrade.star.result) / 10) * 100}%` }} /></div>
												<div className="bar-num">{clamp0to10(lastGrade.star.result).toFixed(1)}</div>
											</div>
										</>
									)}
								</div>

								{(lastGrade.strengths?.length || lastGrade.improvements?.length) && (
									<div className="mini-lists">
										{lastGrade.strengths?.length ? (
											<div className="mini-list">
												<div className="mini-title">Strengths</div>
												<ul>
													{lastGrade.strengths.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
												</ul>
											</div>
										) : null}
										{lastGrade.improvements?.length ? (
											<div className="mini-list">
												<div className="mini-title">Improve</div>
												<ul>
													{lastGrade.improvements.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
												</ul>
											</div>
										) : null}
									</div>
								)}
							</div>
						) : (
							<div className="scorecard-empty">Answer a question to see your score breakdown.</div>
						)}
					</div>

					<div className="session-info">
						<small>Session: {sessionId ? `${sessionId.substring(0, 8)}…` : "—"}</small>
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;

