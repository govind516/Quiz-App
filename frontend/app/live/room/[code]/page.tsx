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
import { Button, Eyebrow, initials } from "@/components/ui";

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
			<div className="max-w-md mx-auto card p-10 text-center mt-10">
				<h2 className="text-lg font-semibold text-ink">Room not found</h2>
				<p className="mt-2 text-sm text-mutedc">
					Room <span className="mono">{code}</span> doesn&apos;t exist or has expired.
				</p>
				<Link href="/live/join" className="btn btn-primary mt-5 inline-flex">
					Try another code
				</Link>
			</div>
		);
	}

	if (finalResults) {
		return (
			<div className="mx-auto max-w-xl py-10">
				<div className="text-center mb-8">
					<Eyebrow>Final results</Eyebrow>
					<h1 className="text-[32px] mt-2">{finalResults.quizTitle}</h1>
				</div>
				<div className="space-y-3">
					{finalResults.entries.map((entry, i) => (
						<div
							key={entry.playerId}
							className={`card flex items-center justify-between ${
								i === 0 ? "!border-amberc/50" : ""
							}`}
						>
							<span className="flex items-center gap-3 font-semibold text-ink">
								<span className="row-avatar">{initials(entry.nickname)}</span>
								{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}{" "}
								{entry.nickname}
							</span>
							<span className="row-score !text-base text-mint">
								{entry.score}
							</span>
						</div>
					))}
				</div>
				<div className="mt-10 flex justify-center gap-3 flex-wrap">
					<Link href="/live/create" className="btn btn-primary">
						Host another game
					</Link>
					<button onClick={() => router.push("/browse")} className="btn btn-outline">
						Browse quizzes
					</button>
				</div>
			</div>
		);
	}

	if (question) {
		const isMulti = question.question.type === "MULTI_SELECT";
		const myAnswered =
			answeredNow ||
			(identity
				? (question.scoreboard.find((s) => s.playerId === identity.playerId)
						?.answeredCurrent ?? false)
				: false);
		const timeFraction = Math.max(0, Math.min(1, remainingMs / (20 * 1000)));

		return (
			<div className="mx-auto max-w-2xl py-10">
				<div className="flex items-center justify-between mb-4">
					<span className="mono text-[13px] text-mutedc">
						Question {question.index + 1} of {question.total}
					</span>
					<div className="timer-wrap">
						<svg className="timer-ring" viewBox="0 0 54 54">
							<circle className="timer-ring-bg" cx="27" cy="27" r="24" />
							<circle
								className="timer-ring-fg"
								cx="27"
								cy="27"
								r="24"
								style={{
									strokeDashoffset: 150.8 * (1 - timeFraction),
									stroke: remainingMs < 5000 ? "#FFB84D" : "#7B5CFF",
								}}
							/>
						</svg>
						<div className="timer-value" style={{ color: remainingMs < 5000 ? "#FFB84D" : undefined }}>
							{Math.max(0, Math.ceil(remainingMs / 1000))}
						</div>
					</div>
				</div>

				<div className="q-card">
					<h3>{question.question.questionText}</h3>
				</div>

				<div className="options">
					{question.question.options.map((option, i) => {
						const isSelected = selected.includes(option.optionId);
						const marks = ["A", "B", "C", "D", "E", "F"];
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
								className={`option ${isSelected ? "selected" : ""}`}
							>
								<div className="opt-mark">{marks[i]}</div>
								{option.optionText}
							</button>
						);
					})}
				</div>

				{isMulti && selected.length > 0 && !myAnswered && (
					<Button block className="mt-4" onClick={() => lockIn(selected)}>
						Lock in answer ({selected.length})
					</Button>
				)}

				{identity && myAnswered && (
					<div className="explain-inner mt-6 text-center">
						Answer locked in — waiting for other players…
					</div>
				)}
				{!identity && (
					<p className="mt-6 text-center text-xs text-faintc">
						Spectator mode — you&apos;re watching without joining.
					</p>
				)}

				<div className="card mt-8">
					<p className="mb-3 text-xs uppercase tracking-wide text-faintc mono">
						Live scoreboard
					</p>
					<ul className="space-y-2">
						{question.scoreboard.map((player, i) => (
							<li key={player.playerId} className="flex items-center justify-between text-sm">
								<span className="font-medium text-ink">
									{i + 1}. {player.nickname}
									{player.answeredCurrent && <span className="ml-2 badge badge-mint">in</span>}
								</span>
								<span className="row-score text-mint">{player.score}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		);
	}

	if (info) {
		return (
			<div className="mx-auto max-w-lg py-12 text-center">
				<Eyebrow>Room code — share it!</Eyebrow>
				<div className="mono text-4xl sm:text-[56px] font-bold tracking-[0.12em] sm:tracking-[0.22em] text-violet mt-3 leading-none">
					{info.code}
				</div>
				<p className="mt-4 font-semibold text-ink">{info.quizTitle}</p>
				<p className="text-sm text-faintc">hosted by {info.hostName}</p>

				{!identity && !isHost && (
					<Link href="/live/join" className="btn btn-primary mt-7 inline-flex">
						You haven&apos;t joined — enter your nickname →
					</Link>
				)}
				{isHost && info.status === "LOBBY" && (
					<Button
						block
						className="mt-7"
						disabled={info.players.length < 1}
						onClick={() => void startGame()}
					>
						Start game ({info.players.length} player
						{info.players.length === 1 ? "" : "s"})
					</Button>
				)}
				{info.status === "ACTIVE" && !question && (
					<p className="mt-7 animate-pulse text-sm text-mutedc">Game starting…</p>
				)}

				<div className="card mt-9 text-left">
					<p className="mb-3 text-xs uppercase tracking-wide text-faintc mono">
						Players in lobby
					</p>
					<ul className="space-y-2">
						{info.players.map((player) => (
							<li key={player.playerId} className="flex items-center gap-3 text-sm">
								<div className="row-avatar">{initials(player.nickname)}</div>
								<span className="font-medium text-ink">{player.nickname}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		);
	}

	return <div className="h-64 animate-pulse rounded-xl bg-surface2 mt-10 max-w-lg mx-auto" />;
}
