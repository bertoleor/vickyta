"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action to update user profile
 * 
 * Updates display name in Supabase Auth user metadata.
 * This is the standard approach for storing additional user data
 * without requiring a separate users table.
 */
export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "No autenticado" };
  }

  const displayName = formData.get("displayName") as string;

  if (!displayName || displayName.trim().length < 2) {
    return { success: false, error: "El nombre debe tener al menos 2 caracteres" };
  }

  // Update user metadata in Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      display_name: displayName.trim()
    }
  });

  if (updateError) {
    console.error("Error updating profile:", updateError);
    return { success: false, error: "Error al actualizar el perfil" };
  }

  // Revalidate the profile page and any pages that show the user name
  revalidatePath("/configuracion/perfil");
  revalidatePath("/configuracion");
  revalidatePath("/");

  return { success: true };
}

/**
 * Server Action to upload user avatar
 * Uploads image to Supabase Storage and updates user metadata
 */
export async function uploadAvatar(formData: FormData): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "No autenticado" };
  }

  const avatarFile = formData.get("avatar") as File;

  if (!avatarFile || avatarFile.size === 0) {
    return { success: false, error: "No se ha seleccionado ninguna imagen" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(avatarFile.type)) {
    return { success: false, error: "Tipo de archivo no válido. Solo se permiten JPG, PNG, GIF o WebP" };
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (avatarFile.size > maxSize) {
    return { success: false, error: "La imagen no puede superar los 2MB" };
  }

  try {
    // Generate unique filename
    const fileExtension = avatarFile.name.split(".").pop();
    const fileName = `${user.id}/avatar.${fileExtension}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await avatarFile.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: avatarFile.type });

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, blob, {
        upsert: true,
        contentType: avatarFile.type
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return { success: false, error: "Error al subir la imagen" };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Update user metadata with avatar URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl
      }
    });

    if (updateError) {
      console.error("Error updating avatar URL:", updateError);
      return { success: false, error: "Error al guardar la foto de perfil" };
    }

    // Revalidate pages
    revalidatePath("/configuracion/perfil");
    revalidatePath("/configuracion");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    console.error("Unexpected error uploading avatar:", err);
    return { success: false, error: "Error inesperado al subir la imagen" };
  }
}
