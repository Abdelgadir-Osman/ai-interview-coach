import { useState, useEffect, useRef } from "react";
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

interface ChatResponse {
	sessionId: string;
	reply: string;
	stats: Stats;
	lastGrade?: {
		overallScore: number;
		star?: { situation: number; task: number; action: number; result: number };
		clarity: number;
		impact: number;
		strengths: string[];
		improvements: string[];
	};
}

// Use environment variable if set, otherwise default to deployed Worker URL
const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined) || 
	(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
		? "/api"  // Local development - use proxy
		: "https://worker.o-abdelgadir32.workers.dev/api";  // Production - use Worker URL

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
		} catch (error) {
			console.error("Error sending message:", error);
			const errorMessage: Message = {
				role: "assistant",
				content: "Sorry, I encountered an error. Please try again.",
				timestamp: Date.now(),
			};
			setMessages((prev) => [...prev, errorMessage]);
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
		try {
			const response = await fetch(`${API_BASE}/summary?sessionId=${sessionId}`);
			if (!response.ok) throw new Error("Failed to fetch summary");
			const data: ChatResponse = await response.json();
			const summaryMessage: Message = {
				role: "assistant",
				content: data.reply,
				timestamp: Date.now(),
			};
			setMessages((prev) => [...prev, summaryMessage]);
			setStats(data.stats);
		} catch (error) {
			console.error("Error fetching summary:", error);
		}
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
			<div className="main-content">
				<div className="chat-container">
					<div className="chat-header">
						<h1>AI Interview Coach</h1>
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
							<button
								type="button"
								onClick={() => setShowHelp(!showHelp)}
								className="help-button"
								title="Show commands help"
							>
								?
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
							<div className="welcome">
								<p>Welcome! Start your mock interview by typing a message or clicking "Start Interview".</p>
								<p className="hint">Try commands like: <code>/start behavioral</code>, <code>/summary</code>, or just say hello!</p>
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
									className={`message ${msg.role === "user" ? "user" : "assistant"}`}
								>
									<div className="message-content">
										<div style={{ whiteSpace: "pre-wrap" }}>{mainContent}</div>
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
							<div className="message assistant">
								<div className="message-content">
									<span className="typing-indicator">Thinking...</span>
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
						<button
							type="button"
							onClick={handleStart}
							disabled={isLoading}
							className="start-button"
						>
							Start Interview
						</button>
					</form>
				</div>

				<div className="stats-panel">
					<h2>Session Stats</h2>
					<div className="stat-item">
						<label>Average Score:</label>
						<span className="stat-value">{stats.avgScore.toFixed(1)}</span>
					</div>
					<div className="stat-item">
						<label>Questions Answered:</label>
						<span className="stat-value">{stats.questionsAnswered}</span>
					</div>
					<div className="stat-item">
						<label>Current Focus:</label>
						<span className="stat-value">{stats.currentFocus}</span>
					</div>
					<div className="stat-item">
						<label>Last Scores:</label>
						<div className="scores-list">
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
					<div className="actions">
						<button onClick={handleSummary} disabled={isLoading} className="action-button">
							Summary
						</button>
						<button onClick={handleReset} disabled={isLoading} className="action-button danger">
							Reset
						</button>
					</div>
					<div className="session-info">
						<small>Session: {sessionId.substring(0, 8)}...</small>
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;

