import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { 
  Shield,
  Key,
  ArrowLeft,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { ChangePinForm } from "./ChangePinForm";

/**
 * Security Settings Page - Server Component
 * 
 * Allows user to:
 * - Change PIN/password
 * - View security information
 */
export default async function SeguridadPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pt-4 pb-2">
        <Link 
          href="/configuracion"
          className="p-2 rounded-xl hover:bg-primary-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="font-delicate text-2xl font-semibold text-text-primary">
            Seguridad
          </h1>
          <p className="text-text-secondary text-sm">
            Gestiona tu PIN y autenticación
          </p>
        </div>
      </div>

      {/* Change PIN */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary-600" />
            Cambiar PIN
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <ChangePinForm />
        </GlassCardContent>
      </GlassCard>

      {/* Security Info */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            Información de Seguridad
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Autenticación</p>
                <p className="text-xs text-text-muted">PIN de 4 dígitos</p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">Activo</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100">
                <Smartphone className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Sesiones</p>
                <p className="text-xs text-text-muted">Dispositivos conectados</p>
              </div>
            </div>
            <span className="text-xs text-text-muted">1 activo</span>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Tips */}
      <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">Consejo:</strong> Usa un PIN que sea fácil de recordar pero difícil de adivinar. Evita secuencias como 1234 o tu fecha de nacimiento.
        </p>
      </div>
    </div>
  );
}
