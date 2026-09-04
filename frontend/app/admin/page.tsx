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
	DropoffStats,
	GenerateQuestionsPayload,
	GeneratedQuestionsResult,
	OverviewStats,
	QuestionAdminDto,
	QuestionType,
	QuizDto,
	ScoreTrendPoint,
} from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { Button, CountUp, Eyebrow, initials } from "@/components/ui";
import {
	AttemptsChart,
	CategoriesPanel,
	QuestionFormModal,
	SettingsPanel,
	UsersPanel as UsersPanelView,
	AnalyticsPanel as AnalyticsPanelView,
} from "./panels";
import {
	IconAnalytics,
	IconCheck,
	IconGrid,
	IconQuestion,
	IconTag,
	IconTrash,
	IconX,
	IconBell,
	IconChartLine,
	IconSettings,
	IconUpload,
	IconUsers,
} from "@/components/icons";

type SectionId =
	| "dashboard"
	| "questions"
	| "categories"
	| "generate"
	| "upload"
	| "review"
	| "users"
	| "analytics"
	| "settings";

interface SectionDef {
	id: SectionId;
	label: string;
	icon: React.ComponentType<{ size?: number }>;
}

const NAV_GROUPS: Array<{ label: string; items: SectionDef[] }> = [
	{
		label: "Overview",
		items: [{ id: "dashboard", label: "Dashboard", icon: IconGrid }],
	},
	{
		label: "Content",
		items: [
			{ id: "questions", label: "Question bank", icon: IconQuestion },
			{ id: "categories", label: "Categories", icon: IconTag },
			{ id: "generate", label: "AI generate", icon: IconAnalytics },
			{ id: "upload", label: "Bulk import", icon: IconUpload },
			{ id: "review", label: "Review queue", icon: IconBell },
		],
	},
	{
		label: "Platform",
		items: [
			{ id: "users", label: "Users", icon: IconUsers },
			{ id: "analytics", label: "Analytics", icon: IconChartLine },
			{ id: "settings", label: "Settings", icon: IconSettings },
		],
	},
];

const ALL_SECTIONS: SectionDef[] = NAV_GROUPS.flatMap((g) => g.items);

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
		<div className="py-8 max-w-6xl mx-auto px-8 max-[1280px]:px-6 max-[640px]:px-4">
			<div className="flex flex-col lg:grid lg:grid-cols-[240px_minmax(0,1fr)] gap-5 items-start">
				<aside className="admin-sidebar hidden lg:flex sticky top-[84px] max-h-[calc(100vh-110px)] overflow-y-auto w-full lg:w-auto box-border">
					<Link href="/" className="brand !text-base">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
							<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
							<circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
						</svg>
						HexQuiz
					</Link>
					<nav className="admin-nav">
						{NAV_GROUPS.map((group) => (
							<div key={group.label}>
								<div className="mono text-[10px] uppercase tracking-[0.12em] text-faintc px-3.5 pt-3 pb-1.5">
									{group.label}
								</div>
								{group.items.map(({ id, label, icon: Icon }) => (
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
							</div>
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

				<main className="min-w-0 flex-1 w-full">
					<div className="admin-nav-mobile lg:hidden">
						{ALL_SECTIONS.map(({ id, label, icon: Icon }) => (
							<button
								key={id}
								className={`admin-nav-item shrink-0 whitespace-nowrap border border-line bg-surface ${
									section === id ? "active" : ""
								}`}
								onClick={() => setSection(id)}
							>
								<Icon size={14} />
								{label}
								{id === "review" && pendingCount > 0 && (
									<span className="badge badge-amber ml-1.5">{pendingCount}</span>
								)}
							</button>
						))}
					</div>

					{(section === "questions" || section === "upload") && quizzes.length > 0 && (
						<div className="mb-6 flex items-center justify-between gap-4 flex-wrap" style={{ scrollMarginTop: 84, paddingTop: 8 }}>
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
					{section === "categories" && (
						<CategoriesPanel />
					)}
					{section === "users" && <UsersPanelView />}
					{section === "analytics" && <AnalyticsPanelView />}
					{section === "settings" && <SettingsPanel />}
				</main>
			</div>
		</div>
	);
}

function EmptyCard({ text }: { text: string }) {
	return (
		<div className="card p-10 text-center">
			<div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border" style={{ borderColor: "var(--color-line)", background: "var(--color-surface2)", color: "var(--color-faintc)" }}>
				<IconQuestion size={18} />
			</div>
			<p className="text-sm" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-apple), sans-serif" }}>{text}</p>
		</div>
	);
}

function AdminSkeletonRows({ rows = 3 }: { rows?: number }) {
	return (
		<div className="card !p-0 overflow-hidden">
			<div className="p-4 space-y-3">
				{Array.from({ length: rows }).map((_, i) => (
					<div key={i} className="flex gap-3">
						<div className="skeleton h-4 flex-1 rounded" />
						<div className="skeleton h-4 w-20 rounded" />
						<div className="skeleton h-8 w-16 rounded" />
					</div>
				))}
			</div>
		</div>
	);
}

function SectionHead({ title }: { title: string }) {
	return (
		<div style={{ scrollMarginTop: 84, paddingTop: 4 }}>
			<Eyebrow>Admin</Eyebrow>
			<h1 className="text-[28px] mt-2 mb-6">{title}</h1>
		</div>
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
	const overviewQuery = useQuery({
		queryKey: ["admin", "analytics", "overview"],
		queryFn: () => api<OverviewStats>("/api/admin/analytics/overview"),
	});
	const attemptsQuery = useQuery({
		queryKey: ["admin", "analytics"],
		queryFn: () => api<AdminAnalyticsDto>("/api/admin/analytics/attempts?days=7"),
	});
	const scoresQuery = useQuery({
		queryKey: ["admin", "analytics", "scores"],
		queryFn: () => api<ScoreTrendPoint[]>("/api/admin/analytics/scores?days=30"),
	});
	const dropoffQuery = useQuery({
		queryKey: ["admin", "analytics", "dropoff"],
		queryFn: () => api<DropoffStats>("/api/admin/analytics/dropoff"),
	});

	const ov = overviewQuery.data;

	return (
		<div>
			<SectionHead title="Dashboard" />

			<div className="stat-grid">
				<div className="card stat-card">
					<div className="stat-label">Total learners</div>
					<div className="stat-num">
						<CountUp value={ov?.totalUsers ?? 0} />
					</div>
					<div
						className="stat-delta text-[12px]"
						style={{
							color:
								(ov?.newUsersThisWeek ?? 0) > 0 ? "#35E8B4" : undefined,
						}}
					>
						{(ov?.newUsersThisWeek ?? 0) > 0
							? `+${ov!.newUsersThisWeek} this week`
							: "no sign-ups this week"}
					</div>
				</div>

				<div className="card stat-card">
					<div className="stat-label">Attempts finished today</div>
					<div className="stat-num">
						<CountUp value={ov?.attemptsToday ?? 0} />
					</div>
					<div className="stat-delta text-[12px] mutedc">
						across {ov?.categoryCount ?? 0} categories
					</div>
				</div>

				<div className="card stat-card">
					<div className="stat-label">Avg score</div>
					<div className="stat-num">
						<CountUp value={Math.round(ov?.avgScorePct30d ?? 0)} suffix="%" />
					</div>
					<div className="stat-delta text-[12px] mutedc">last 30 days</div>
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

			{attemptsQuery.data && (
				<div className="card mb-4">
					<h3 className="text-[15px] mb-5">Attempts — last 7 days</h3>
					<AttemptsChart daily={attemptsQuery.data.daily} />
				</div>
			)}

			{scoresQuery.data && scoresQuery.data.length > 0 && (
				<div className="admin-row2 mb-4">
					<div className="card">
						<h3 className="text-[15px] mb-5">Average score trend — last 30 days (%)</h3>
						<AttemptsChart
							daily={scoresQuery.data.map((s) => ({
								date: s.date,
								count: Math.round(s.avgPct * 10) / 10,
							}))}
						/>
					</div>

					{dropoffQuery.data && (
						<div className="card">
							<h3 className="text-[15px] mb-5">Quiz completion</h3>
							<div className="space-y-3 text-sm">
								<div className="flex justify-between">
									<span className="mutedc">Started</span>
									<span className="mono">{dropoffQuery.data.started}</span>
								</div>
								<div className="flex justify-between">
									<span className="mutedc">Finished</span>
									<span className="mono">{dropoffQuery.data.completed}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-dangerc">Abandoned mid-quiz</span>
									<span className="mono text-dangerc">
										{dropoffQuery.data.abandoned}
									</span>
								</div>
							</div>
							<div className="mv-bar-track mt-4 !max-w-none">
								<div
									className="mv-bar-fill"
									style={{
										width: `${Math.min(
											100,
											Math.max(
												0,
												dropoffQuery.data.started === 0
													? 100
													: (dropoffQuery.data.completed /
															dropoffQuery.data.started) *
														100
											)
										)}%`,
									}}
								/>
							</div>
							<p className="mt-2 mono text-[11px] text-faintc">
								{Math.round(dropoffQuery.data.dropOffPct)}% of quizzes are abandoned
								before submission
							</p>
						</div>
					)}
				</div>
			)}

			{(attemptsQuery.data) && (
				<div className="card mb-4">
					<h3 className="text-[15px] mb-5">Top categories this week</h3>
					{(attemptsQuery.data.topCategories ?? []).length === 0 ? (
						<p className="text-sm text-mutedc">No completed quizzes yet.</p>
					) : (
						<div className="flex flex-col gap-3.5 text-[13px]">
							{(attemptsQuery.data.topCategories ?? []).map((cat: { name: string; count: number }, i: number) => (
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
			)}

			<div className="card">
				<h3 className="text-[15px] mb-4">All quizzes</h3>
				<div className="overflow-x-auto"><table className="review-table">
					<thead>
						<tr>
							<th>Title</th>
							<th>Category</th>
							<th>Status</th>
							<th className="!text-right">Questions</th>
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
				</table></div>
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
		return <AdminSkeletonRows rows={4} />;
	}
	const questions = questionsQuery.data ?? [];

	return (
		<div className="fade-up" style={{ transition: "opacity var(--dur-base) var(--ease-apple)" }}>
			<SectionHead title="Question bank" />
			<p className="text-sm text-mutedc -mt-3 mb-5">{questions.length} question(s)</p>

			{questions.length === 0 ? (
				<EmptyCard text="No questions yet — import a CSV or generate with AI." />
			) : (
				<div className="card !p-0 overflow-hidden fade-up">
					<div className="overflow-x-auto"><table className="review-table">
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
										<div className="mt-2 flex flex-wrap gap-1.5">
											{question.options.map((o) => (
												<span
													key={o.optionId}
													className={`badge !text-[11px] ${o.isCorrect ? "badge-mint" : ""} max-w-full`}
												>
													{o.isCorrect ? "✓ " : ""}
													{o.optionText.length > 42 ? o.optionText.slice(0, 42) + "…" : o.optionText}
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
											<IconTrash size={13} />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table></div>
				</div>
			)}
		</div>
	);
}

const CSV_TEMPLATE = `question_text,type,points,explanation,option_1,option_2,option_3,option_4,correct_options
"What is SQL injection?, in short?",MCQ,1,Attacking databases via queries,DB backup,Firewall rule,CSS framework,Encryption mode,1
Select valid NoSQL stores,MULTI_SELECT,2,,MongoDB,Cassandra,MySQL,Redis,1|2|4
REST is stateless.,TRUE_FALSE,,,True,False,,,1`;

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
	const [category, setCategory] = useState("");
	const categoriesQuery = useQuery({
		queryKey: ["generate-categories"],
		queryFn: () => api<CategoryDto[]>("/api/categories", { auth: false }),
	});

	const lastPayloadRef = useRef<GenerateQuestionsPayload | null>(null);

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
		const payload: GenerateQuestionsPayload = {
			topic,
			count,
			questionType,
			difficulty: difficulty === "" ? undefined : (difficulty as GenerateQuestionsPayload["difficulty"]),
			categoryId: category ? Number(category) : undefined,
		};
		lastPayloadRef.current = payload;
		generateMutation.mutate(payload);
	}

	function handleRetry() {
		const payload = lastPayloadRef.current ?? {
			topic,
			count,
			questionType,
			difficulty: difficulty === "" ? undefined : (difficulty as GenerateQuestionsPayload["difficulty"]),
			categoryId: category ? Number(category) : undefined,
		};
		lastPayloadRef.current = payload;
		generateMutation.mutate(payload);
	}

	const isTimeoutError =
		generateMutation.isError &&
		((generateMutation.error as Error)?.message?.toLowerCase().includes("timed out") ||
			(generateMutation.error as Error)?.message?.toLowerCase().includes("temporarily"));

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
				<div className="field">
					<label>Category</label>
					<select
						className="input"
						value={category}
						onChange={(e) => setCategory(e.target.value)}
					>
						<option value="">Any category</option>
						{(categoriesQuery.data ?? []).map((c) => (
							<option key={c.id} value={String(c.id)}>
								{c.name}
							</option>
						))}
					</select>
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
									{d}
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
						? "Generating…"
						: "Generate questions"}
				</Button>

				{generateMutation.isPending && (
					<div className="mt-4 rounded-xl border p-4 flex gap-3.5 items-start" style={{ borderColor: "rgba(123,92,255,0.22)", background: "rgba(123,92,255,0.07)" }}>
						<div className="shrink-0 mt-0.5 h-8 w-8 rounded-full border-2 border-violet/30 border-t-violet animate-spin" style={{ borderTopColor: "var(--color-violet)" }} />
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold" style={{ color: "var(--color-violet)", fontFamily: "var(--font-apple), sans-serif" }}>
								Generating questions with AI — this usually takes 10-30 seconds
							</p>
							<p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-jakarta), sans-serif" }}>
								Crafting {count} {difficulty ? difficulty.toLowerCase() : "mixed"} {questionType.replace("_", " ").toLowerCase()} question{count > 1 ? "s" : ""} about “{topic.trim()}”{category ? ` in ${categoriesQuery.data?.find((c) => String(c.id) === category)?.name ?? "selected category"}` : ""}. You can wait here — no need to refresh.
							</p>
							<div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface2)" }}>
								<div className="h-full w-2/3 rounded-full animate-pulse" style={{ background: "var(--color-violet)", opacity: 0.9 }} />
							</div>
							<p className="text-[11px] mt-2" style={{ color: "var(--color-faintc)", fontFamily: "var(--font-apple), sans-serif" }}>
								Gemini is thinking… this is normally the longest step. DB save afterward is under a second.
							</p>
						</div>
					</div>
				)}

				{generateMutation.isError && (
					<div className="mt-4 rounded-xl border p-4" style={{ borderColor: isTimeoutError ? "rgba(245,158,11,0.35)" : "rgba(255,107,122,0.35)", background: isTimeoutError ? "rgba(245,158,11,0.08)" : "var(--color-dangerdim)" }}>
						<p className="text-sm font-semibold" style={{ color: isTimeoutError ? "var(--color-amber)" : "var(--color-coral)", fontFamily: "var(--font-apple), sans-serif" }}>
							{isTimeoutError ? "AI service is temporarily busy — not a bug" : "Generation failed"}
						</p>
						<p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-jakarta), sans-serif" }}>
							{isTimeoutError
								? "Gemini hit a transient timeout (common on free-tier under load). Your topic and settings are still saved — just retry. This usually succeeds on the next attempt within 10-30 seconds."
								: (generateMutation.error as Error).message}
						</p>
						{isTimeoutError && (
							<p className="text-[11px] mt-1.5 mono" style={{ color: "var(--color-faintc)" }}>
								{(generateMutation.error as Error).message}
							</p>
						)}
						<div className="mt-3 flex gap-2">
							<Button size="sm" onClick={handleRetry} disabled={generateMutation.isPending}>
								Retry generation
							</Button>
							<Button variant="ghost" size="sm" onClick={() => generateMutation.reset()}>
								Dismiss
							</Button>
						</div>
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
		return <AdminSkeletonRows rows={3} />;
	}
	const pending = pendingQuery.data ?? [];

	return (
		<div className="fade-up" style={{ transition: "opacity var(--dur-base) var(--ease-apple)" }}>
			<SectionHead title="Review queue" />
			{pending.length === 0 ? (
				<EmptyCard text="Nothing awaiting review. AI-generated drafts will appear here." />
			) : (
				<div className="card">
					<h3 className="text-[15px] mb-4">
						Pending AI-generated questions{" "}
						<span className="badge badge-amber ml-2">{pending.length} waiting</span>
					</h3>
					<div className="overflow-x-auto"><table className="review-table">
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
										<div className="mt-2 flex flex-wrap gap-1.5">
											{question.options.map((o) => (
												<span
													key={o.optionId}
													className={`badge !text-[11px] ${o.isCorrect ? "badge-mint" : ""} max-w-full`}
												>
													{o.isCorrect ? "✓ " : ""}
													{o.optionText.length > 36 ? o.optionText.slice(0, 36) + "…" : o.optionText}
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
					</table></div>
				</div>
			)}
		</div>
	);
}
