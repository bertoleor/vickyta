import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  Settings, 
  User,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  ChevronRight,
  LogOut
} from "lucide-react";
import { getCurrentUser, signOut } from "@/lib/auth/actions";

interface SettingItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  href?: string;
}

const settingsGroups = [
  {
    title: "Cuenta",
    items: [
      { icon: User, label: "Perfil", description: "Nombre, avatar, email", href: "/configuracion/perfil" },
      { icon: Shield, label: "Seguridad", description: "PIN, autenticación", href: "/configuracion/seguridad" },
    ]
  },
  {
    title: "Preferencias",
    items: [
      { icon: Bell, label: "Notificaciones", description: "Alertas y recordatorios", href: "/configuracion/notificaciones" },
      { icon: Palette, label: "Apariencia", description: "Tema y colores", href: "/configuracion/apariencia" },
    ]
  },
  {
    title: "Ayuda",
    items: [
      { icon: HelpCircle, label: "Ayuda y Soporte", description: "Preguntas frecuentes", href: "/configuracion/ayuda" },
    ]
  }
];

/**
 * Configuración Page - Server Component
 * Connected to real user data
 */
export default async function ConfiguracionPage() {
  // Get current user
  const user = await getCurrentUser();
  const displayName = user?.displayName || "Usuario";
  const email = user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="font-delicate text-2xl font-semibold text-text-primary">
          Configuración
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Personaliza tu experiencia
        </p>
      </div>

      {/* User Card */}
      <GlassCard variant="elevated">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center shadow-glass">
            <span className="text-2xl font-semibold text-white">{initial}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text-primary">{displayName}</h2>
            <p className="text-sm text-text-muted">{email}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-text-muted" />
        </div>
      </GlassCard>

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <GlassCard key={group.title} variant="default">
          <GlassCardHeader>
            <GlassCardTitle className="text-sm text-text-secondary font-medium">
              {group.title}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="p-2 rounded-xl bg-primary-100">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-muted">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-text-muted" />
                </button>
              );
            })}
          </GlassCardContent>
        </GlassCard>
      ))}

      {/* Logout */}
      <form action={signOut}>
        <Button 
          type="submit" 
          variant="ghost" 
          className="w-full text-accent-600 hover:bg-accent-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </form>

      {/* Version */}
      <p className="text-center text-xs text-text-muted">
        Versión 1.0.0 • Aurora Pastel
      </p>
    </div>
  );
}
