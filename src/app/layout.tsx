import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "../components/providers/AuthProvider";
import { ThemeProvider } from "../components/providers/ThemeProvider"; 
import Navigation from "../components/Navigation"; 

// ... restlicher Code ...

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ElectroBrain OS",
  description: "Dein Second Brain",
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
            <div className="flex min-h-screen bg-canvas text-ink transition-colors duration-500">
              <Navigation />
              <main className="flex-1 w-full md:ml-64 pb-24 md:pb-8">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}