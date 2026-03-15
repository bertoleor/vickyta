"use client";

import { useState } from "react";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { login } from "@/lib/auth/actions";
import { toast, Toaster } from "sonner";
import { WelcomeScreen } from "@/components/ui/WelcomeScreen";
import { useRouter } from "next/navigation";

/**
 * Login Page - Minimalist Design
 * Slate + Emerald color palette
 * Connected to Supabase Auth with user mapping
 */
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: any) => {
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
    router.push("/");
  };

  if (showWelcome) {
    return (
      <WelcomeScreen
        message="Bienvenida Vicky"
        onComplete={handleWelcomeComplete}
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
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
        }}
      />
      
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-text-secondary mt-2 font-medium">
              Tu asistente financiero personal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-text-primary mb-1.5 ml-1">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 text-base bg-background-secondary rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  id="username"
                />
              </div>
            </div>

            {/* PIN Field */}
            <div>
              <label htmlFor="pin" className="block text-sm font-bold text-text-primary mb-1.5 ml-1">
                PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                <input
                  type="password"
                  placeholder="······"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replaceAll(/\D/g, "").slice(0, 6))}
                  className="w-full h-12 pl-12 pr-4 text-lg bg-background-secondary rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none tracking-widest"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="pin"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 mt-4 text-base font-bold"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Entrar
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-text-tertiary mt-12 font-medium">
            Finance PWA v1.8 • Ornellita Experience
          </p>
        </div>
      </div>
    </>
  );
}
