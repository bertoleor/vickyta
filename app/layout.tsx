import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuroraBackground } from "@/components/ui/aurora-background";

// Garet font - Primary typography
const garet = localFont({
  src: [
    { path: "../public/fonts/garet/Garet-Book.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/garet/Garet-Heavy.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-garet",
  display: "swap",
  fallback: ["Inter", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Finanzas PWA - Control de Gastos",
  description: "Aplicacion de finanzas personales para gestion de gastos",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#D9C2EA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={garet.variable}>
      <body className="font-sans">
        <AuroraBackground className="h-auto min-h-screen">
          {/* Main Content */}
          <div className="relative z-10 flex min-h-screen w-full">
            {/* Sidebar - Hidden by default, toggles via hamburger menu */}
            <Sidebar />
            
            {/* Main Content Area */}
            <main className="flex-1 p-4 pt-20 md:p-8 md:pl-8">
              {children}
            </main>
          </div>
        </AuroraBackground>
      </body>
    </html>
  );
}
