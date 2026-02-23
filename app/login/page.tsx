"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, PINInput } from "@/components/ui/Input";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { WelcomeScreen } from "@/components/ui/WelcomeScreen";
import { login } from "@/lib/auth/actions";
import { toast, Toaster } from "sonner";

/**
 * Login Page - iOS-style authentication
 * Aurora Pastel Color Palette
 * Connected to Supabase Auth
 */
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("pin", pin);

    const result = await login(formData);

    setIsLoading(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    // Show welcome screen on successful login
    setShowWelcome(true);
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    // Use window.location for a full page navigation to ensure middleware picks up the session
    window.location.href = "/";
  };

  if (showWelcome) {
    return (
      <WelcomeScreen
        message="Bienvenida Vicky"
        onComplete={handleWelcomeComplete}
        typingSpeed={80}
        delay={500}
      />
    );
  }

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(30, 41, 59, 0.9)',
            color: '#f8fafc',
            border: '1px solid rgba(200, 182, 226, 0.3)',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
      
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard variant="elevated" noHover className="w-full max-w-md relative">
          <GlassCardHeader className="text-center flex-col">
            {/* Avatar */}
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center shadow-glass">
              <User className="h-8 w-8 text-white" />
            </div>
            <GlassCardTitle className="text-2xl">Iniciar Sesion</GlassCardTitle>
            <p className="text-text-secondary text-sm mt-2">
              Ingresa tus credenciales para continuar
            </p>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <Input
                label="Usuario"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<User className="h-5 w-5" />}
                variant="glass"
                required
                disabled={isLoading}
                autoComplete="username"
              />

              {/* PIN Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  PIN
                </label>
                <PINInput
                  placeholder="• • • •"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  icon={<Lock className="h-5 w-5" />}
                  variant="glass"
                  length={6}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <p className="mt-1 text-xs text-text-muted">
                  Ingresa tu PIN de 4 a 6 digitos
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Iniciar Sesion
              </Button>
            </form>
          </GlassCardContent>
        </GlassCard>
      </div>
    </>
  );
}
