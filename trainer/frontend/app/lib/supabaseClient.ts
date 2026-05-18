import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Used only for OAuth flows (Google sign-in).
// All regular auth goes through the Express backend.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
