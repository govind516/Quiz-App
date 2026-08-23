import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function svgProps({ size = 18, ...rest }: P): SVGProps<SVGSVGElement> {
	return {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		...rest,
	};
}

export function IconHexLogo(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.6, ...p })}>
			<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
			<circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
		</svg>
	);
}

export function IconLock(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<rect x="5" y="10" width="14" height="10" rx="2" />
			<path d="M8 10V7a4 4 0 018 0v3" />
		</svg>
	);
}

export function IconCheck(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 2.4, ...p })}>
			<path d="M5 13l4 4L19 7" />
		</svg>
	);
}

export function IconX(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 2.4, ...p })}>
			<path d="M6 6l12 12M18 6L6 18" />
		</svg>
	);
}

export function IconArrowUp(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 2.2, ...p })}>
			<path d="M12 19V5M5 12l7-7 7 7" />
		</svg>
	);
}

export function IconArrowRight(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 2, ...p })}>
			<path d="M5 12h14M13 5l7 7-7 7" />
		</svg>
	);
}

export function IconChevronLeft(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 2.2, ...p })}>
			<path d="M15 18l-6-6 6-6" />
		</svg>
	);
}

export function IconGrid(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<rect x="4" y="4" width="7" height="7" rx="1.5" />
			<rect x="13" y="4" width="7" height="7" rx="1.5" />
			<rect x="4" y="13" width="7" height="7" rx="1.5" />
			<rect x="13" y="13" width="7" height="7" rx="1.5" />
		</svg>
	);
}

export function IconUsers(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<circle cx="9" cy="8" r="3.2" />
			<path d="M2.6 20c.5-3.4 3.2-6 6.4-6s5.9 2.6 6.4 6" />
			<circle cx="17.5" cy="9" r="2.4" />
			<path d="M15.2 14.2c2.6.5 4.6 2.8 4.9 5.8" />
		</svg>
	);
}

export function IconQuestion(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<circle cx="12" cy="12" r="9" />
			<path d="M9.5 9a2.5 2.5 0 114 2c-.8.6-1.5 1.1-1.5 2.2" />
			<circle cx="12" cy="16.6" r="0.6" fill="currentColor" stroke="none" />
		</svg>
	);
}

export function IconAnalytics(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<path d="M4 20V10M11 20V4M18 20v-7" />
		</svg>
	);
}

export function IconSettings(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<circle cx="12" cy="12" r="8" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

export function IconSearch(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<circle cx="11" cy="11" r="7" />
			<path d="M21 21l-4.3-4.3" />
		</svg>
	);
}

export function IconBell(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<path d="M6 10a6 6 0 0112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" />
			<path d="M10 19a2 2 0 004 0" />
		</svg>
	);
}

export function IconTrophy(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.7, ...p })}>
			<path d="M6 4h12v3a6 6 0 01-12 0V4z" />
			<path d="M6 5H3.5A2.5 2.5 0 006 7.5M18 5h2.5A2.5 2.5 0 0118 7.5" />
			<path d="M10.5 14v4M13.5 14v4" />
			<path d="M8 20h8" />
		</svg>
	);
}

export function IconTag(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<path d="M3 11.5L12.5 2H20a1 1 0 011 1v7.5L11.5 21 3 12.5z" />
			<circle cx="15.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
		</svg>
	);
}

export function IconTrash(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<path d="M3 6h18" />
			<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
			<path d="M10 11v6M14 11v6" />
		</svg>
	);
}

export function IconUpload(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
			<polyline points="17 8 12 3 7 8" />
			<line x1="12" y1="3" x2="12" y2="15" />
		</svg>
	);
}

export function IconChartLine(p: P = {}) {
	return (
		<svg {...svgProps({ strokeWidth: 1.8, ...p })}>
			<path d="M3 3v18h18" />
			<path d="M7 14l4-4 3 3 5-6" />
		</svg>
	);
}
