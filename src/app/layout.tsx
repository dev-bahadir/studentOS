import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader"; 
import "./globals.css";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider"; 

const inter = Inter({ subsets: ["latin"] });

// 1. Metadata für SEO und PWA
export const metadata: Metadata = {
  title: "ElectroBrain OS",
  description: "Dein Second Brain",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-512x512.png", 
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ElectroBrain",
  },
};

// 2. Viewport für das mobile Erlebnis
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
  themeColor: "#09090b", // Angepasst an dein dunkles Zinc-Design
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300`}>
        {/* Der Loader zeigt einen Fortschrittsbalken beim Navigieren zwischen Seiten */}
        <NextTopLoader 
          color="#06b6d4" 
          height={3} 
          showSpinner={false} 
          shadow="0 0 10px #06b6d4,0 0 5px #06b6d4"
          easing="ease"
          speed={200}
        />

        <AuthProvider>
          <ThemeProvider>
            {/* In diesem Root-Layout gibt es kein Padding und keine Sidebar.
              Das ermöglicht es Login- und Registrierungsseiten, 100% der Fläche zu nutzen.
              Die Sidebar wird erst im (app)/layout.tsx für geschützte Bereiche hinzugefügt.
            */}
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}