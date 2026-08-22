"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import type { CertificateDto } from "@/lib/types";
import { Button, Eyebrow } from "@/components/ui";

export default function CertificatePage() {
	const { code } = useParams<{ code: string }>();

	const certQuery = useQuery({
		queryKey: ["certificate", code],
		queryFn: () => publicApi<CertificateDto>(`/api/certificates/${code}`),
		retry: false,
	});

	if (certQuery.isPending) {
		return <div className="h-64 animate-pulse rounded-xl bg-surface2 mt-10" />;
	}

	if (certQuery.isError || !certQuery.data) {
		return (
			<div className="max-w-lg mx-auto card p-10 text-center mt-10">
				<h2 className="text-lg font-semibold text-ink">Certificate not found</h2>
				<p className="mt-2 text-sm text-mutedc">
					Code <span className="mono">{code}</span> does not match any issued
					certificate.
				</p>
				<Link href="/" className="btn btn-outline mt-5 inline-flex">
					Back home
				</Link>
			</div>
		);
	}

	const cert = certQuery.data;

	return (
		<div className="max-w-2xl mx-auto py-12">
			<div
				id="certificate"
				className="rounded-2xl border-[10px] border-double border-violet/40 bg-gradient-to-br from-surface to-violetdim p-10 text-center shadow-glow"
			>
				<div className="flex justify-center text-violet mb-4">
					<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
						<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
						<circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
					</svg>
				</div>
				<p className="mono text-xs uppercase tracking-[0.3em] text-faintc">
					Certificate of Achievement
				</p>
				<p className="mt-8 text-sm text-mutedc">This certifies that</p>
				<h1 className="mt-3 font-display text-[42px] font-bold text-ink leading-tight">
					{cert.userName}
				</h1>
				<p className="mt-5 text-sm text-mutedc">
					has successfully completed the full quiz series for
				</p>
				<h2 className="mt-1 text-2xl font-semibold text-mint">
					{cert.categoryName}
				</h2>

				<div className="mx-auto mt-9 h-px w-44 bg-line-strong" />

				<div className="mt-7 flex items-center justify-center gap-12 text-left text-xs text-mutedc">
					<div>
						<p className="font-semibold text-ink mb-0.5">Verification code</p>
						<p className="mono text-base tracking-[0.25em]">{cert.code}</p>
					</div>
					<div>
						<p className="font-semibold text-ink mb-0.5">Issued</p>
						<p>{new Date(cert.issuedAt).toLocaleDateString()}</p>
					</div>
				</div>
			</div>

			<div className="mt-8 flex flex-wrap justify-center items-center gap-3 print:hidden">
				<Button onClick={() => window.print()}>Print / Save as PDF</Button>
				<span className="text-xs text-faintc">
					Anyone can verify this certificate at this URL.
				</span>
			</div>
			<Eyebrow>&nbsp;</Eyebrow>
		</div>
	);
}
