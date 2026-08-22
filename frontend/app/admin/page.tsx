"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
	BulkUploadResult,
	Difficulty,
	GenerateQuestionsPayload,
	GeneratedQuestionsResult,
	QuestionAdminDto,
	QuestionType,
	QuizDto,
} from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";

const TABS = ["questions", "upload", "generate", "review"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
	questions: "Question bank",
	upload: "Bulk upload",
	generate: "AI generate",
	review: "Review queue",
};

const STATUS_STYLES: Record<string, string> = {
	PENDING_REVIEW: "bg-amber-50 text-amber-600",
	APPROVED: "bg-emerald-50 text-emerald-600",
	REJECTED: "bg-rose-50 text-rose-500",
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

	const [tab, setTab] = useState<Tab>("questions");
	const [quizId, setQuizId] = useState<number | null>(null);

	const quizzesQuery = useQuery({
		queryKey: ["admin", "quizzes"],
		queryFn: () => api<QuizDto[]>("/api/admin/quizzes"),
		enabled: Boolean(user && user.role === "ADMIN"),
	});

	const quizzes = quizzesQuery.data ?? [];
	const activeQuizId =
		quizId ?? (quizzes.length > 0 ? quizzes[0].id : null);

	if (!hydrated || !user || user.role !== "ADMIN") {
		return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
	}

	return (
		<div>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">
						Admin console
					</h1>
					<p className="mt-1 text-slate-500">
						Manage questions, bulk import content and review AI-generated items.
					</p>
				</div>
				<label className="text-sm">
					<span className="mr-2 font-medium text-slate-500">Quiz</span>
					<select
						value={activeQuizId ?? ""}
						onChange={(e) => setQuizId(Number(e.target.value))}
						className="max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
					>
						{quizzes.map((q) => (
							<option key={q.id} value={q.id}>
								{q.title}
								{q.isPublished ? "" : " (draft)"}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className="mt-6 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
				{TABS.map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
							tab === t
								? "bg-white text-slate-900 shadow"
								: "text-slate-500 hover:text-slate-800"
						}`}
					>
						{TAB_LABELS[t]}
						{t === "review" ? " 🕓" : ""}
					</button>
				))}
			</div>

			{quizzesQuery.isPending ? (
				<div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-100" />
			) : quizzes.length === 0 ? (
				<div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
					No quizzes exist yet. Create one via{" "}
					<code className="rounded bg-slate-100 px-1">POST /api/quizzes</code>{" "}
					or the Swagger UI.
				</div>
			) : activeQuizId == null ? null : tab === "questions" ? (
				<QuestionsTab quizId={activeQuizId} />
			) : tab === "upload" ? (
				<UploadTab quizId={activeQuizId} />
			) : tab === "generate" ? (
				<GenerateTab quizId={activeQuizId} onGoReview={() => setTab("review")} />
			) : (
				<ReviewTab quizzes={quizzes} />
			)}
		</div>
	);
}

function useInvalidate() {
	const queryClient = useQueryClient();
	return (...keys: unknown[][]) =>
		Promise.all(
			keys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
		);
}

function QuestionsTab({ quizId }: { quizId: number }) {
	const invalidate = useInvalidate();

	const questionsQuery = useQuery({
		queryKey: ["admin", "quiz", String(quizId), "questions"],
		queryFn: () =>
			api<QuestionAdminDto[]>(`/api/admin/quizzes/${quizId}/questions`),
	});

	const actMutation = useMutation({
		mutationFn: ({ id, action }: { id: number; action: string }) =>
			api(`/api/admin/questions/${id}/${action}`, { method: "POST" }),
		onSuccess: () =>
			invalidate(["admin", "quiz", quizId, "questions"], ["admin", "pending"]),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) =>
			api(`/api/admin/questions/${id}`, { method: "DELETE" }),
		onSuccess: () =>
			invalidate(["admin", "quiz", quizId, "questions"], ["admin", "pending"]),
	});

	function runAction(id: number, action: string, confirmText?: string) {
		if (confirmText && !window.confirm(confirmText)) return;
		actMutation.mutate({ id, action });
	}

	if (questionsQuery.isPending) {
		return <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-100" />;
	}
	const questions = questionsQuery.data ?? [];

	return (
		<div className="mt-6 space-y-3">
			<p className="text-sm text-slate-500">{questions.length} question(s)</p>
			{questions.length === 0 && (
				<div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
					No questions yet — import a CSV or generate with AI.
				</div>
			)}
			{questions.map((question) => (
				<div
					key={question.questionId}
					className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
				>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="min-w-0 flex-1">
							<div className="mb-1.5 flex flex-wrap items-center gap-2">
								<span
									className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
										STATUS_STYLES[question.status]
									}`}
								>
									{question.status.replace("_", " ")}
								</span>
								<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
									{question.type}
								</span>
								<span className="text-xs text-slate-400">
									{question.points} pt
								</span>
							</div>
							<p className="font-medium text-slate-900">
								{question.questionText}
							</p>
							<ul className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
								{question.options.map((option) => (
									<li
										key={option.optionId}
										className={
											option.isCorrect ? "font-semibold text-emerald-600" : "text-slate-600"
										}
									>
										{option.isCorrect ? "✓ " : "• "}
										{option.optionText}
									</li>
								))}
							</ul>
							{question.explanation && (
								<p className="mt-2 text-xs italic text-slate-400">
									{question.explanation}
								</p>
							)}
						</div>
						<div className="flex flex-none gap-2">
							{question.status !== "APPROVED" && (
								<button
									disabled={actMutation.isPending}
									onClick={() => runAction(question.questionId, "approve")}
									className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
								>
									Approve
								</button>
							)}
							{question.status !== "REJECTED" && (
								<button
									disabled={actMutation.isPending}
									onClick={() => runAction(question.questionId, "reject")}
									className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
								>
									Reject
								</button>
							)}
							<button
								disabled={deleteMutation.isPending}
								onClick={() => {
									if (window.confirm("Delete this question permanently?")) {
										deleteMutation.mutate(question.questionId);
									}
								}}
								className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 disabled:opacity-50"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

const CSV_TEMPLATE = `question_text,type,points,explanation,option_1,option_2,option_3,option_4,correct_options
"What is SQL injection?, in short?",MCQ,1,Attacking databases via queries,DB backup,Firewall rule,CSS framework,Encryption mode,1
Select valid NoSQL stores,MULTI_SELECT,2,,MongoDB,Cassandra,MySQL,Redis,1|2|4
REST is stateless.,TRUE_FALSE,,,True,False,,2`;

function UploadTab({ quizId }: { quizId: number }) {
	const invalidate = useInvalidate();
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
			return invalidate(["admin", "quiz", quizId, "questions"]);
		},
	});

	return (
		<div className="mt-6 max-w-3xl space-y-4">
			<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 className="font-semibold text-slate-900">CSV bulk import</h2>
				<p className="mt-1 text-sm text-slate-500">
					Header row required: <code>question_text,type,points,explanation,
					option_1…N,correct_options</code>. Indices in{" "}
					<code>correct_options</code> are 1-based, joined by <code>|</code>.
				</p>
				<pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
					{CSV_TEMPLATE}
				</pre>

				<input
					ref={fileInputRef}
					type="file"
					accept=".csv,text/csv"
					onChange={(e) => setFile(e.target.files?.[0] ?? null)}
					className="mt-4 block w-full cursor-pointer rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-indigo-600"
				/>

				<button
					disabled={!file || uploadMutation.isPending}
					onClick={() => uploadMutation.mutate()}
					className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{uploadMutation.isPending
						? "Importing…"
						: `Import ${file ? `"${file.name}"` : ""}`}
				</button>

				{uploadMutation.isError && (
					<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
						{(uploadMutation.error as Error).message}
					</div>
				)}

				{uploadMutation.isSuccess && (
					<div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
						Imported {uploadMutation.data.imported} question(s).
						{uploadMutation.data.failures.length > 0 && (
							<span className="font-semibold text-amber-600">
								{" "}
								{uploadMutation.data.failures.length} row(s) failed:
							</span>
						)}
						<ul className="mt-1 list-inside list-disc text-amber-700">
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
	const invalidate = useInvalidate();
	const [topic, setTopic] = useState("");
	const [count, setCount] = useState(5);
	const [questionType, setQuestionType] = useState<QuestionType>("MCQ");
	const [difficulty, setDifficulty] = useState<Difficulty | "">("");

	const generateMutation = useMutation({
		mutationFn: (payload: GenerateQuestionsPayload) =>
			api<GeneratedQuestionsResult>(
				`/api/admin/questions/generate?quizId=${quizId}`,
				{ method: "POST", body: payload }
			),
		onSuccess: () =>
			invalidate(["admin", "quiz", quizId, "questions"], ["admin", "pending"]),
	});

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		generateMutation.mutate({
			topic,
			count,
			questionType,
			difficulty: difficulty === "" ? undefined : difficulty,
		});
	}

	return (
		<div className="mt-6 max-w-2xl">
			<form
				onSubmit={handleSubmit}
				className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
			>
				<div>
					<h2 className="font-semibold text-slate-900">AI question generation</h2>
					<p className="mt-1 text-sm text-slate-500">
						Gemini drafts questions into the{" "}
						<strong className="text-amber-600">PENDING_REVIEW</strong> state.
						Nothing goes live until you approve it.
					</p>
				</div>

				<div>
					<label htmlFor="topic" className="block text-sm font-medium text-slate-700">
						Topic
					</label>
					<input
						id="topic"
						required
						placeholder='e.g. "JavaScript closures and event loop"'
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				<div className="grid grid-cols-3 gap-3">
					<div>
						<label htmlFor="count" className="block text-sm font-medium text-slate-700">
							Count
						</label>
						<select
							id="count"
							value={count}
							onChange={(e) => setCount(Number(e.target.value))}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
						>
							{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>
					<div>
						<label htmlFor="qtype" className="block text-sm font-medium text-slate-700">
							Type
						</label>
						<select
							id="qtype"
							value={questionType}
							onChange={(e) => setQuestionType(e.target.value as QuestionType)}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
						>
							{["MCQ", "MULTI_SELECT", "TRUE_FALSE"].map((t) => (
								<option key={t} value={t}>
									{t.replace("_", " ")}
								</option>
							))}
						</select>
					</div>
					<div>
						<label htmlFor="diff" className="block text-sm font-medium text-slate-700">
							Difficulty
						</label>
						<select
							id="diff"
							value={difficulty}
							onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize"
						>
							<option value="">Any</option>
							{["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((d) => (
								<option key={d} value={d} className="capitalize">
									{d.charAt(0) + d.slice(1).toLowerCase()}
								</option>
							))}
						</select>
					</div>
				</div>

				<button
					disabled={
						generateMutation.isPending || !topic.trim()
					}
					className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{generateMutation.isPending
						? "Asking Gemini… (can take ~10s)"
						: "Generate questions"}
				</button>

				{generateMutation.isError && (
					<div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
						{(generateMutation.error as Error).message}
					</div>
				)}

				{generateMutation.isSuccess && (
					<div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
						Created {generateMutation.data.created} draft question(s)
						{generateMutation.data.discarded > 0 &&
							` · discarded ${generateMutation.data.discarded} malformed`}{" "}
						—{" "}
						<button
							type="button"
							onClick={onGoReview}
							className="font-semibold underline"
						>
							open the review queue
						</button>
					</div>
				)}
			</form>
		</div>
	);
}

function ReviewTab({ quizzes }: { quizzes: QuizDto[] }) {
	const invalidate = useInvalidate();

	const pendingQuery = useQuery({
		queryKey: ["admin", "pending"],
		queryFn: () => api<QuestionAdminDto[]>("/api/admin/questions/pending"),
	});

	const actMutation = useMutation({
		mutationFn: ({ id, action }: { id: number; action: string }) =>
			api(`/api/admin/questions/${id}/${action}`, { method: "POST" }),
		onSuccess: () =>
			invalidate(["admin", "pending"], ["admin", "quizzes"]),
	});

	const titleFor = (quizId: number) =>
		quizzes.find((q) => q.id === quizId)?.title ?? `Quiz #${quizId}`;

	if (pendingQuery.isPending) {
		return <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-100" />;
	}
	const pending = pendingQuery.data ?? [];

	return (
		<div className="mt-6 space-y-3">
			{pending.length === 0 ? (
				<div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
					Nothing awaiting review. AI-generated drafts will appear here.
				</div>
			) : (
				pending.map((question) => (
					<div
						key={question.questionId}
						className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm"
					>
						<div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
							<span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-600">
								{question.type}
							</span>
							<Link
								href={`/quiz/${question.quizId}`}
								className="text-slate-400 hover:text-indigo-500"
							>
								{titleFor(question.quizId)}
							</Link>
						</div>
						<p className="font-medium text-slate-900">{question.questionText}</p>
						<ul className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
							{question.options.map((option) => (
								<li
									key={option.optionId}
									className={
										option.isCorrect
											? "font-semibold text-emerald-600"
											: "text-slate-600"
									}
								>
									{option.isCorrect ? "✓ " : "• "}
									{option.optionText}
								</li>
							))}
						</ul>
						{question.explanation && (
							<p className="mt-2 rounded-lg bg-indigo-50/60 p-2 text-xs italic text-slate-500">
								{question.explanation}
							</p>
						)}
						<div className="mt-3 flex gap-2">
							<button
								disabled={actMutation.isPending}
								onClick={() => actMutation.mutate({ id: question.questionId, action: "approve" })}
								className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
							>
								Approve & publish
							</button>
							<button
								disabled={actMutation.isPending}
								onClick={() => actMutation.mutate({ id: question.questionId, action: "reject" })}
								className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
							>
								Reject
							</button>
						</div>
					</div>
				))
			)}
		</div>
	);
}
