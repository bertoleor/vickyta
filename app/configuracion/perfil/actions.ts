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
