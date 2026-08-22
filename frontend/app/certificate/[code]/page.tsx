"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import type { CertificateDto } from "@/lib/types";

export default function CertificatePage() {
	const { code } = useParams<{ code: string }>();

	const certQuery = useQuery({
		queryKey: ["certificate", code],
		queryFn: () => publicApi<CertificateDto>(`/api/certificates/${code}`),
		retry: false,
	});

	if (certQuery.isPending) {
		return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
	}

	if (certQuery.isError || !certQuery.data) {
		return (
			<div className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-white p-10 text-center">
				<h1 className="text-lg font-semibold text-slate-900">
					Certificate not found
				</h1>
				<p className="mt-2 text-sm text-slate-500">
					Code <span className="font-mono">{code}</span> does not match any
					issued certificate.
				</p>
				<Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline">
					Browse quizzes →
				</Link>
			</div>
		);
	}

	const cert = certQuery.data;

	return (
		<div className="mx-auto max-w-2xl">
			<div
				id="certificate"
				className="rounded-2xl border-8 border-double border-indigo-300 bg-gradient-to-br from-white to-indigo-50 p-10 text-center shadow-lg"
			>
				<p className="text-xs uppercase tracking-[0.3em] text-slate-400">
					Certificate of Achievement
				</p>
				<p className="mt-6 text-sm text-slate-500">This certifies that</p>
				<h1 className="mt-2 text-4xl font-serif font-bold text-slate-900">
					{cert.userName}
				</h1>
				<p className="mt-4 text-sm text-slate-500">
					has successfully completed the full quiz series for
				</p>
				<h2 className="mt-1 text-2xl font-bold text-indigo-600">
					{cert.categoryName}
				</h2>

				<div className="mx-auto mt-8 h-px w-40 bg-slate-200" />

				<div className="mt-6 flex items-center justify-center gap-10 text-left text-xs text-slate-500">
					<div>
						<p className="font-semibold text-slate-700">Verification code</p>
						<p className="font-mono text-base tracking-widest text-slate-800">
							{cert.code}
						</p>
					</div>
					<div>
						<p className="font-semibold text-slate-700">Issued</p>
						<p>{new Date(cert.issuedAt).toLocaleDateString()}</p>
					</div>
				</div>
			</div>

			<div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
				<button
					onClick={() => window.print()}
					className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
				>
					Print / Save as PDF
				</button>
				<span className="self-center text-xs text-slate-400">
					Anyone can verify this certificate at this URL.
				</span>
			</div>
		</div>
	);
}
