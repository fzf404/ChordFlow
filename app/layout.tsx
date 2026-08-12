import type { Metadata } from "next";
import { Noto_Sans_SC, Outfit } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_SC({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const display = Outfit({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "ChordFlow — 看见和弦，轻松弹琴",
  description: "为钢琴初学者设计的可视化和弦练习室。",
  icons: { icon: "/chordflow-icon.png", shortcut: "/chordflow-icon.png", apple: "/chordflow-apple-icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${sans.variable} ${display.variable}`}>{children}</body></html>;
}
