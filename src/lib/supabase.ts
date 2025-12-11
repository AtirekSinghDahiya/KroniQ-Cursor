/**
 * Supabase Compatibility Export
 * Re-exports from supabaseClient for backwards compatibility
 */

export { supabase, setSupabaseUserContext } from './supabaseClient';
export type { Project, Message, MessageAttachment } from './supabaseClient';

// Re-export Database types for compatibility
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
          plan: string | null;
          stripe_customer_id: string | null;
          tokens_balance: number | null;
        };
      };
    };
  };
};