export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          company_name: string | null
          phone: string | null
          instagram_handle: string | null
          roles: string[] | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          company_name?: string | null
          phone?: string | null
          instagram_handle?: string | null
          roles?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          company_name?: string | null
          phone?: string | null
          instagram_handle?: string | null
          roles?: string[] | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          event_name: string
          start_date: string
          end_date: string
          venue_name: string | null
          address: string | null
          venue_phone: string | null
          owner_id: string
          group_code: string
          is_archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_name: string
          start_date: string
          end_date: string
          venue_name?: string | null
          address?: string | null
          venue_phone?: string | null
          owner_id: string
          group_code: string
          is_archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_name?: string
          start_date?: string
          end_date?: string
          venue_name?: string | null
          address?: string | null
          venue_phone?: string | null
          owner_id?: string
          group_code?: string
          is_archived?: boolean
          created_at?: string
        }
      }
      vendor_categories: {
        Row: {
          id: string
          event_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          created_at?: string
        }
      }
      event_memberships: {
        Row: {
          user_id: string
          event_id: string
          categories: string[]
          created_at: string
        }
        Insert: {
          user_id: string
          event_id: string
          categories: string[]
          created_at?: string
        }
        Update: {
          user_id?: string
          event_id?: string
          categories?: string[]
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          event_id: string
          parent_id: string | null
          author_id: string
          body: string
          created_at: string
          reactions: Json
        }
        Insert: {
          id?: string
          event_id: string
          parent_id?: string | null
          author_id: string
          body: string
          created_at?: string
          reactions?: Json
        }
        Update: {
          id?: string
          event_id?: string
          parent_id?: string | null
          author_id?: string
          body?: string
          created_at?: string
          reactions?: Json
        }
      }
      mentions: {
        Row: {
          message_id: string
          mentioned_user_id: string
        }
        Insert: {
          message_id: string
          mentioned_user_id: string
        }
        Update: {
          message_id?: string
          mentioned_user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}