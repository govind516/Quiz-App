import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "HexQuiz — Prove your stack",
  description:
    "Sharpen JavaScript, Python, networking, SQL and system design with quizzes built for interview prep. No account required to start.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
      style={{ ["--font-apple" as string]: '-apple-system, "SF Pro Display", "SF Pro Text", BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif' } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1 w-full max-w-[1240px] mx-auto px-5 sm:px-10">
            {children}
          </main>
          <footer>
            <div className="max-w-[1240px] mx-auto px-5 sm:px-10">
              <div className="site-footer">
                <div className="brand text-[15px]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                    <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
                    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
                  </svg>
                  HexQuiz
                </div>
                <div className="faintc text-xs">
                  Practice quizzes for developers · No account required to start
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
