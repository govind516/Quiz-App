"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api, publicApi } from "@/lib/api";
import { createLiveClient, sendLiveAnswer, type LiveMessage } from "@/lib/live";
import type {
	FinalResultsPayload,
	LiveQuestionPayload,
	LiveRoomInfo,
} from "@/lib/types";

type Identity = { playerId: string; nickname: string };

const emptySubscribe = () => () => {};

let cachedIdentityKey = "";
let cachedIdentityValue: Identity | null = null;

function readIdentity(code: string): Identity | null {
	if (typeof window === "undefined") return null;
	if (cachedIdentityKey !== code) {
		cachedIdentityKey = code;
		cachedIdentityValue = null;
		try {
			const raw = sessionStorage.getItem(`live.player.${code}`);
			if (raw) cachedIdentityValue = JSON.parse(raw) as Identity;
		} catch {}
	}
	return cachedIdentityValue;
}

function formatMs(ms: number): string {
	const s = Math.max(0, Math.ceil(ms / 1000));
	return String(s).padStart(2, "0");
}

export default function LiveRoomPage() {
	const { code } = useParams<{ code: string }>();
	const router = useRouter();

	const [info, setInfo] = useState<LiveRoomInfo | null>(null);
	const [question, setQuestion] = useState<LiveQuestionPayload | null>(null);
	const [finalResults, setFinalResults] = useState<FinalResultsPayload | null>(null);
	const identity = useSyncExternalStore(
		emptySubscribe,
		() => readIdentity(code),
		() => null
	);
	const isHost = useSyncExternalStore(
		emptySubscribe,
		() => sessionStorage.getItem(`live.host.${code}`) === "1",
		() => false
	);
	const [selected, setSelected] = useState<number[]>([]);
	const [answeredNow, setAnsweredNow] = useState(false);
	const [remainingMs, setRemainingMs] = useState(0);
	const [notFound, setNotFound] = useState(false);

	const clientRef = useRef<ReturnType<typeof createLiveClient> | null>(null);

	useEffect(() => {
		publicApi<LiveRoomInfo>(`/api/live-rooms/${code}`)
			.then(setInfo)
			.catch(() => setNotFound(true));
	}, [code]);

	const handleMessage = useCallback((message: LiveMessage) => {
		if (message.kind === "lobby") {
			setInfo(message.info);
			return;
		}
		if (message.kind === "question") {
			setAnsweredNow(false);
			setSelected([]);
			setQuestion(message.payload);
			setRemainingMs(message.payload.endsAtEpochMs - Date.now());
			return;
		}
		setQuestion(null);
		setFinalResults(message.results);
	}, []);

	useEffect(() => {
		clientRef.current = createLiveClient(code, handleMessage);
		return () => {
			void clientRef.current?.deactivate();
		};
	}, [code, handleMessage]);

	useEffect(() => {
		if (!question) return;
		const interval = setInterval(() => {
			setRemainingMs(question.endsAtEpochMs - Date.now());
		}, 250);
		return () => clearInterval(interval);
	}, [question]);

	function lockIn(optionIds: number[]) {
		if (!question || !identity || answeredNow) return;
		setAnsweredNow(true);
		sendLiveAnswer(clientRef.current!, code, {
			playerId: identity.playerId,
			questionIndex: question.index,
			questionId: question.question.questionId,
			selectedOptionIds: optionIds,
		});
	}

	async function startGame() {
		try {
			await api(`/api/live-rooms/${code}/start`, { method: "POST" });
		} catch (err) {
			alert(err instanceof Error ? err.message : "Could not start the game.");
		}
	}

	if (notFound) {
		return (
			<div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-10 text-center">
				<h1 className="text-lg font-semibold text-slate-900">Room not found</h1>
				<p className="mt-2 text-sm text-slate-500">
					Room <span className="font-mono">{code}</span> doesn&apos;t exist or has
					expired.
				</p>
				<Link href="/live/join" className="mt-4 inline-block text-indigo-600 hover:underline">
					Try another code →
				</Link>
			</div>
		);
	}

	if (finalResults) {
		return (
			<div className="mx-auto max-w-xl text-center">
				<h1 className="text-3xl font-bold tracking-tight text-slate-900">
					Final results 🏁
				</h1>
				<p className="mt-1 text-slate-500">{finalResults.quizTitle}</p>
				<div className="mt-8 space-y-2">
					{finalResults.entries.map((entry, i) => (
						<div
							key={entry.playerId}
							className={`flex items-center justify-between rounded-xl border p-4 ${
								i === 0
									? "border-amber-300 bg-amber-50"
									: "border-slate-200 bg-white"
							}`}
						>
							<span className="text-lg">
								{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}{" "}
								<strong className="ml-2">{entry.nickname}</strong>
							</span>
							<span className="font-mono font-bold text-indigo-600">
								{entry.score}
							</span>
						</div>
					))}
				</div>
				<div className="mt-8 flex justify-center gap-3">
					<Link
						href="/live/create"
						className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
					>
						Host another game
					</Link>
					<button
						onClick={() => router.push("/")}
						className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
					>
						Browse quizzes
					</button>
				</div>
			</div>
		);
	}

	if (question && identity) {
		const isMulti = question.question.type === "MULTI_SELECT";
		const myAnswered =
			answeredNow ||
			(question.scoreboard.find((s) => s.playerId === identity.playerId)
				?.answeredCurrent ?? false);
		const timeFraction = Math.max(
			0,
			Math.min(1, remainingMs / (20 * 1000))
		);

		return (
			<div className="mx-auto max-w-2xl">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-slate-400">
						Question {question.index + 1} of {question.total}
					</span>
					<span
						className={`rounded-lg px-3 py-1 font-mono text-lg font-bold tabular-nums ${
							remainingMs < 5000 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"
						}`}
					>
						{formatMs(remainingMs)}
					</span>
				</div>
				<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
					<div
						className="h-full bg-indigo-500 transition-all duration-300"
						style={{ width: `${timeFraction * 100}%` }}
					/>
				</div>

				<h2 className="mt-6 text-xl font-semibold leading-relaxed text-slate-900">
					{question.question.questionText}
				</h2>

				{!myAnswered ? (
					<>
						<div className="mt-6 grid gap-3 sm:grid-cols-2">
							{question.question.options.map((option) => {
								const isSelected = selected.includes(option.optionId);
								return (
									<button
										key={option.optionId}
										onClick={() =>
											isMulti
												? setSelected((prev) =>
														prev.includes(option.optionId)
															? prev.filter((id) => id !== option.optionId)
															: [...prev, option.optionId]
													)
												: lockIn([option.optionId])
										}
										className={`rounded-xl border px-4 py-4 text-left transition ${
											isSelected
												? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
												: "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
										}`}
									>
										{option.optionText}
									</button>
								);
							})}
						</div>
						{isMulti && selected.length > 0 && (
							<button
								onClick={() => lockIn(selected)}
								className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
							>
								Lock in answer ({selected.length})
							</button>
						)}
					</>
				) : (
					<div className="mt-6 rounded-xl bg-indigo-50 px-4 py-6 text-center text-sm font-medium text-indigo-700">
						Answer locked in — waiting for other players…
					</div>
				)}

				<Scoreboard players={question.scoreboard} />
			</div>
		);
	}

	if (info) {
		return (
			<div className="mx-auto max-w-lg text-center">
				<p className="text-xs uppercase tracking-[0.3em] text-slate-400">
					Room code — share it!
				</p>
				<h1 className="mt-2 font-mono text-5xl font-black tracking-[0.25em] text-indigo-600">
					{info.code}
				</h1>
				<p className="mt-3 font-medium text-slate-700">{info.quizTitle}</p>
				<p className="text-sm text-slate-400">hosted by {info.hostName}</p>

				{!identity && !isHost && (
					<Link
						href={`/live/join`}
						className="mt-6 inline-block rounded-xl bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600"
					>
						You haven&apos;t joined this room — enter your nickname →
					</Link>
				)}
				{isHost && info.status === "LOBBY" && (
					<button
						onClick={startGame}
						disabled={info.players.length < 1}
						className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
					>
						Start game ({info.players.length} player
						{info.players.length === 1 ? "" : "s"})
					</button>
				)}
				{info.status === "ACTIVE" && !question && (
					<p className="mt-6 animate-pulse text-sm text-slate-500">
						Game starting…
					</p>
				)}

				<div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="mb-3 text-xs uppercase tracking-wide text-slate-400">
						Players in lobby
					</p>
					<ul className="space-y-1.5">
						{info.players.map((player) => (
							<li key={player.playerId} className="text-sm font-medium text-slate-700">
								{player.nickname}
							</li>
						))}
					</ul>
				</div>
			</div>
		);
	}

	return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
}

function Scoreboard({ players }: { players: LiveRoomInfo["players"] }) {
	return (
		<div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
			<p className="mb-3 text-xs uppercase tracking-wide text-slate-400">
				Scoreboard
			</p>
			<ul className="space-y-1.5">
				{players.map((player, i) => (
					<li
						key={player.playerId}
						className="flex items-center justify-between text-sm"
					>
						<span className="font-medium text-slate-700">
							{i + 1}. {player.nickname}
							{player.answeredCurrent ? " ✓" : ""}
						</span>
						<span className="font-mono tabular-nums text-indigo-600">
							{player.score}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
