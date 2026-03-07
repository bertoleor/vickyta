import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { 
  Palette,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { ThemeSelector } from "./ThemeSelector";

/**
 * Appearance Settings Page - Server Component
 * 
 * Allows user to configure:
 * - Theme (light/dark/system)
 * - Accent color
 * - Font preferences
 */
export default async function AparienciaPage() {
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
            Apariencia
          </h1>
          <p className="text-text-secondary text-sm">
            Personaliza el tema y colores
          </p>
        </div>
      </div>

      {/* Theme Selection */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary-600" />
            Tema
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <ThemeSelector />
        </GlassCardContent>
      </GlassCard>

      {/* Accent Color */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            Color de Acento
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <AccentColorSelector />
        </GlassCardContent>
      </GlassCard>

      {/* Preview */}
      <GlassCard variant="elevated">
        <GlassCardHeader>
          <GlassCardTitle>Vista Previa</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400" />
              <div className="flex-1">
                <div className="h-3 w-24 bg-primary-200 rounded-full mb-1" />
                <div className="h-2 w-16 bg-primary-100 rounded-full" />
              </div>
            </div>
            <div className="h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <span className="text-sm text-text-secondary">Tarjeta de ejemplo</span>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-full bg-gradient-to-r from-primary-400 to-primary-500" />
              <div className="h-8 w-20 rounded-full border-2 border-primary-300" />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Info */}
      <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
        <p className="text-sm text-text-secondary">
          Los cambios de tema se aplican inmediatamente. El tema oscuro está en desarrollo y algunas secciones pueden no estar completamente adaptadas.
        </p>
      </div>
    </div>
  );
}

/**
 * Accent Color Selector Component
 */
function AccentColorSelector() {
  const colors = [
    { name: "Lavanda", value: "lavanda", color: "bg-primary-400" },
    { name: "Rosa", value: "rosa", color: "bg-accent-400" },
    { name: "Cian", value: "cian", color: "bg-cyan-400" },
    { name: "Menta", value: "menta", color: "bg-emerald-400" },
    { name: "Melocotón", value: "melocoton", color: "bg-orange-300" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => (
        <button
          key={color.value}
          className={`h-10 w-10 rounded-full ${color.color} transition-transform hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:ring-primary-400`}
          aria-label={`Seleccionar color ${color.name}`}
          title={color.name}
        />
      ))}
    </div>
  );
}
