import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          login_id: string;
          password: string;
          name: string;
          school_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          login_id: string;
          password: string;
          name: string;
          school_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          login_id?: string;
          password?: string;
          name?: string;
          school_id?: string;
          created_at?: string;
        };
      };
      class_sections: {
        Row: {
          id: string;
          school_id: string;
          class_name: string;
          sheet_link: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          class_name: string;
          sheet_link: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          class_name?: string;
          sheet_link?: string;
          created_at?: string;
        };
      };
    };
  };
};