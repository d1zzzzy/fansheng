import Link from "next/link";
import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { basePath } from "@/constants/env";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: '凡生',
  description: '凡生的个人网站——前端工程师、极限运动员、闲来拍几张',
  keywords: ['凡生', '前端工程师', '极限运动员', '摄影'],
  icons: {
    icon: `${basePath}/favicon.ico`,
    shortcut: `${basePath}/favicon.ico`,
    apple: `${basePath}/apple-touch-icon.png`,
    other: {
      rel: 'icon',
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8 text-2xl" aria-label="Global">
          <div className="flex sm:flex-1">
            <Link href="/">Void</Link>
          </div>
          <div className="flex sm:flex-1">
            <Link href="/projects">Have Fun</Link>
          </div>
          <div className="flex sm:flex-1">
            <Link href="/album">Album</Link>
          </div>
          <div className="flex sm:flex-1">
            <Link href="/profile">Profile</Link>
          </div>

          <div className="flex sm:flex-1">
            <Link href="/schedule">Schedule</Link>
          </div>
        </nav>

        <div className="fixed top-20 left-0 right-0 bottom-0 overflow-y-auto">{children}</div>
      </body>
    </html>
  );
}
