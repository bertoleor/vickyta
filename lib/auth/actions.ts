'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { loginRateLimiter } from '@/lib/auth/rate-limit';

/**
 * User mapping configuration
 * Maps simple usernames to actual Supabase Auth emails
 */
const USER_MAP: Record<string, { email: string; displayName: string }> = {
  vickyta: {
    email: 'mvsierraortega@gmail.com',
    displayName: 'Vickyta',
  },
  vicky: {
    email: 'mvsierraortega@gmail.com',
    displayName: 'Vickyta',
  },
  mama: {
    email: 'mvsierraortega@gmail.com',
    displayName: 'Vickyta',
  },
};

/**
 * Login server action
 * 
 * Flow:
 * 1. Receive username and PIN from form
 * 2. Map username to actual email
 * 3. Sign in with Supabase Auth using email and PIN as password
 * 4. Redirect to dashboard on success
 * 
 * @param formData - Form data with 'username' and 'pin' fields
 * @returns Error message or redirects on success
 */
export async function login(formData: FormData): Promise<{ error?: string } | void> {
  // Extract form values
  const usernameEntry = formData.get('username');
  const pinEntry = formData.get('pin');
  const username = typeof usernameEntry === 'string' ? usernameEntry.toLowerCase().trim() : '';
  const pin = typeof pinEntry === 'string' ? pinEntry : '';

  // Validate inputs
  if (!username || !pin) {
    return { error: 'Por favor completa todos los campos' };
  }

  // Map username to email
  const userMapping = USER_MAP[username];
  
  if (!userMapping) {
    return { error: 'Credenciales incorrectas' };
  }

  // Rate limit: key by the mapped email so the three aliases share one
  // bucket; unknown usernames use their own bucket and cannot lock out the
  // real user. Check is fail-closed: a locked-out identity never reaches
  // Supabase Auth (t_cdb1bc45).
  const rateKey = userMapping.email;
  const decision = loginRateLimiter.check(rateKey);
  if (decision.blocked) {
    return { error: decision.message };
  }

  const supabase = await createClient();

  // Attempt to sign in with Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email: userMapping.email,
    password: pin,
  });

  if (error) {
    console.error('Login error:', error.message);
    loginRateLimiter.recordFailure(rateKey);
    
    // Generic error message for security
    return { error: 'Credenciales incorrectas' };
  }

  // Success — reset the counter, then redirect to dashboard
  loginRateLimiter.recordSuccess(rateKey);
  redirect('/');
}

/**
 * Sign out server action
 * Clears the session and redirects to login
 */
export async function signOut(_formData?: FormData): Promise<void> {
  const supabase = await createClient();
  
  await supabase.auth.signOut();
  
  redirect('/login');
}

/**
 * Get current user info for display
 * @returns User display name or null
 */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  displayName: string;
} | null> {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // First check user metadata for custom display name
    let displayName = user.user_metadata?.display_name;
    
    // If no custom name, find from the reverse mapping
    if (!displayName) {
      displayName = 'Usuario';
      
      for (const [, value] of Object.entries(USER_MAP)) {
        if (value.email === user.email) {
          displayName = value.displayName;
          break;
        }
      }
    }

    return {
      id: user.id,
      email: user.email || '',
      displayName,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns True if user has active session
 */
export async function isAuthenticated(): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}
