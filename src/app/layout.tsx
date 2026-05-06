import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "AI Public Video Discovery Platform",
  description: "Manifest-based public Dailymotion video metadata discovery and filtering.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(() => { try { const stored = localStorage.getItem('theme'); const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; const next = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', next === 'dark'); document.documentElement.dataset.theme = next; } catch {} })();",
          }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
