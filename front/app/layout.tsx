import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Branding everywhere: child pages render as "<Page> · SpinCoach".
  title: { default: "SpinCoach", template: "%s · SpinCoach" },
  description: "Турниры по настольному теннису",
  applicationName: "SpinCoach",
  manifest: "/manifest.webmanifest",
  // iOS "Add to Home Screen": label + standalone status bar. The home-screen
  // icon comes from app/apple-icon.png (auto-detected); browser tab from app/icon.png.
  appleWebApp: {
    capable: true,
    title: "SpinCoach",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#09091a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
