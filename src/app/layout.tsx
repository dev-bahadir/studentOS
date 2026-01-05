import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider"; 
import { Sidebar } from "@/components/Navigation"; // <--- WICHTIG: Hier die richtige Sidebar importieren!

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ElectroBrain OS",
  description: "Dein Second Brain",
  manifest: "/manifest.json", 
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
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen bg-canvas text-ink">
              
              {/* Hier binden wir die Navigation ein (die technisch die Sidebar ist) */}
              <Sidebar /> 

              <main className="w-full lg:pl-64 pt-20 lg:pt-4 px-2 pb-24">
                {children}
              </main>

            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
