"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
	AdminCategory,
	AdminUserItem,
	AdminUsersResponse,
	CategoryDto,
	DropoffStats,
	PlatformSettings,
	QuestionAdminDto,
	QuestionType,
	ScoreTrendPoint,
} from "@/lib/types";
import { Button, CountUp, Eyebrow, initials } from "@/components/ui";
import { IconCheck, IconTrash } from "@/components/icons";

const input = "input";

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

function AdminEmptyState({ text }: { text: string }) {
	return (
		<div className="card p-10 text-center">
			<div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border" style={{ borderColor: "var(--color-line)", background: "var(--color-surface2)", color: "var(--color-faintc)" }}>
				<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx={12} cy={12} r={9} /><path d="M9.5 9a2.5 2.5 0 114 2c-.8.6-1.5 1.1-1.5 2.2" /><circle cx={12} cy={16.6} r={0.6} fill="currentColor" stroke="none" /></svg>
			</div>
			<p className="text-sm" style={{ color: "var(--color-mutedc)", fontFamily: "var(--font-apple), sans-serif" }}>{text}</p>
		</div>
	);
}

/* ---------------- Categories ---------------- */

export function CategoriesPanel() {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);

	const categoriesQuery = useQuery({
		queryKey: ["admin", "categories"],
		queryFn: () =>
			api<AdminCategory[]>("/api/admin/categories"),
	});

	function refresh() {
		void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
		void queryClient.invalidateQueries({ queryKey: ["categories"] });
	}

	const createMutation = useMutation({
		mutationFn: () => api<CategoryDto>("/api/categories", { method: "POST", body: { name: name.trim() } }),
		onSuccess: () => {
			setName("");
			setError(null);
			refresh();
		},
		onError: (e) => setError(e instanceof Error ? e.message : "Failed to create category"),
	});

	const renameMutation = useMutation({
		mutationFn: ({ id, newName }: { id: number; newName: string }) =>
			api<AdminCategory>(`/api/admin/categories/${id}`, { method: "PUT", body: { name: newName.trim() } }),
		onSuccess: refresh,
		onError: (e) => alert(e instanceof Error ? e.message : "Rename failed"),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => api(`/api/admin/categories/${id}`, { method: "DELETE" }),
		onSuccess: refresh,
		onError: (e) => alert(e instanceof Error ? e.message : "Delete failed"),
	});

	return (
		<div>
			<SectionHead title="Categories" />
			<form
				className="flex flex-wrap gap-2 mb-5"
				onSubmit={(e) => {
					e.preventDefault();
					if (!name.trim()) return;
					createMutation.mutate();
				}}
			>
				<input
					className={`${input} flex-1 min-w-[220px] max-w-sm`}
					placeholder="New category name…"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<Button type="submit" disabled={!name.trim() || createMutation.isPending}>
					{createMutation.isPending ? "Creating…" : "Add category"}
				</Button>
			</form>
			{createMutation.isError && (
				<div className="mb-4 text-sm text-dangerc">{(createMutation.error as Error).message}</div>
			)}

			{categoriesQuery.isPending ? (
				<div style={{ transition: "opacity var(--dur-base) var(--ease-apple)" }}><AdminSkeletonRows rows={4} /></div>
			) : (categoriesQuery.data ?? []).length === 0 ? (
				<AdminEmptyState text="No categories yet — create one above." />
			) : (
				<div className="card !p-0 overflow-hidden fade-up" style={{ transition: "opacity var(--dur-base) var(--ease-apple)" }}>
					<div className="overflow-x-auto">
						<table className="review-table">
							<thead>
								<tr>
									<th>Name</th>
									<th>Slug</th>
									<th className="text-right">Quizzes</th>
									<th className="text-right">Approved Qs</th>
									<th className="!text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{(categoriesQuery.data ?? []).map((cat) => (
									<tr key={cat.id}>
										<td className="font-medium text-ink">{cat.name}</td>
										<td className="mono text-xs text-faintc">{cat.slug}</td>
										<td className="mono text-right">{cat.quizzes}</td>
										<td className="mono text-right">{cat.questions}</td>
										<td>
											<div className="flex gap-2 justify-end">
												<button
													className="icon-btn approve"
													title="Rename"
													onClick={() => {
														const newName = window.prompt("Rename category", cat.name);
														if (newName && newName.trim() && newName.trim() !== cat.name) {
															renameMutation.mutate({ id: cat.id, newName });
														}
													}}
												>
													✎
												</button>
												<button
													className="icon-btn reject"
													title="Delete"
													disabled={deleteMutation.isPending}
													onClick={() => {
														if (
															window.confirm(
																`Delete "${cat.name}"? Categories with quizzes cannot be deleted.`
															)
														) {
															deleteMutation.mutate(cat.id);
														}
													}}
												>
													<IconTrash size={13} />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

/* ---------------- Users ---------------- */

export function UsersPanel() {
	const [searchInput, setSearchInput] = useState("");
	const [appliedSearch, setAppliedSearch] = useState("");
	const [page, setPage] = useState(0);

	useEffect(() => {
		const t = setTimeout(() => {
			setAppliedSearch(searchInput.trim());
			setPage(0);
		}, 350);
		return () => clearTimeout(t);
	}, [searchInput]);

	const usersQuery = useQuery({
		queryKey: ["admin", "users", appliedSearch, page],
		queryFn: () =>
			api<AdminUsersResponse>(
				`/api/admin/users?page=${page}&size=20${appliedSearch ? `&query=${encodeURIComponent(appliedSearch)}` : ""}`
			),
		placeholderData: (prev) => prev as AdminUsersResponse,
	});

	const banMutation = useMutation({
		mutationFn: ({ id, banned }: { id: number; banned: boolean }) =>
			api<AdminUserItem>(`/api/admin/users/${id}/ban`, { method: "PATCH", body: { banned } }),
		onSuccess: () => refresh(),
	});

	const resetProgressMutation = useMutation({
		mutationFn: (id: number) =>
			api<{ message: string }>(`/api/admin/users/${id}/progress`, { method: "DELETE" }),
		onSuccess: () => refresh(),
	});

	const queryClient = useQueryClient();
	function refresh() {
		void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
	}

	const data = usersQuery.data;
	const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

	return (
		<div>
			<SectionHead title="Users" />
			<input
				className={`${input} max-w-sm mb-4`}
				placeholder="Search by name or email…"
				value={searchInput}
				onChange={(e) => setSearchInput(e.target.value)}
			/>

			{usersQuery.isPending ? (
				<AdminSkeletonRows rows={5} />
			) : (data?.items ?? []).length === 0 ? (
				<AdminEmptyState text="No users found — try a different search." />
			) : (
				<>
					<div className="card !p-0 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="review-table">
								<thead>
									<tr>
										<th>User</th>
										<th>Role</th>
										<th>Joined</th>
										<th>Quizzes passed</th>
										<th>Status</th>
										<th className="!text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									{(data?.items ?? []).map((userItem) => (
										<tr key={userItem.id}>
											<td>
												<div className="font-medium text-ink">{userItem.name}</div>
												<div className="text-xs text-faintc mono">{userItem.email}</div>
											</td>
											<td>
												<span className={`badge ${userItem.role === "ADMIN" ? "badge-violet" : ""}`}>
													{userItem.role.toLowerCase()}
												</span>
											</td>
											<td className="text-sm mutedc">
												{new Date(userItem.createdAt).toLocaleDateString()}
											</td>
											<td className="mono">{userItem.attemptsCompleted}</td>
											<td>
												<span className={`badge ${userItem.banned ? "badge-danger" : "badge-mint"}`}>
													{userItem.banned ? "banned" : "active"}
												</span>
											</td>
											<td>
												<div className="flex gap-2 justify-end flex-wrap">
													<Button
														variant={userItem.banned ? "outline" : "danger"}
														size="sm"
														disabled={banMutation.isPending || userItem.role === "ADMIN"}
														title={userItem.role === "ADMIN" ? "Cannot suspend admins" : ""}
														onClick={() =>
															banMutation.mutate({ id: userItem.id, banned: !userItem.banned })
														}
													>
														{userItem.banned ? "Unban" : "Ban"}
													</Button>
													<Button
														variant="outline"
														size="sm"
														disabled={
															resetProgressMutation.isPending ||
															userItem.attemptsCompleted === 0
														}
														onClick={() => {
															if (
																window.confirm(
																	`Reset ALL quiz progress for ${userItem.name}? This permanently deletes their attempts and cannot be undone.`
																)
															) {
																resetProgressMutation.mutate(userItem.id);
															}
														}}
													>
														Reset progress
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="mt-4 flex items-center justify-between text-sm">
						<span className="text-faintc">
							Page {(data?.page ?? 0) + 1} of {totalPages} · {data?.total ?? 0} users
						</span>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={(data?.page ?? 0) <= 0 || usersQuery.isFetching}
								onClick={() => setPage(page - 1)}
							>
								← Prev
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={(data?.page ?? 0) + 1 >= totalPages || usersQuery.isFetching}
								onClick={() => setPage(page + 1)}
							>
								Next →
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

/* ---------------- Analytics ---------------- */

function StatBox({
	label,
	value,
	caption,
}: {
	label: string;
	value: React.ReactNode;
	caption?: string;
}) {
	return (
		<div className="card stat-card">
			<div className="stat-label">{label}</div>
			<div className="stat-num">{value}</div>
			{caption && <div className="stat-delta text-[12px] mutedc">{caption}</div>}
		</div>
	);
}

export function AnalyticsPanel() {
	const scoresQuery = useQuery({
		queryKey: ["admin", "analytics", "scores"],
		queryFn: () => api<ScoreTrendPoint[]>("/api/admin/analytics/scores?days=30"),
	});
	const dropoffQuery = useQuery({
		queryKey: ["admin", "analytics", "dropoff"],
		queryFn: () => api<DropoffStats>("/api/admin/analytics/dropoff"),
	});
	const perfQuery = useQuery({
		queryKey: ["admin", "analytics", "categories"],
		queryFn: () =>
			api<Array<{ name: string; attempts: number; completed: number; avgScorePct: number }>>(
				"/api/admin/analytics/categories"
			),
	});

	const scores = scoresQuery.data ?? [];
	const trendDaily = scores.map((s) => ({
		date: s.date,
		count: Math.round(s.avgPct * 10) / 10,
	}));

	return (
		<div>
			<SectionHead title="Analytics" />
			<p className="text-sm text-mutedc -mt-3 mb-6">
				Based on logged-in users&apos; submitted quizzes.
			</p>

			{dropoffQuery.data && (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stat-grid mb-6">
					<StatBox label="Attempts started" value={<CountUp value={dropoffQuery.data.started} />} />
					<StatBox label="Finished" value={<CountUp value={dropoffQuery.data.completed} />} />
					<StatBox label="Abandoned" value={<CountUp value={dropoffQuery.data.abandoned} />} />
					<StatBox label="Drop-off rate" value={`${Math.round(dropoffQuery.data.dropOffPct)}%`} />
				</div>
			)}

			<div className="card mb-6">
				<h3 className="text-[15px] mb-5">Average score — last 30 days (%)</h3>
				{scoresQuery.isPending ? (
					<div className="space-y-3">
						<div className="skeleton h-4 w-32 rounded" />
						<div className="skeleton h-[140px] rounded-lg" />
					</div>
				) : trendDaily.length === 0 ? (
					<p className="text-sm text-mutedc">No completed quizzes yet.</p>
				) : (
					<AttemptsChart daily={trendDaily} />
				)}
			</div>

			<div className="card">
				<h3 className="text-[15px] mb-5">Category performance</h3>
				{perfQuery.isPending ? (
					<AdminSkeletonRows rows={3} />
				) : (perfQuery.data ?? []).length === 0 ? (
					<p className="text-sm text-mutedc">No attempt data yet.</p>
				) : (
					<div className="space-y-4">
						{(perfQuery.data ?? []).map((cat) => (
							<div key={cat.name}>
								<div className="flex items-center justify-between text-sm mb-1.5">
									<span className="font-medium text-ink">{cat.name}</span>
									<span className="mono text-xs text-faintc">
										{cat.attempts} started · {Math.round(cat.avgScorePct)}% avg
									</span>
								</div>
								<div className="mv-bar-track !max-w-none">
									<div
										className="mv-bar-fill"
										style={{ width: `${Math.min(100, Math.max(0, cat.avgScorePct))}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);

	/* AttemptsChart imported from page — defined below in same file scope via props injection */
}

/* ---------------- Settings ---------------- */

function Toggle({
	checked,
	onChange,
	disabled,
}: {
	checked: boolean;
	onChange: () => void;
	disabled?: boolean;
}) {
	return (
		<label className="relative inline-flex cursor-pointer items-center shrink-0">
			<input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} disabled={disabled} />
			<span
				className={`h-6 w-11 rounded-full transition-colors relative ${
					checked ? "bg-violet" : "bg-linestrong"
				}`}
			/>
			<span
				className={`absolute left-0.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white transition-all ${
					checked ? "translate-x-[22px]" : ""
				}`}
			/>
		</label>
	);
}

export function SettingsPanel() {
	const queryClient = useQueryClient();

	const settingsQuery = useQuery({
		queryKey: ["admin", "settings"],
		queryFn: () => api<PlatformSettings>("/api/admin/settings"),
	});

	const updateMutation = useMutation({
		mutationFn: (update: Partial<PlatformSettings>) =>
			api<PlatformSettings>("/api/admin/settings", { method: "PUT", body: update }),
		onSuccess: (data) => {
			queryClient.setQueryData(["admin", "settings"], data);
		},
		onError: (e) => alert(e instanceof Error ? e.message : "Failed to save setting"),
	});

	const settings = settingsQuery.data;

	function toggle(key: keyof PlatformSettings, current: boolean) {
		updateMutation.mutate({ [key]: !current } as Partial<PlatformSettings>);
	}

	return (
		<div className="max-w-2xl">
			<SectionHead title="Settings" />
			<div className="card space-y-6">
				<div className="flex items-start justify-between gap-6">
					<div>
						<div className="font-semibold text-ink text-sm mb-1">AI question generation</div>
						<p className="text-xs text-faintc leading-relaxed">
							When off, admins cannot create Gemini drafts. Existing drafts stay in the review queue.
						</p>
					</div>
					<Toggle
						checked={settings?.aiGenerationEnabled ?? true}
						onChange={() => toggle("aiGenerationEnabled", settings!.aiGenerationEnabled)}
						disabled={settingsQuery.isPending || updateMutation.isPending || !settings}
					/>
				</div>

				<div className="border-t border-line pt-6 flex items-start justify-between gap-6">
					<div>
						<div className="font-semibold text-ink text-sm mb-1">Public registration</div>
						<p className="text-xs text-faintc leading-relaxed">
							When off, new sign-ups are rejected. Existing accounts can still log in.
						</p>
					</div>
					<Toggle
						checked={settings?.registrationEnabled ?? true}
						onChange={() => toggle("registrationEnabled", settings!.registrationEnabled)}
						disabled={settingsQuery.isPending || updateMutation.isPending || !settings}
					/>
				</div>

				{updateMutation.isError && (
					<div className="text-sm text-dangerc border-t border-line pt-4">
						{(updateMutation.error as Error).message}
					</div>
				)}
			</div>
		</div>
	);
}

/* ---------------- Question form modal ---------------- */

interface OptionRow {
	optionText: string;
	isCorrect: boolean;
}

export function QuestionFormModal({
	quizId,
	initial,
	onClose,
}: {
	quizId: number;
	initial?: QuestionAdminDto;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const editing = Boolean(initial);

	const [questionText, setQuestionText] = useState(initial?.questionText ?? "");
	const [type, setType] = useState<QuestionType>(initial?.type ?? "MCQ");
	const [points, setPoints] = useState(initial?.points ?? 1);
	const [explanation, setExplanation] = useState(initial?.explanation ?? "");
	const [options, setOptions] = useState<OptionRow[]>(
		initial
			? initial.options.map((o: any) => ({ optionText: o.optionText, isCorrect: o.isCorrect }))
			: [
					{ optionText: "", isCorrect: true },
					{ optionText: "", isCorrect: false },
					{ optionText: "", isCorrect: false },
					{ optionText: "", isCorrect: false },
				]
	);
	const [error, setError] = useState<string | null>(null);

	const saveMutation = useMutation({
		mutationFn: () => {
			const body = {
				questionText: questionText.trim(),
				type,
				points,
				explanation: explanation.trim(),
				options: options.map((o: any) => ({
					optionText: o.optionText.trim(),
					isCorrect: o.isCorrect,
				})),
			};
			return editing
				? api<QuestionAdminDto>(`/api/admin/questions/${initial!.questionId}`, {
						method: "PUT",
						body,
					})
				: api<QuestionAdminDto>(`/api/admin/questions?quizId=${quizId}`, {
						method: "POST",
						body,
					});
		},
		onSuccess: () => onClose(),
		onError: (e) => setError(e instanceof Error ? e.message : "Save failed"),
	});

	function handleTypeChange(newType: QuestionType) {
		setType(newType);
		if (newType === "TRUE_FALSE") {
			setOptions([
				{ optionText: "True", isCorrect: true },
				{ optionText: "False", isCorrect: false },
			]);
		} else if (newType === "MCQ") {
			let seen = false;
			setOptions((prev) =>
				prev.map((o: any) => {
					if (o.isCorrect && !seen) {
						seen = true;
						return o;
					}
					return { ...o, isCorrect: false };
				})
			);
		}
	}

	function pickCorrect(index: number, multi: boolean) {
		setOptions((prev) =>
			prev.map((o, i) => {
				if (multi) return i === index ? { ...o, isCorrect: !o.isCorrect } : o;
				return i === index ? { ...o, isCorrect: true } : { ...o, isCorrect: false };
			})
		);
	}

	const multi = type === "MULTI_SELECT";
	const correctCount = options.filter((o) => o.isCorrect).length;

	return (
		<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
			<div className="card w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto">
				<h3 className="text-lg font-semibold text-ink mb-5">
					{editing ? "Edit question" : "Add question"}
				</h3>

				<div className="field">
					<label>Question text</label>
					<textarea
						rows={2}
						value={questionText}
						onChange={(e) => setQuestionText(e.target.value)}
						className="input resize-y"
						placeholder="e.g. What does HTTP stand for?"
					/>
				</div>

				<div className="grid grid-cols-3 gap-3 mb-4">
					<div className="field !mb-0">
						<label>Type</label>
						<select
							className="input"
							value={type}
							onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
						>
							{["MCQ", "MULTI_SELECT", "TRUE_FALSE"].map((t) => (
								<option key={t} value={t}>
									{t.replace("_", " ")}
								</option>
							))}
						</select>
					</div>
					<div className="field !mb-0">
						<label>Points</label>
						<input
							type="number"
							min={1}
							max={100}
							className="input"
							value={points}
							onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 1))}
						/>
					</div>
				</div>

				<div className="field">
					<label>
						Options {multi ? "(check all correct)" : "(pick one correct)"}
					</label>
					<div className="space-y-2">
						{options.map((opt, i) => (
							<div key={i} className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => pickCorrect(i, multi)}
									title="Mark correct"
									className={`shrink-0 w-7 h-7 rounded-full border-1.5 flex items-center justify-center text-xs font-bold transition ${
										opt.isCorrect
											? "bg-mint border-mint text-[#08130F]"
											: "border-linestrong text-faintc hover:border-mint"
									}`}
								>
									✓
								</button>
								<input
									className="input"
									value={opt.optionText}
									onChange={(e) =>
										setOptions((prev) =>
											prev.map((o, j) =>
												j === i ? { ...o, optionText: e.target.value } : o
											)
										)
									}
									placeholder={`Option ${i + 1}`}
								/>
								{options.length > 2 && (
									<button
										type="button"
										className="icon-btn reject shrink-0"
										title="Remove option"
										onClick={() =>
											setOptions((prev) => prev.filter((_, j) => j !== i))
										}
									>
										×
									</button>
								)}
							</div>
						))}
					</div>
					{type !== "TRUE_FALSE" && options.length < 6 && (
						<button
							type="button"
							className="btn btn-outline btn-sm mt-2"
							onClick={() =>
								setOptions((prev) => [...prev, { optionText: "", isCorrect: false }])
							}
						>
							+ Add option
						</button>
					)}
				</div>

				<div className="field">
					<label>Explanation</label>
					<textarea
						rows={2}
						value={explanation}
						onChange={(e) => setExplanation(e.target.value)}
						className="input resize-y"
						placeholder="Shown after submission…"
					/>
				</div>

				{error && (
					<div className="rounded-lg border border-dangerc/40 bg-dangerdim px-3 py-2 text-sm text-dangerc mb-4">
						{error}
					</div>
				)}

				<div className="flex gap-3 justify-end">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						disabled={saveMutation.isPending}
						onClick={() => {
							if (!questionText.trim()) {
								setError("Question text is required");
								return;
							}
							if (options.filter((o) => o.optionText.trim()).length < 2) {
								setError("At least two non-empty options are required");
								return;
							}
							if (correctCount === 0) {
								setError("Mark at least one correct option");
								return;
							}
							if ((type === "MCQ" || type === "TRUE_FALSE") && correctCount > 1) {
								setError(`${type} allows exactly one correct option`);
								return;
							}
							saveMutation.mutate();
						}}
					>
						{saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Add question"}
					</Button>
				</div>
			</div>
		</div>
	);
}

/* shared helpers used by panels */

export function SectionHead({ title }: { title: string }) {
	return (
		<>
			<Eyebrow>Admin</Eyebrow>
			<h1 className="text-[28px] mt-2 mb-6">{title}</h1>
		</>
	);
}

/* ---------------- Attempts line chart (shared) ---------------- */

export function AttemptsChart({
	daily,
	title,
}: {
	daily: { date: string; count: number }[];
	title?: string;
}) {
	const [drawn, setDrawn] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setDrawn(true), 80);
		return () => clearTimeout(timer);
	}, [daily]);

	const W = 560;
	const H = 210;
	const PAD_L = 34;
	const PAD_R = 16;
	const PAD_T = 18;
	const PAD_B = 30;

	const max = Math.max(1, ...daily.map((d) => d.count));
	const stepX =
		daily.length > 1 ? (W - PAD_L - PAD_R) / (daily.length - 1) : (W - PAD_L - PAD_R) / 2;

	const pts = daily.map((d, i) => ({
		x: PAD_L + i * stepX,
		y: H - PAD_B - (d.count / max) * (H - PAD_T - PAD_B),
	}));

	const linePoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
	const baselineY = H - PAD_B;
	const areaPoints =
		pts.length > 1
			? `${linePoints} ${pts[pts.length - 1].x.toFixed(1)},${baselineY} ${PAD_L},${baselineY}`
			: "";

	const dayLabel = (dateStr: string) =>
		new Date(`${dateStr}T00:00:00`)
			.toLocaleDateString("en-US", { weekday: "short" })
			.toUpperCase();

	if (!daily.length) return null;

	return (
		<div>
			<div className="relative">
				<svg
										viewBox={`0 0 ${W} ${H}`}
					preserveAspectRatio="none"
					className="w-full h-[190px]"
				>
					<defs>
						<linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#7B5CFF" stopOpacity="0.32" />
							<stop offset="100%" stopColor="#7B5CFF" stopOpacity="0" />
						</linearGradient>
					</defs>

					<line
						x1={PAD_L}
						y1={baselineY}
						x2={W - PAD_R}
						y2={baselineY}
						stroke="rgba(255,255,255,.16)"
						strokeWidth="1"
					/>

					{areaPoints && (
						<polygon
							points={areaPoints}
							fill="url(#chartGrad)"
							style={{
								opacity: drawn ? 1 : 0,
								transition: "opacity .7s ease .5s",
							}}
						/>
					)}

					{pts.length > 1 && (
						<polyline
							points={linePoints}
							fill="none"
							stroke="#7B5CFF"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							pathLength={100}
							strokeDasharray={100}
							strokeDashoffset={drawn ? 0 : 100}
							style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.22,.68,0,1)" }}
						/>
					)}

					{pts.map((p, i) => (
						<circle
							key={`dot-${i}`}
							cx={p.x}
							cy={p.y}
							r={3.5}
							fill="#0D0A1D"
							stroke="#7B5CFF"
							strokeWidth="2"
							style={{
								opacity: drawn ? 1 : 0,
								transition: `opacity .4s ease ${0.4 + i * 0.08}s`,
							}}
						/>
					))}

					<text x={PAD_L - 8} y={PAD_T + 2} textAnchor="end" fontSize="10" fill="#655F82">
						{max}
					</text>
					<text x={PAD_L - 8} y={baselineY + 4} textAnchor="end" fontSize="10" fill="#655F82">
						0
					</text>
				</svg>
				{pts.length > 1 && (
					<div className="relative h-6 mt-1">
						{daily.map((d, i) => (
							<span
								key={`lbl-${i}`}
								className="absolute mono text-[10px] text-faintc -translate-x-1/2 whitespace-nowrap"
								style={{ left: `${((PAD_L + i * stepX) / W) * 100}%` }}
							>
								{dayLabel(d.date)}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	);
}


