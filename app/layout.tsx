import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

// Inter font - Primary typography for iOS look
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finanzas PWA - Control de Gastos",
  description: "Aplicación de finanzas personales para gestión de gastos",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
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
    <html lang="es" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased text-text-primary">
        <div className="relative flex min-h-screen w-full bg-background">
          {/* Sidebar - Hidden by default, toggles via hamburger menu */}
          <Sidebar />
          
          {/* Main Content Area */}
          <main className="flex-1 p-4 pt-20 md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
