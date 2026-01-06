import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_LENDING_URL || 'https://getviralreel.com'),
  title: {
    template: '%s | Viral Reel',
    default: 'Viral Reel - AI Content Creator',
  },
  description: "Create faceless videos in 5 minutes with AI.",
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    images: '/opengraph-image.png',
  },
  twitter: {
    card: 'summary_large_image',
    images: '/opengraph-image.png',
  },
};

import { PHProvider } from "../components/posthog-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PHProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-slate-900`}
        >
          {children}
        </body>
      </PHProvider>
    </html>
  );
}
