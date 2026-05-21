import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CodeQuest AI - Learn Coding Through Gaming",
  description: "AI-powered gamified coding platform. Solve quests, battle bosses, level up your skills.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans min-h-screen">
        <Providers>
          {children}
          <Toaster theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}
