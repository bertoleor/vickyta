import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Supabase client for client-side and server-side operations
 * Uses the anonymous key for public operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper function to transform username to email format for Supabase Auth
 * @param username - The username entered by the user
 * @returns Email in format: username@app.local
 */
export function usernameToEmail(username: string): string {
  const sanitizedUsername = username.toLowerCase().trim();
  return `${sanitizedUsername}@app.local`;
}
