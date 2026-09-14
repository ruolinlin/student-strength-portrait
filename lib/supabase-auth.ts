'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseAuth = url && key ? createClient(url, key, { auth: { persistSession: true, detectSessionInUrl: true } }) : null;

export async function currentUserId() {
  const { data } = await supabaseAuth?.auth.getUser() ?? { data: { user: null } };
  return data.user?.id ?? null;
}

export async function sendMagicLink(email: string) {
  if (!supabaseAuth) throw new Error('Supabase is not configured.');
  const invite = window.location.hash.slice(1);
  const redirect = `${window.location.origin}${window.location.pathname}${invite ? `?invite=${encodeURIComponent(invite)}` : ''}`;
  const { error } = await supabaseAuth.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
  if (error) throw error;
}
