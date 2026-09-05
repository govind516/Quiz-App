import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "HexQuiz - Prove your stack",
  description: "Sharpen JavaScript, Python, networking, SQL and system design with quizzes built for interview prep. No account required to start.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
