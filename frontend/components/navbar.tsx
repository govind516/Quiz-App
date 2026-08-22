"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/lib/auth-store";

const emptySubscribe = () => () => {};

export function Navbar() {
	const router = useRouter();
	const { user, logout } = useAuthStore();
	const mounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false
	);

	return (
		<header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
			<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
				<Link href="/" className="text-lg font-bold tracking-tight text-indigo-600">
					IT Quiz Platform
				</Link>
				<nav className="flex items-center gap-2 text-sm sm:gap-4">
					<Link href="/" className="rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
						Browse
					</Link>
					{mounted && user ? (
						<>
							{user.role === "ADMIN" && (
								<Link
									href="/admin"
									className="rounded-md px-2 py-1 font-medium text-indigo-600 hover:bg-indigo-50"
								>
									Admin
								</Link>
							)}
							<Link
								href="/me"
								className="rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
							>
								My Progress
							</Link>
							<span className="hidden text-slate-500 sm:inline">{user.name}</span>
							<button
								onClick={() => {
									logout();
									router.push("/");
								}}
								className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100"
							>
								Log out
							</button>
						</>
					) : mounted ? (
						<>
							<Link
								href="/login"
								className="rounded-md px-2 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
							>
								Log in
							</Link>
							<Link
								href="/register"
								className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white transition hover:bg-indigo-700"
							>
								Sign up
							</Link>
						</>
					) : null}
				</nav>
			</div>
		</header>
	);
}
