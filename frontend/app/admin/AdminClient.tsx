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
	| "ai"
	| "import"
	| "review"
	| "users"
	| "analytics"
	| "settings";

type Toast = { id: number; message: string; type: "success" | "error" };

export default function AdminClient() {
	const router = useRouter();
	const { user, logout } = useAuthStore();
	const queryClient = useQueryClient();
	const [section, setSection] = useState<SectionId>("dashboard");
	const [toasts, setToasts] = useState<Toast[]>([]);
	const [showNav, setShowNav] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const sidebarRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!user || user.role !== "ADMIN") {
			router.push("/");
			return;
		}
	}, [user, router]);

	useEffect(() => {
		const onScroll = () => setIsScrolled(window.scrollY > 12);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		if (showNav && sidebarRef.current) {
			const handleClickOutside = (e: MouseEvent) => {
				if (!sidebarRef.current?.contains(e.target as Node)) setShowNav(false);
			};
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [showNav]);

	function notify(message: string, type: "success" | "error") {
		const id = Date.now();
		setToasts((t) => [...t, { id, message, type }]);
		setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
	}

	const { data: categoriesQuery } = useQuery({
		queryKey: ["admin", "categories"],
		queryFn: () => api<CategoryDto[]>("/api/admin/categories"),
	});

	const { data: pendingQuestions } = useQuery({
		queryKey: ["admin", "pending"],
		queryFn: () => api<QuestionAdminDto[]>("/api/admin/questions/pending"),
	});

	if (!user || user.role !== "ADMIN") return null;

	return (
		<div className="relative min-h-screen flex overflow-hidden">
			<header
				className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? "bg-[color:var(--bg)]/90 backdrop-blur-md border-b border-[color:var(--line)]" : "bg-transparent"}`}
			>
				<div className="mx-auto max-w-[1400px] px-4 md:px-6 h-16 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							type="button"
							className="lg:hidden p-2 rounded-lg text-[color:var(--ink-2)] hover:text-white hover:bg-[color:var(--surface2)]"
							onClick={() => setShowNav(true)}
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
								<line x1="3" y1="6" x2="21" y2="6" />
								<line x1="3" y1="12" x2="21" y2="12" />
								<line x1="3" y1="18" x2="21" y2="18" />
							</svg>
						</button>
						<Link href="/" className="flex items-center gap-2">
							<svg viewBox="0 0 40 44" width="28" height="28" className="relative">
								<defs>
									<linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
										<stop offset="0%" stopColor="#C4B5FD" />
										<stop offset="55%" stopColor="#8B7CF6" />
										<stop offset="100%" stopColor="#5B4BC4" />
									</linearGradient>
								</defs>
								<polygon points="20,2 37,12 37,32 20,42 3,32 3,12" fill="none" stroke="url(#hg)" strokeWidth="2" strokeLinejoin="round" />
								<polygon points="20,10 30,16 30,28 20,34 10,28 10,16" fill="url(#hg)" opacity="0.15" />
							</svg>
							<span className="font-display text-xl leading-none tracking-tight text-white">Hex<span className="text-[color:var(--violet-2)]">Quiz</span></span>
						</Link>
					</div>
					<div className="flex items-center gap-3">
						<span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-[color:var(--violet-2)] border border-[color:var(--violet)]/25 bg-[color:var(--violet)]/10">
							Admin
						</span>
						<div className="relative">
							<button
								type="button"
								className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[color:var(--surface2)] transition-colors"
							>
								<div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm text-white" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.4), rgba(127,231,206,0.3))" }}>
									{initials(user.name)}
								</div>
							</button>
						</div>
					</div>
				</div>
			</header>

			<aside
				ref={sidebarRef}
				className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-[color:var(--bg-2)] border-r border-[color:var(--line)] transition-transform duration-300 ease-in-out lg:translate-x-0 ${showNav ? "translate-x-0" : "-translate-x-full"}`}
			>
				<div className="flex flex-col h-full pt-20 pb-6 px-4">
					<nav className="flex-1 space-y-1">
						{[
							{ id: "dashboard", label: "Dashboard", icon: IconChartLine },
							{ id: "questions", label: "Questions", icon: IconQuestion },
							{ id: "categories", label: "Categories", icon: IconTag },
							{ id: "ai", label: "AI Studio", icon: IconSettings },
							{ id: "import", label: "Bulk Import", icon: IconUpload },
							{ id: "review", label: "Review Queue", icon: IconCheck },
							{ id: "users", label: "Users", icon: IconUsers },
							{ id: "analytics", label: "Analytics", icon: IconAnalytics },
							{ id: "settings", label: "Settings", icon: IconSettings },
						].map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => {
									setSection(item.id as SectionId);
									setShowNav(false);
								}}
								className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all ${section === item.id ? "bg-[color:var(--violet)]/15 text-[color:var(--violet-2)] border border-[color:var(--violet)]/20" : "text-[color:var(--ink-2)] hover:text-white hover:bg-[color:var(--surface2)]"}`}
							>
								<item.icon className="w-5 h-5 flex-shrink-0" />
								<span className="font-medium text-[14px]">{item.label}</span>
							</button>
						))}
					</nav>
					<div className="pt-4 border-t border-[color:var(--line)]">
						<button
							type="button"
							onClick={() => logout()}
							className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-[color:var(--ink-2)] hover:text-[color:var(--coral)] hover:bg-[color:var(--surface2)] transition-colors"
						>
							<IconX className="w-5 h-5 flex-shrink-0" />
							<span className="font-medium text-[14px]">Sign out</span>
						</button>
					</div>
				</div>
			</aside>

			{showNav && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setShowNav(false)}
				/>
			)}

			<main className="flex-1 lg:ml-72 pt-20 min-h-screen" style={{ paddingBottom: "120px" }}>
				<div className="mx-auto max-w-[1400px] px-4 md:px-6 pb-12">
					{toasts.map((t) => (
						<div key={t.id} className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-in slide-in-from-right ${t.type === "success" ? "bg-[color:var(--mint)] text-[#0A0A0F]" : "bg-[color:var(--coral)] text-white"}`}>
							{t.message}
						</div>
					))}

					{section === "categories" && <CategoriesPanel />}
					{section === "users" && <UsersPanelView />}
					{section === "analytics" && <AnalyticsPanelView />}
					{section === "settings" && <SettingsPanel />}
					{section === "dashboard" && <div className="p-4 text-center text-[color:var(--ink-2)]">Dashboard - Coming Soon</div>}
					{section === "questions" && <div className="p-4 text-center text-[color:var(--ink-2)]">Questions - Coming Soon</div>}
					{section === "ai" && <div className="p-4 text-center text-[color:var(--ink-2)]">AI Studio - Coming Soon</div>}
					{section === "import" && <div className="p-4 text-center text-[color:var(--ink-2)]">Bulk Import - Coming Soon</div>}
					{section === "review" && <div className="p-4 text-center text-[color:var(--ink-2)]">Review Queue - Coming Soon</div>}
				</div>
			</main>
		</div>
	);
}