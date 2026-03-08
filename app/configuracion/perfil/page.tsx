import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard"; 
import { 
  User,
  Mail,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/actions";
import { UpdateProfileForm } from "./UpdateProfileForm";
import { AvatarSection } from "./AvatarSection";

/**
 * Profile Settings Page - Server Component
 * 
 * Allows user to update:
 * - Display name
 * - Avatar (image upload to Supabase Storage)
 * - Email display (read-only, managed by Supabase Auth)
 */
export default async function PerfilPage() {
  const user = await getCurrentUser();
  const displayName = user?.displayName || "Usuario";
  const email = user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  // Get avatar URL from user metadata if available
  // Note: We need to get it from the actual user session, not the cached displayName
  const supabase = await import('@/lib/supabase/server').then(m => m.createClient());
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const avatarUrl = authUser?.user_metadata?.avatar_url as string | undefined;

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
            Perfil
          </h1>
          <p className="text-text-secondary text-sm">
            Tu información personal
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <AvatarSection avatarUrl={avatarUrl} displayName={displayName} initial={initial} />

      {/* Profile Form */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Información Personal
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <UpdateProfileForm displayName={displayName} email={email} />
        </GlassCardContent>
      </GlassCard>

      {/* Account Info */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Cuenta
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary">Email</p>
            <p className="text-text-primary font-medium">{email}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Proveedor</p>
            <p className="text-text-primary font-medium">Email / Contraseña</p>
          </div>
          <p className="text-xs text-text-muted">
            El email se gestiona a través de la configuración de seguridad.
          </p>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
