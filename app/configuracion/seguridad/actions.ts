"use server";

import { createClient } from "@/lib/supabase/server";

interface ChangePinResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action to change user PIN/password
 * 
 * This updates the user's password in Supabase Auth.
 * The "PIN" is actually the password used for authentication.
 */
export async function changePin(formData: FormData): Promise<ChangePinResult> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "No autenticado" };
  }

  const currentPin = formData.get("currentPin") as string;
  const newPin = formData.get("newPin") as string;

  // Validate inputs
  if (!currentPin || !newPin) {
    return { success: false, error: "Todos los campos son requeridos" };
  }

  if (newPin.length < 4) {
    return { success: false, error: "El PIN debe tener al menos 4 dígitos" };
  }

  if (!/^\d+$/.test(newPin)) {
    return { success: false, error: "El PIN solo puede contener números" };
  }

  // First, verify the current PIN by attempting to sign in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email || "",
    password: currentPin,
  });

  if (verifyError) {
    return { success: false, error: "El PIN actual es incorrecto" };
  }

  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPin
  });

  if (updateError) {
    console.error("Error updating PIN:", updateError);
    return { success: false, error: "Error al actualizar el PIN" };
  }

  return { success: true };
}
