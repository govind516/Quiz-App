"use client";

import Link from "next/link";
import Aurora from "@/components/Aurora";
import { Eyebrow, FadeUp, RevealHeading } from "@/components/Reveal";
import { IconArrowRight } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <Aurora />
      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10 py-24 text-center">
        <FadeUp><Eyebrow>404</Eyebrow></FadeUp>
        <FadeUp delay={0.1}>
          <RevealHeading
            lines={['Page not', 'found.']}
            className="mt-6 font-display text-[64px] md:text-[92px] leading-[0.92] text-white"
          />
        </FadeUp>
        <FadeUp delay={0.2} className="mt-8 max-w-md mx-auto text-[17px] text-[color:var(--ink-2)]">
          The page you're looking for doesn't exist or has been moved.
        </FadeUp>
        <FadeUp delay={0.3} className="mt-10">
          <Link href="/" className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[color:var(--ink)] text-[#0A0A0F] text-[14px] font-medium hover:bg-white transition-all">
            Go home <IconArrowRight size={14} className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </FadeUp>
      </div>
    </div>
  );
}