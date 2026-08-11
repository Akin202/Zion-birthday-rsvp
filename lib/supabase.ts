/// <reference types="vite/client" />

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. " +
    "Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
