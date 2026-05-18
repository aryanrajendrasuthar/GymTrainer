import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  preload: true,
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Trainer — Your Personal Fitness & Physiotherapy App",
  description:
    "Premium cross-platform fitness and physiotherapy app. Intelligent workout logging, progressive overload tracking, and evidence-based physiotherapy protocols.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trainer",
  },
  openGraph: {
    type: "website",
    siteName: "Trainer",
    title: "Trainer — Your Personal Fitness & Physiotherapy App",
    description:
      "Premium cross-platform fitness and physiotherapy app. Intelligent workout logging, progressive overload tracking, and evidence-based physiotherapy protocols.",
  },
  twitter: {
    card: "summary",
    title: "Trainer — Your Personal Fitness & Physiotherapy App",
    description:
      "Premium cross-platform fitness and physiotherapy app. Intelligent workout logging, progressive overload tracking, and evidence-based physiotherapy protocols.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-trainer-black text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
