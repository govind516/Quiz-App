"use client";

import { useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "ghost" | "outline" | "danger";
	size?: "md" | "sm";
	block?: boolean;
};

export function Button({
	variant = "primary",
	size = "md",
	block,
	className = "",
	...rest
}: ButtonProps) {
	const classes = [
		"btn",
		`btn-${variant}`,
		size === "sm" ? "btn-sm" : "",
		block ? "btn-block" : "",
		className,
	].join(" ");
	return <button className={classes} {...rest} />;
}

export function Badge({
	tone,
	children,
	className = "",
}: {
	tone?: "violet" | "mint" | "amber" | "danger";
	children: ReactNode;
	className?: string;
}) {
	return (
		<span className={`badge ${tone ? `badge-${tone}` : ""} ${className}`}>
			{children}
		</span>
	);
}

export function Card({
	hover,
	className = "",
	children,
}: {
	hover?: boolean;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={`card ${hover ? "card-hover" : ""} ${className}`}>
			{children}
		</div>
	);
}

export function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<div className="field">
			<label>{label}</label>
			{children}
			{error && <span className="text-xs text-dangerc">{error}</span>}
		</div>
	);
}

export function Eyebrow({ children }: { children: ReactNode }) {
	return <span className="eyebrow">{children}</span>;
}

export function initials(name: string): string {
	return name
		.split(/\s+/)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export function CountUp({
	value,
	suffix = "",
	className = "",
}: {
	value: number;
	suffix?: string;
	className?: string;
}) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el || value <= 0) return;
		let raf = 0;
		let startTime: number | null = null;
		const duration = 1200;
		const step = (ts: number) => {
			if (startTime === null) startTime = ts;
			const progress = Math.min((ts - startTime) / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			el.textContent = Math.floor(eased * value).toLocaleString() + suffix;
			if (progress < 1) raf = requestAnimationFrame(step);
			else el.textContent = value.toLocaleString() + suffix;
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	}, [value, suffix]);
	return (
		<span ref={ref} className={className}>
			0{suffix}
		</span>
	);
}
