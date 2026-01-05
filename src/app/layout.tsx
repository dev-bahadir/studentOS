import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader"; // <--- NEU: Der Ladebalken
import "./globals.css";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider"; 
// Sidebar wurde hier ENTFERNT (kommt in (app)/layout.tsx)

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ElectroBrain OS",
  description: "Dein Second Brain",
  manifest: "/manifest.json",
  // Das hier ist wichtig für iOS Icons:
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-512x512.png", // iOS nimmt sich das hochauflösende
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ElectroBrain",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>
        {/* Der Loader muss ganz nach oben, damit er immer sichtbar ist */}
        <NextTopLoader 
          color="#06b6d4" // Dein Cyan-Ton
          height={3} 
          showSpinner={false} 
          shadow="0 0 10px #06b6d4,0 0 5px #06b6d4"
        />

        <AuthProvider>
          <ThemeProvider>
            {/* Hier ist KEINE Sidebar mehr und kein Padding. 
                Das erlaubt dem Login-Screen, den ganzen Platz zu nutzen. */}
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
