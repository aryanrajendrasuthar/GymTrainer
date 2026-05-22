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
  authors: [{ name: "Aryan Rajendra Suthar", url: "mailto:aryanrajendrasuthar@gmail.com" }],
  creator: "Aryan Rajendra Suthar",
  publisher: "Aryan Rajendra Suthar",
  keywords: ["fitness", "gym", "workout", "physiotherapy", "training", "progressive overload"],
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
    creator: "@aryansuthar",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="author" content="Aryan Rajendra Suthar" />
        <meta name="copyright" content={`© ${new Date().getFullYear()} Aryan Rajendra Suthar. All rights reserved.`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-trainer-black text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
