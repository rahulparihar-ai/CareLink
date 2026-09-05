import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/themes/ThemeProvider";
import { ThorGuide } from "@/features/thor/ThorGuide";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareLink — Connecting Care, Enriching Lives",
  description: "A premium digital healthcare companion. Your health information, organized in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          {children}
          <ThorGuide />
        </ThemeProvider>
      </body>
    </html>
  );
}
