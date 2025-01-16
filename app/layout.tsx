import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { basePath } from "@/constants/env";

import "../styles/global.scss";
import "../styles/layout.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "凡生",
  description: "凡生的个人网站——前端工程师、极限运动员、闲来拍几张",
  keywords: ["凡生", "前端工程师", "极限运动员", "摄影"],
  icons: {
    icon: `${basePath}/favicon.ico`,
    shortcut: `${basePath}/favicon.ico`,
    apple: `${basePath}/apple-touch-icon.png`,
    other: {
      rel: "icon",
      url: `${basePath}/favicon.ico`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        <div className="fixed top-0 left-0 right-0 bottom-0">{children}</div>
      </body>
    </html>
  );
}
