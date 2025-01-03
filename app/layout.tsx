import Link from "next/link";
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
        <nav
          className="absolute top-0 w-full border-box mx-auto flex items-center justify-between h-40 p-lr-24 header-nav z-5"
          aria-label="Global"
        >
          <div className="nav-item">
            <Link className="nav-item__link" href="/">
              Void
            </Link>
          </div>
          <div className="nav-item">
            <Link className="nav-item__link" href="/projects">
              Have Fun
            </Link>
          </div>
          <div className="nav-item">
            <Link className="nav-item__link" href="/albums">
              Albums
            </Link>
          </div>
          <div className="nav-item">
            <Link className="nav-item__link" href="/profile">
              Profile
            </Link>
          </div>

          <div className="nav-item">
            <Link className="nav-item__link" href="/schedule">
              Schedule
            </Link>
          </div>
        </nav>

        <div className="fixed top-40 left-0 right-0 bottom-0">{children}</div>
      </body>
    </html>
  );
}
