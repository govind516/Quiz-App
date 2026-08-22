"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
	AdminAnalyticsDto,
	BulkUploadResult,
	CategoryDto,
	GenerateQuestionsPayload,
	GeneratedQuestionsResult,
	QuestionAdminDto,
	QuestionType,
	QuizDto,
} from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { Button, CountUp, Eyebrow, initials } from "@/components/ui";
import {
	IconCheck,
	IconGrid,
	IconQuestion,
	IconTag,
	IconX,
} from "@/components/icons";

const SECTIONS = [
	{ id: "dashboard", label: "Dashboard", icon: IconGrid },
	{ id: "questions", label: "Question bank", icon: IconQuestion },
	{ id: "generate", label: "AI generate", icon: IconTag },
	{ id: "upload", label: "Bulk import", icon: IconTag },
	{ id: "review", label: "Review queue", icon: IconCheck },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const STATUS_STYLES: Record<string, string> = {
	PENDING_REVIEW: "badge-amber",
	APPROVED: "badge-mint",
	REJECTED: "badge-danger",
};

export default function AdminPage() {
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const hydrated = useAuthStore.persist?.hasHydrated?.() ?? false;

	useEffect(() => {
		if (hydrated && (!user || user.role !== "ADMIN")) {
			router.replace("/");
		}
	}, [hydrated, user, router]);

	const [section, setSection] = useState<SectionId>("dashboard");
	const [quizId, setQuizId] = useState<number | null>(null);

	const quizzesQuery = useQuery({
		queryKey: ["admin", "quizzes"],
		queryFn: () => api<QuizDto[]>("/api/admin/quizzes"),
		enabled: Boolean(user && user.role === "ADMIN"),
	});
	const pendingCountQuery = useQuery({
		queryKey: ["admin", "pending"],
		queryFn: () => api<QuestionAdminDto[]>("/api/admin/questions/pending"),
		enabled: Boolean(user && user.role === "ADMIN"),
	});
	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: () => api<CategoryDto[]>("/api/categories", { auth: false }),
	});
	const analyticsQuery = useQuery({
		queryKey: ["admin", "analytics"],
		queryFn: () => api<AdminAnalyticsDto>("/api/admin/analytics/attempts?days=7"),
		enabled: Boolean(user && user.role === "ADMIN" && section === "dashboard"),
	});

	const quizzes = quizzesQuery.data ?? [];
	const pendingCount = (pendingCountQuery.data ?? []).length;
	const activeQuizId = quizId ?? (quizzes.length > 0 ? quizzes[0].id : null);
	const totalQuestions = quizzes.reduce((sum, q) => sum + q.questionCount, 0);

	if (!hydrated || !user || user.role !== "ADMIN") {
		return <div className="h-64 animate-pulse rounded-xl bg-surface2 mt-10" />;
	}

	return (
		<div className="py-8">
			<div className="admin-shell">
				<aside className="admin-sidebar">
					<Link href="/" className="brand !text-base">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
							<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
							<circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
						</svg>
						HexQuiz
					</Link>
					<nav className="admin-nav">
						{SECTIONS.map(({ id, label, icon: Icon }) => (
							<button
								key={id}
								className={`admin-nav-item ${section === id ? "active" : ""}`}
								onClick={() => setSection(id)}
							>
								<Icon size={14} />
								{label}
								{id === "review" && pendingCount > 0 && (
									<span className="badge badge-amber ml-auto">{pendingCount}</span>
								)}
							</button>
						))}
					</nav>
					<div className="admin-profile">
						<div className="row-avatar">{initials(user.name)}</div>
						<div className="min-w-0">
							<div className="truncate font-semibold text-ink text-xs">
								{user.name}
							</div>
							<div className="text-[11px] text-faintc truncate">{user.email}</div>
						</div>
					</div>
				</aside>

				<main className="min-w-0">
					{(section === "questions" || section === "upload") && quizzes.length > 0 && (
						<div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
							<span className="mono text-xs text-faintc">Working on</span>
							<select
								value={activeQuizId ?? ""}
								onChange={(e) => setQuizId(Number(e.target.value))}
								className="input max-w-sm"
							>
								{quizzes.map((q) => (
									<option key={q.id} value={q.id}>
										{q.title}
										{q.isPublished ? "" : " (draft)"}
									</option>
								))}
							</select>
						</div>
					)}

					{section === "dashboard" && (
						<DashboardSection
							quizzes={quizzes}
							totalQuestions={totalQuestions}
							pendingCount={pendingCount}
							analytics={analyticsQuery.data}
							onGoReview={() => setSection("review")}
						/>
					)}
					{section === "questions" &&
						(quizzes.length === 0 || activeQuizId == null ? (
							<EmptyCard text="No quizzes exist yet." />
						) : (
							<QuestionsTab quizId={activeQuizId} />
						))}
					{section === "generate" &&
						(activeQuizId == null ? (
							<EmptyCard text="No quizzes exist yet." />
						) : (
							<GenerateTab quizId={activeQuizId} onGoReview={() => setSection("review")} />
						))}
					{section === "upload" &&
						(activeQuizId == null ? (
							<EmptyCard text="No quizzes exist yet." />
						) : (
							<UploadTab quizId={activeQuizId} />
						))}
					{section === "review" && <ReviewTab quizzes={quizzes} />}
				</main>
			</div>
		</div>
	);
}

function EmptyCard({ text }: { text: string }) {
	return (
		<div className="card p-10 text-center text-sm text-mutedc">{text}</div>
	);
}

function SectionHead({ title }: { title: string }) {
	return (
		<>
			<Eyebrow>Admin</Eyebrow>
			<h1 className="text-[28px] mt-2 mb-6">{title}</h1>
		</>
	);
}

function AttemptsChart({ daily }: { daily: { date: string; count: number }[] }) {
	const pathRef = useRef<SVGPolylineElement>(null);
	const areaRef = useRef<SVGPolygonElement>(null);

	const W = 560;
	const H = 180;
	const PAD = 18;

	let points = "";
	if (daily.length > 0) {
		const max = Math.max(1, ...daily.map((d) => d.count));
		const stepX = daily.length === 1 ? W : W / (daily.length - 1);
		points = daily
			.map((d, i) => {
				const x = i * stepX;
				const y = H - PAD - (d.count / max) * (H - PAD * 2);
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(" ");
	}
	const areaPoints = points ? `${points} ${W},${H} 0,${H}` : "";

	useEffect(() => {
		const path = pathRef.current;
		if (!path || !points) return;
		let length = 900;
		try {
			length = path.getTotalLength();
		} catch {}
		path.style.transition = "none";
		path.style.strokeDasharray = String(length);
		path.style.strokeDashoffset = String(length);
		void path.getBoundingClientRect();
		path.style.transition =
			"stroke-dashoffset 1.4s cubic-bezier(.22,.68,0,1)";
		path.style.strokeDashoffset = "0";
		if (areaRef.current) {
			areaRef.current.style.opacity = "0";
			setTimeout(() => {
				if (areaRef.current) areaRef.current.style.opacity = "1";
			}, 600);
		}
	}, [points]);

	if (!daily.length) return null;

	return (
		<svg className="chart-svg w-full h-[180px]" viewBox="0 0 560 180" preserveAspectRatio="none">
			<defs>
				<linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#7B5CFF" stopOpacity=".35" />
					<stop offset="100%" stopColor="#7B5CFF" stopOpacity="0" />
				</linearGradient>
			</defs>
			<polygon ref={areaRef} className="transition-opacity duration-700" points={areaPoints} fill="url(#chartGrad)" />
			<polyline ref={pathRef} className="chart-path" points={points} />
		</svg>
	);
}

function DashboardSection({
	quizzes,
	totalQuestions,
	pendingCount,
	analytics,
	onGoReview,
}: {
	quizzes: QuizDto[];
	totalQuestions: number;
	pendingCount: number;
	analytics?: AdminAnalyticsDto;
	onGoReview: () => void;
}) {
	return (
		<div>
			<SectionHead title="Dashboard" />
			<div className="stat-grid">
				<div className="card stat-card">
					<div className="stat-label">Quizzes</div>
					<div className="stat-num">
						<CountUp value={quizzes.length} />
					</div>
					<div className="stat-delta text-[12px] mutedc">across all categories</div>
				</div>
				<div className="card stat-card">
					<div className="stat-label">Active questions</div>
					<div className="stat-num">
						<CountUp value={totalQuestions} />
					</div>
					<div className="stat-delta text-[12px] mutedc">approved & playable</div>
				</div>
				<div className="card stat-card">
					<div className="stat-label">Attempts finished today</div>
					<div className="stat-num">
						<CountUp value={analytics?.today ?? 0} />
					</div>
					<div className="stat-delta text-[12px] mutedc">last 24 hours</div>
				</div>
				<div className="card stat-card">
					<div className="stat-label">Pending AI questions</div>
					<div
						className="stat-num"
						style={{ color: pendingCount > 0 ? "#FFB84D" : undefined }}
					>
						<CountUp value={pendingCount} />
					</div>
					<button
						className="stat-delta text-[12px] text-left"
						style={{ color: "#FFB84D" }}
						onClick={onGoReview}
					>
						review queue →
					</button>
				</div>
			</div>

			{analytics && (
				<div className="admin-row2 mb-4">
					<div className="card">
						<h3 className="text-[15px] mb-5">Attempts — last 7 days</h3>
						<AttemptsChart daily={analytics.daily} />
					</div>
					<div className="card">
						<h3 className="text-[15px] mb-5">Top categories this week</h3>
						{analytics.topCategories.length === 0 ? (
							<p className="text-sm text-mutedc">No completed quizzes yet.</p>
						) : (
							<div className="flex flex-col gap-3.5 text-[13px]">
								{analytics.topCategories.map((cat, i) => (
									<div key={cat.name} className="flex items-center justify-between">
										<span className="mutedc flex items-center gap-2.5">
											<span className="mono text-faintc">{i + 1}</span>
											{cat.name}
										</span>
										<span className="mono">{cat.count}</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			<div className="card">
				<h3 className="text-[15px] mb-4">All quizzes</h3>
				<table className="review-table">
					<thead>
						<tr>
							<th>Title</th>
							<th>Category</th>
							<th>Status</th>
							<th className="text-right">Questions</th>
						</tr>
					</thead>
					<tbody>
						{quizzes.map((q) => (
							<tr key={q.id}>
								<td className="font-medium text-ink">
									<Link href={`/quiz/${q.id}`} className="hover:text-violet">
										{q.title}
									</Link>
								</td>
								<td className="mutedc">{q.categoryName}</td>
								<td>
									<span className={`badge ${q.isPublished ? "badge-mint" : ""}`}>
										{q.isPublished ? "live" : "draft"}
									</span>
								</td>
								<td className="mono text-right">{q.questionCount}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function QuestionsTab({ quizId }: { quizId: number }) {
	const queryClient = useQueryClient();

	const questionsQuery = useQuery({
		queryKey: ["admin", "quiz", String(quizId), "questions"],
		queryFn: () => api<QuestionAdminDto[]>(`/api/admin/quizzes/${quizId}/questions`),
	});

	function invalidate() {
		void queryClient.invalidateQueries({
			queryKey: ["admin", "quiz", String(quizId), "questions"],
		});
		void queryClient.invalidateQueries({ queryKey: ["admin", "pending"] });
	}

	const actMutation = useMutation({
		mutationFn: ({ id, action }: { id: number; action: string }) =>
			api(`/api/admin/questions/${id}/${action}`, { method: "POST" }),
		onSuccess: invalidate,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) =>
			api(`/api/admin/questions/${id}`, { method: "DELETE" }),
		onSuccess: invalidate,
	});

	if (questionsQuery.isPending) {
		return <div className="card h-40 animate-pulse" />;
	}
	const questions = questionsQuery.data ?? [];

	return (
		<div>
			<SectionHead title="Question bank" />
			<p className="text-sm text-mutedc -mt-3 mb-5">{questions.length} question(s)</p>

			{questions.length === 0 ? (
				<EmptyCard text="No questions yet — import a CSV or generate with AI." />
			) : (
				<div className="card !p-0 overflow-hidden">
					<table className="review-table">
						<tbody>
							{questions.map((question) => (
								<tr key={question.questionId}>
									<td>
										<div className="flex items-center gap-2 mb-1">
											<span className={`badge ${STATUS_STYLES[question.status]}`}>
												{question.status.replace("_", " ").toLowerCase()}
											</span>
											<span className="badge">{question.type}</span>
											<span className="badge">{question.points} pt</span>
										</div>
										<div className="font-medium text-ink">{question.questionText}</div>
										<div className="text-xs mt-1 space-x-3">
											{question.options.map((o) => (
												<span key={o.optionId} className={o.isCorrect ? "text-mint" : "mutedc"}>
													{o.isCorrect ? "✓" : "·"} {o.optionText.length > 40 ? o.optionText.slice(0, 40) + "…" : o.optionText}
												</span>
											))}
										</div>
									</td>
									<td className="rt-actions !justify-end">
										{question.status !== "APPROVED" && (
											<button
												title="Approve"
												disabled={actMutation.isPending}
												className="icon-btn approve"
												onClick={() => actMutation.mutate({ id: question.questionId, action: "approve" })}
											>
												<IconCheck size={13} />
											</button>
										)}
										{question.status !== "REJECTED" && (
											<button
												title="Reject"
												disabled={actMutation.isPending}
												className="icon-btn reject"
												onClick={() => actMutation.mutate({ id: question.questionId, action: "reject" })}
											>
												<IconX size={13} />
											</button>
										)}
										<button
											title="Delete permanently"
											disabled={deleteMutation.isPending}
											className="icon-btn reject"
											onClick={() => {
												if (window.confirm("Delete this question permanently?")) {
													deleteMutation.mutate(question.questionId);
												}
											}}
										>
											🗑
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

const CSV_TEMPLATE = `question_text,type,points,explanation,option_1,option_2,option_3,option_4,correct_options
"What is SQL injection?, in short?",MCQ,1,Attacking databases via queries,DB backup,Firewall rule,CSS framework,Encryption mode,1
Select valid NoSQL stores,MULTI_SELECT,2,,MongoDB,Cassandra,MySQL,Redis,1|2|4
REST is stateless.,TRUE_FALSE,,,True,False,,2`;

function UploadTab({ quizId }: { quizId: number }) {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);

	const uploadMutation = useMutation({
		mutationFn: () => {
			const data = new FormData();
			data.append("file", file!);
			return api<BulkUploadResult>(
				`/api/admin/questions/bulk-upload?quizId=${quizId}`,
				{ method: "POST", body: data }
			);
		},
		onSuccess: () => {
			setFile(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			void queryClient.invalidateQueries({
				queryKey: ["admin", "quiz", String(quizId), "questions"],
			});
		},
	});

	return (
		<div className="max-w-3xl">
			<SectionHead title="Bulk import" />
			<div className="card">
				<p className="text-sm text-mutedc">
					Header row required:{" "}
					<code className="mono text-violet">
						question_text,type,points,explanation,option_1…N,correct_options
					</code>
					. Indices in <code className="mono text-violet">correct_options</code>{" "}
					are 1-based, joined by <code className="mono text-violet">|</code>.
				</p>
				<pre className="overflow-x-auto rounded-lg bg-bg border border-line p-4 text-xs leading-relaxed text-mint mono mt-4">
					{CSV_TEMPLATE}
				</pre>

				<input
					ref={fileInputRef}
					type="file"
					accept=".csv,text/csv"
					onChange={(e) => setFile(e.target.files?.[0] ?? null)}
					className="mt-5 block w-full cursor-pointer rounded-lg border border-line bg-surface2 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-violetdim file:px-3 file:py-1.5 file:text-violet"
				/>

				<Button
					block
					disabled={!file || uploadMutation.isPending}
					onClick={() => uploadMutation.mutate()}
					className="mt-4"
				>
					{uploadMutation.isPending
						? "Importing…"
						: `Import ${file ? `"${file.name}"` : ""}`}
				</Button>

				{uploadMutation.isError && (
					<div className="mt-3 rounded-lg border border-dangerc/40 bg-dangerdim px-3 py-2 text-sm text-dangerc">
						{(uploadMutation.error as Error).message}
					</div>
				)}

				{uploadMutation.isSuccess && (
					<div className="mt-3 rounded-lg border border-mint/30 bg-mintdim px-3 py-2 text-sm text-mint">
						Imported {uploadMutation.data.imported} question(s).
						{uploadMutation.data.failures.length > 0 && (
							<span className="font-semibold text-amberc block mt-1">
								{uploadMutation.data.failures.length} row(s) failed:
							</span>
						)}
						<ul className="list-inside list-disc text-amberc/80 mt-1">
							{uploadMutation.data.failures.map((f) => (
								<li key={f.lineNumber}>
									Line {f.lineNumber}: {f.error}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}

function GenerateTab({
	quizId,
	onGoReview,
}: {
	quizId: number;
	onGoReview: () => void;
}) {
	const queryClient = useQueryClient();
	const [topic, setTopic] = useState("");
	const [count, setCount] = useState(5);
	const [questionType, setQuestionType] = useState<QuestionType>("MCQ");
	const [difficulty, setDifficulty] = useState("");

	const generateMutation = useMutation({
		mutationFn: (payload: GenerateQuestionsPayload) =>
			api<GeneratedQuestionsResult>(
				`/api/admin/questions/generate?quizId=${quizId}`,
				{ method: "POST", body: payload }
			),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: ["admin", "quiz", String(quizId), "questions"],
			});
			void queryClient.invalidateQueries({ queryKey: ["admin", "pending"] });
		},
	});

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		generateMutation.mutate({
			topic,
			count,
			questionType,
			difficulty: difficulty === "" ? undefined : (difficulty as GenerateQuestionsPayload["difficulty"]),
		});
	}

	return (
		<div className="max-w-2xl">
			<SectionHead title="AI question studio" />
			<form onSubmit={handleSubmit} className="card">
				<p className="text-sm text-mutedc mb-5">
					Gemini drafts questions into the{" "}
					<strong className="text-amberc">PENDING_REVIEW</strong> state. Nothing
					goes live until you approve it.
				</p>

				<div className="field">
					<label>Topic</label>
					<input
						className="input"
						required
						placeholder='e.g. "JavaScript closures and event loop"'
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
					/>
				</div>

				<div className="grid grid-cols-3 gap-3">
					<div className="field">
						<label>Count</label>
						<select
							className="input"
							value={count}
							onChange={(e) => setCount(Number(e.target.value))}
						>
							{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>
					<div className="field">
						<label>Type</label>
						<select
							className="input"
							value={questionType}
							onChange={(e) => setQuestionType(e.target.value as QuestionType)}
						>
							{["MCQ", "MULTI_SELECT", "TRUE_FALSE"].map((t) => (
								<option key={t} value={t}>
									{t.replace("_", " ")}
								</option>
							))}
						</select>
					</div>
					<div className="field">
						<label>Difficulty</label>
						<select
							className="input"
							value={difficulty}
							onChange={(e) => setDifficulty(e.target.value)}
						>
							<option value="">Any</option>
							{["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((d) => (
								<option key={d} value={d}>
									{d.charAt(0) + d.slice(1).toLowerCase()}
								</option>
							))}
						</select>
					</div>
				</div>

				<Button
					block
					type="submit"
					disabled={generateMutation.isPending || !topic.trim()}
				>
					{generateMutation.isPending
						? "Asking Gemini… (can take ~10s)"
						: "Generate questions"}
				</Button>

				{generateMutation.isError && (
					<div className="mt-4 rounded-lg border border-dangerc/40 bg-dangerdim px-3 py-2 text-sm text-dangerc">
						{(generateMutation.error as Error).message}
					</div>
				)}

				{generateMutation.isSuccess && (
					<div className="mt-4 rounded-lg border border-mint/30 bg-mintdim px-3 py-2 text-sm text-mint">
						Created {generateMutation.data.created} draft(s)
						{generateMutation.data.discarded > 0 &&
							` · discarded ${generateMutation.data.discarded} malformed`}{" "}
						—{" "}
						<button type="button" onClick={onGoReview} className="underline font-semibold">
							open the review queue
						</button>
					</div>
				)}
			</form>
		</div>
	);
}

function ReviewTab({ quizzes }: { quizzes: QuizDto[] }) {
	const queryClient = useQueryClient();
	const [clearing, setClearing] = useState<
		Record<number, "approved" | "rejected" | "cleared">
	>({});

	const pendingQuery = useQuery({
		queryKey: ["admin", "pending"],
		queryFn: () => api<QuestionAdminDto[]>("/api/admin/questions/pending"),
	});

	const actMutation = useMutation({
		mutationFn: ({ id, action }: { id: number; action: string }) =>
			api(`/api/admin/questions/${id}/${action}`, { method: "POST" }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["admin", "pending"] });
			void queryClient.invalidateQueries({ queryKey: ["admin", "quizzes"] });
		},
	});

	function review(id: number, action: "approve" | "reject") {
		if (clearing[id]) return;
		setClearing((prev) => ({
			...prev,
			[id]: action === "approve" ? "approved" : "rejected",
		}));
		setTimeout(
			() => setClearing((prev) => ({ ...prev, [id]: "cleared" })),
			300
		);
		setTimeout(() => {
			actMutation.mutate({ id, action });
			setClearing((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
		}, 700);
	}

	const titleFor = (quizId: number) =>
		quizzes.find((q) => q.id === quizId)?.title ?? `Quiz #${quizId}`;

	if (pendingQuery.isPending) {
		return <div className="card h-40 animate-pulse" />;
	}
	const pending = pendingQuery.data ?? [];

	return (
		<div>
			<SectionHead title="Review queue" />
			{pending.length === 0 ? (
				<EmptyCard text="Nothing awaiting review. AI-generated drafts will appear here." />
			) : (
				<div className="card">
					<h3 className="text-[15px] mb-4">
						Pending AI-generated questions{" "}
						<span className="badge badge-amber ml-2">{pending.length} waiting</span>
					</h3>
					<table className="review-table">
						<thead>
							<tr>
								<th>Question</th>
								<th>Type</th>
								<th>Quiz</th>
								<th className="!text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{pending.map((question) => {
								const state = clearing[question.questionId];
								const tint =
									state === "approved"
										? "rgba(53,232,180,.12)"
										: state === "rejected"
											? "rgba(255,107,107,.12)"
											: undefined;
								return (
									<tr
										key={question.questionId}
										className={state === "cleared" ? "cleared" : ""}
										style={{ backgroundColor: tint }}
									>
										<td>
											<div className="font-medium text-ink max-w-md">
												{question.questionText}
											</div>
											<div className="text-xs mt-1 space-x-3">
												{question.options.map((o) => (
													<span key={o.optionId} className={o.isCorrect ? "text-mint" : "mutedc"}>
														{o.isCorrect ? "✓" : "·"}{" "}
														{o.optionText.length > 34 ? o.optionText.slice(0, 34) + "…" : o.optionText}
													</span>
												))}
											</div>
										</td>
										<td>
											<span className="badge">{question.type}</span>
										</td>
										<td className="mutedc text-xs">{titleFor(question.quizId)}</td>
										<td className="rt-actions !justify-end">
											<button
												title="Approve & publish"
												disabled={actMutation.isPending || Boolean(state)}
												className="icon-btn approve"
												onClick={() => review(question.questionId, "approve")}
											>
												<IconCheck size={13} />
											</button>
											<button
												title="Reject"
												disabled={actMutation.isPending || Boolean(state)}
												className="icon-btn reject"
												onClick={() => review(question.questionId, "reject")}
											>
												<IconX size={13} />
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
