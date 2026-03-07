"use client";

import { useState } from "react";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { login } from "@/lib/auth/actions";
import { toast, Toaster } from "sonner";
import { WelcomeScreen } from "@/components/ui/WelcomeScreen";

/**
 * Login Page - Minimalist Design
 * Slate + Emerald color palette
 * Connected to Supabase Auth with user mapping
 */
export default function LoginPage() {
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
    globalThis.location.href = "/";
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
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
        }}
      />
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-100">
              Iniciar Sesion
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Ingresa tus credenciales
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  id="username"
                />
              </div>
            </div>

            {/* PIN Field */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-slate-300 mb-1.5">
                PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="PIN de 6 digitos"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replaceAll(/\D/g, "").slice(0, 6))}
                  className="w-full h-11 pl-10 pr-3 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all tracking-widest"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="pin"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Ingresa tu PIN de 6 digitos
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Iniciar Sesion
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-8">
            Finance PWA v1.0
          </p>
        </div>
      </div>
    </>
  );
}
