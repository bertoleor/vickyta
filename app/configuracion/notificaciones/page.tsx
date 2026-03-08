import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { 
  Bell,
  ArrowLeft,
  MessageSquare,
  Calendar,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { NotificationSettings } from "./NotificationSettings";

/**
 * Notifications Settings Page - Server Component
 * 
 * Allows user to configure:
 * - Telegram notifications
 * - Budget alerts
 * - Reminder notifications
 */
export default async function NotificacionesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pt-4 pb-2">
        <Link 
          href="/configuracion"
          className="p-2 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Notificaciones
          </h1>
          <p className="text-text-secondary text-sm">
            Configura alertas y recordatorios
          </p>
        </div>
      </div>

      {/* Telegram Integration */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Telegram Bot
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <NotificationSettings />
        </GlassCardContent>
      </GlassCard>

      {/* Alert Types */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Tipos de Alertas
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <AlertToggle 
            icon={Calendar}
            title="Recordatorios de gastos"
            description="Recordatorio diario para registrar gastos"
            defaultChecked={true}
          />
          <AlertToggle 
            icon={TrendingUp}
            title="Límite de presupuesto"
            description="Alerta cuando superas el 80% del presupuesto"
            defaultChecked={true}
          />
          <AlertToggle 
            icon={AlertCircle}
            title="Gastos inusuales"
            description="Detecta gastos mayores al promedio"
            defaultChecked={false}
          />
        </GlassCardContent>
      </GlassCard>

      {/* Info */}
      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
        <p className="text-sm text-text-secondary">
          Las notificaciones se envían a través del bot de Telegram. Asegúrate de haber iniciado una conversación con el bot para recibir mensajes.
        </p>
      </div>
    </div>
  );
}

interface AlertToggleProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  defaultChecked: boolean;
}

function AlertToggle({ icon: Icon, title, description, defaultChecked }: Readonly<AlertToggleProps>) {
  const toggleId = `toggle-${title.toLowerCase().replaceAll(/\s/g, '-')}`;
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background-secondary">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{title}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer" htmlFor={toggleId}>
        <span className="sr-only">{title}</span>
        <input 
          type="checkbox" 
          id={toggleId}
          className="sr-only peer" 
          defaultChecked={defaultChecked}
        />
        <div className="w-11 h-6 bg-border-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}
