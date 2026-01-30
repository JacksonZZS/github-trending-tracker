import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHub Trending Tracker",
  description: "每日追踪 GitHub Trending 项目，支持语言筛选、收藏、微信通知",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}
