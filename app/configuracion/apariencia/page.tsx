import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { 
  Palette,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { ThemeSelector } from "./ThemeSelector";
import { AccentColorSelector } from "./AccentColorSelector";

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
          className="p-2 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
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
            <Palette className="h-5 w-5 text-primary" />
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
            <Sparkles className="h-5 w-5 text-primary" />
            Color de Acento
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <AccentColorSelector />
        </GlassCardContent>
      </GlassCard>

      {/* Info */}
      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
        <p className="text-sm text-text-secondary font-medium">
          Los cambios de tema y color se aplican inmediatamente.
        </p>
      </div>
    </div>
  );
}
