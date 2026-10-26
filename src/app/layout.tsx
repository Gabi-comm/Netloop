import type { Metadata, Viewport } from "next";
import { Gochi_Hand, Patrick_Hand } from "next/font/google";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const gochi = Gochi_Hand({ weight: "400", subsets: ["latin"], variable: "--font-gochi", display: "swap" });
const patrick = Patrick_Hand({ weight: "400", subsets: ["latin"], variable: "--font-patrick", display: "swap" });

export const metadata: Metadata = {
  title: "Netloop",
  description: "Draw a loop. Drop the bad packets.",
  applicationName: "Netloop",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/sprites/svg/bit_idle_0.svg", type: "image/svg+xml" }],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Netloop", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#121212",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${gochi.variable} ${patrick.variable}`}>
      <body>
        {children}
        <ServiceWorker />
        <InstallPrompt />
      </body>
    </html>
  );
}
