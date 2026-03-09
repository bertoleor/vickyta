"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Building2,
  Wallet,
  History,
  Settings,
  LogOut,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, getCurrentUser } from "@/lib/auth/actions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navItems: NavItem[] = [
  {
    label: "Principal",
    href: "/",
    icon: LayoutDashboard,
    description: "Resumen y saldo",
  },
  {
    label: "Manejo de Gastos",
    href: "/gastos",
    icon: CreditCard,
    description: "Categorizar y gestionar",
  },
  {
    label: "Banco",
    href: "/banco",
    icon: Building2,
    description: "Vencimientos e intereses",
  },
  {
    label: "Ingresos",
    href: "/ingresos",
    icon: Wallet,
    description: "Cargar ingresos por trabajo",
  },
  {
    label: "Historial",
    href: "/historial",
    icon: History,
    description: "Movimientos anteriores",
  },
  {
    label: "Presupuestos",
    href: "/presupuestos",
    icon: Wallet,
    description: "Control de gastos",
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: Settings,
    description: "Preferencias",
  },
];

/**
 * Sidebar Component - Collapsible drawer
 * Aurora Pastel Color Palette
 * 
 * Features:
 * - Hidden by default
 * - Slides in from left on toggle
 * - User profile with display name
 * - Functional logout button
 */
export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ displayName: string } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch user info on mount
  useEffect(() => {
    async function fetchUser() {
      const userData = await getCurrentUser();
      setUser(userData);
    }
    fetchUser();
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    // signOut will redirect to /login
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      {/* Toggle Button - Fixed top left */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-white border border-neutral-100 shadow-soft hover:bg-neutral-50 transition-all duration-200"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 text-text-primary" />
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/10 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72",
          "bg-white",
          "border-r border-neutral-100",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with close button */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-neutral-100">
            <h1 className="text-lg font-bold text-text-primary">
              Menu
            </h1>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Cerrar menu"
            >
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-primary text-white shadow-soft"
                      : "text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p>{item.label}</p>
                    {item.description && !isActive && (
                      <p className="text-xs text-text-tertiary mt-0.5 font-medium">{item.description}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-neutral-100 p-4">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-neutral-50">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {user ? getInitials(user.displayName) : "V"}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-text-primary">
                  {user?.displayName || "Vickyta"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-danger/10 hover:text-danger transition-all duration-200 disabled:opacity-50"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
