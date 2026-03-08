"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/ui/GlassCard";
import { uploadAvatar } from "./actions";

interface AvatarSectionProps {
  readonly avatarUrl?: string;
  readonly displayName: string;
  readonly initial: string;
}

/**
 * Avatar Section with upload functionality
 * Client component to handle image upload
 */
export function AvatarSection({ avatarUrl, displayName, initial }: AvatarSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const result = await uploadAvatar(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Reload the page to show new avatar
        globalThis.location.reload();
      }
    } catch {
      setError("Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <GlassCard variant="elevated" className="text-center">
      <GlassCardContent className="pt-6">
        <div className="relative inline-block">
          {/* Avatar Image or Initial */}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`Avatar de ${displayName}`}
              className="h-24 w-24 rounded-full object-cover shadow-soft mx-auto"
              width={96}
              height={96}
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shadow-soft mx-auto">
              <span className="text-4xl font-bold text-white">{initial}</span>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleClick}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-white shadow-soft hover:bg-neutral-50 transition-colors disabled:opacity-50"
            aria-label="Cambiar avatar"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <Camera className="h-4 w-4 text-primary" />
            )}
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Subir imagen de perfil"
          />
        </div>

        {/* Status Messages */}
        <div className="mt-3">
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}
          {success && !error && (
            <p className="text-sm text-green-600">Foto actualizada correctamente</p>
          )}
          {!error && !success && (
            <p className="text-sm text-text-muted">
              Toca la cámara para cambiar tu foto
            </p>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
