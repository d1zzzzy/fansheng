import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        {/* 默认 favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* 16x16 favicon */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

        {/* 32x32 favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* Manifest 文件（如果有） */}
        <link rel="manifest" href="/manifest.json" />

        {/* 浏览器主题颜色 */}
        <meta name="theme-color" content="#ffffff" />

        {/* 网站描述 */}
        <meta name="description" content="凡生的个人网站——前端工程师、极限运动员、闲来拍几张" />

        {/* 网站关键词 */}
        <meta name="keywords" content="凡生, 前端工程师, 极限运动员, 摄影" />

        {/* 网站标题 */}
        <title>凡生</title>
      </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
