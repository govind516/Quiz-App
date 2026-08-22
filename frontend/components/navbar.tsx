"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { API_BASE_URL } from "@/lib/config";
import { IconHexLogo } from "./icons";

const emptySubscribe = () => () => {};

export function Navbar() {
	const router = useRouter();
	const { user, logout } = useAuthStore();
	const mounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false
	);

	const mobileLinks = [
		{ href: "/browse", label: "Practice" },
		{ href: "/leaderboard", label: "Leaderboard" },
		...(mounted && user
			? [
					{ href: "/build", label: "Build" },
					{ href: "/live/create", label: "Live" },
				]
			: []),
	];

	return (
		<header className="sticky top-0 z-30 border-b border-line bg-[rgba(13,10,29,0.82)] backdrop-blur-md">
			<div className="max-w-[1240px] mx-auto px-5 sm:px-10">
				<nav className="site-nav !py-3.5 flex-wrap gap-y-2">
					<Link href="/" className="brand">
						<IconHexLogo size={24} />
						HexQuiz
					</Link>
					<div className="nav-links hidden md:flex">
						<Link href="/browse">Practice</Link>
						<Link href="/leaderboard">Leaderboard</Link>
						{mounted && user && (
							<>
								<Link href="/build">Build</Link>
								<Link href="/live/create">Live</Link>
							</>
						)}
					</div>
					<nav className="flex items-center gap-2">
						{mounted && user ? (
							<>
								{user.role === "ADMIN" && (
									<Link href="/admin" className="badge badge-violet hidden sm:inline-flex">
										Admin
									</Link>
								)}
								<Link href="/me" className="btn btn-ghost btn-sm">
									{user.name.split(" ")[0]} · Progress
								</Link>
								<button
									className="btn btn-outline btn-sm"
									onClick={async () => {
										const refreshToken = useAuthStore.getState().refreshToken;
										if (refreshToken) {
											try {
												await fetch(`${API_BASE_URL}/api/auth/logout`, {
													method: "POST",
													headers: { "Content-Type": "application/json" },
													body: JSON.stringify({ refreshToken }),
												});
											} catch {}
										}
										logout();
										router.push("/");
									}}
								>
									Log out
								</button>
							</>
						) : mounted ? (
							<>
								<Link href="/auth" className="btn btn-ghost btn-sm">
									Log in
								</Link>
								<Link href="/auth?mode=signup" className="btn btn-primary btn-sm">
									Start free
								</Link>
							</>
						) : (
							<div className="h-[34px] w-[150px]" />
						)}
					</nav>
				</nav>
				<div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
					{mobileLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="badge whitespace-nowrap shrink-0 hover:border-violet hover:text-violet"
						>
							{link.label}
						</Link>
					))}
				</div>
			</div>
		</header>
	);
}
