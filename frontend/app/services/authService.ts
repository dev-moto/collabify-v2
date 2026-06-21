import { supabase } from "~/lib/supabase";

export function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email) ? "" : "Enter a valid email address.";
}

export function validatePassword(password: string) {
  return password.length >= 8 ? "" : "Password must be at least 8 characters.";
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, string>) {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/verify-email`,
      data: metadata,
    },
  });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
}

export async function resendVerificationEmail(email: string) {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${window.location.origin}/verify-email` },
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
