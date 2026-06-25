export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' }
  public: {
    Tables: {
      buffer_logs: {
        Row: { created_at: string; endpoint: string; error_message: string | null; id: string; request_payload: Json | null; response_payload: Json | null; status_code: number | null }
        Insert: { created_at?: string; endpoint: string; error_message?: string | null; id?: string; request_payload?: Json | null; response_payload?: Json | null; status_code?: number | null }
        Update: { created_at?: string; endpoint?: string; error_message?: string | null; id?: string; request_payload?: Json | null; response_payload?: Json | null; status_code?: number | null }
        Relationships: []
      }
      linkedin_accounts: {
        Row: { access_token: string; created_at: string; display_name: string | null; email: string | null; expires_at: string | null; id: string; person_urn: string; refresh_token: string | null }
        Insert: { access_token: string; created_at?: string; display_name?: string | null; email?: string | null; expires_at?: string | null; id?: string; person_urn: string; refresh_token?: string | null }
        Update: { access_token?: string; created_at?: string; display_name?: string | null; email?: string | null; expires_at?: string | null; id?: string; person_urn?: string; refresh_token?: string | null }
        Relationships: []
      }
      linkedin_logs: {
        Row: { created_at: string; endpoint: string; error_message: string | null; id: string; request_payload: Json | null; response_payload: Json | null; status_code: number | null }
        Insert: { created_at?: string; endpoint: string; error_message?: string | null; id?: string; request_payload?: Json | null; response_payload?: Json | null; status_code?: number | null }
        Update: { created_at?: string; endpoint?: string; error_message?: string | null; id?: string; request_payload?: Json | null; response_payload?: Json | null; status_code?: number | null }
        Relationships: []
      }
      linkedin_posts: {
        Row: { caption: string; created_at: string; error: string | null; id: string; post_id: string | null; published_at: string | null; status: string }
        Insert: { caption: string; created_at?: string; error?: string | null; id?: string; post_id?: string | null; published_at?: string | null; status?: string }
        Update: { caption?: string; created_at?: string; error?: string | null; id?: string; post_id?: string | null; published_at?: string | null; status?: string }
        Relationships: []
      }
      publer_accounts: {
        Row: { access_token: string | null; account_name: string | null; created_at: string; id: string; provider: string | null; publer_account_id: string | null; refresh_token: string | null; workspace_id: string | null }
        Insert: { access_token?: string | null; account_name?: string | null; created_at?: string; id?: string; provider?: string | null; publer_account_id?: string | null; refresh_token?: string | null; workspace_id?: string | null }
        Update: { access_token?: string | null; account_name?: string | null; created_at?: string; id?: string; provider?: string | null; publer_account_id?: string | null; refresh_token?: string | null; workspace_id?: string | null }
        Relationships: []
      }
      publer_logs: {
        Row: { created_at: string; endpoint: string; error_message: string | null; id: string; request_payload: Json | null; response_payload: Json | null; status_code: number | null }
        Insert: { created_at?: string; endpoint: string; error_message?: string | null; id?: string; request_payload?: Json | null; response_payload?: Json | null; status_code?: number | null }
        Update: { created_at?: string; endpoint?: string; error_message?: string | null; id?: string; request_payload?: Json | null; response_payload?: Json | null; status_code?: number | null }
        Relationships: []
      }
      publer_posts: {
        Row: { caption: string | null; created_at: string; id: string; publer_job_id: string | null; publer_media_id: string | null; publer_post_id: string | null; published_at: string | null; scheduled_time: string | null; status: string; video_url: string }
        Insert: { caption?: string | null; created_at?: string; id?: string; publer_job_id?: string | null; publer_media_id?: string | null; publer_post_id?: string | null; published_at?: string | null; scheduled_time?: string | null; status?: string; video_url: string }
        Update: { caption?: string | null; created_at?: string; id?: string; publer_job_id?: string | null; publer_media_id?: string | null; publer_post_id?: string | null; published_at?: string | null; scheduled_time?: string | null; status?: string; video_url?: string }
        Relationships: []
      }
      scheduled_posts: {
        Row: { buffer_post_id: string | null; caption: string | null; created_at: string; error: string | null; id: string; platform: string; publish_id: string | null; published_at: string | null; scheduled_time: string | null; status: string; updated_at: string; video_url: string | null }
        Insert: { buffer_post_id?: string | null; caption?: string | null; created_at?: string; error?: string | null; id?: string; platform?: string; publish_id?: string | null; published_at?: string | null; scheduled_time?: string | null; status?: string; updated_at?: string; video_url?: string | null }
        Update: { buffer_post_id?: string | null; caption?: string | null; created_at?: string; error?: string | null; id?: string; platform?: string; publish_id?: string | null; published_at?: string | null; scheduled_time?: string | null; status?: string; updated_at?: string; video_url?: string | null }
        Relationships: []
      }
      social_accounts: {
        Row: { access_token: string | null; account_id: string | null; account_name: string | null; buffer_channel_id: string | null; created_at: string; expires_at: string | null; id: string; open_id: string | null; platform: string; refresh_token: string | null; updated_at: string }
        Insert: { access_token?: string | null; account_id?: string | null; account_name?: string | null; buffer_channel_id?: string | null; created_at?: string; expires_at?: string | null; id?: string; open_id?: string | null; platform: string; refresh_token?: string | null; updated_at?: string }
        Update: { access_token?: string | null; account_id?: string | null; account_name?: string | null; buffer_channel_id?: string | null; created_at?: string; expires_at?: string | null; id?: string; open_id?: string | null; platform?: string; refresh_token?: string | null; updated_at?: string }
        Relationships: []
      }
      video_jobs: {
        Row: { created_at: string; id: string; status: string; updated_at: string; video_id: string; video_url: string | null }
        Insert: { created_at?: string; id?: string; status?: string; updated_at?: string; video_id: string; video_url?: string | null }
        Update: { created_at?: string; id?: string; status?: string; updated_at?: string; video_id?: string; video_url?: string | null }
        Relationships: []
      }
      youtube_accounts: {
        Row: { access_token: string | null; channel_handle: string | null; channel_id: string | null; channel_name: string | null; created_at: string | null; expires_at: string | null; id: string; refresh_token: string | null }
        Insert: { access_token?: string | null; channel_handle?: string | null; channel_id?: string | null; channel_name?: string | null; created_at?: string | null; expires_at?: string | null; id?: string; refresh_token?: string | null }
        Update: { access_token?: string | null; channel_handle?: string | null; channel_id?: string | null; channel_name?: string | null; created_at?: string | null; expires_at?: string | null; id?: string; refresh_token?: string | null }
        Relationships: []
      }
      youtube_logs: {
        Row: { created_at: string | null; endpoint: string | null; error_message: string | null; id: string; request_payload: Json | null; response_payload: Json | null; status_code: number | null }
        Insert: { created_at?: string | null; endpoint?: string | null; error_message?: string | null; id?: string; request_payload?: Json | null; response_payload?: Json | null; status_code?: number | null }
        Update: { created_at?: string | null; endpoint?: string | null; error_message?: string | null; id?: string; request_payload?: Json | null; response_payload?: Json | null; status_code?: number | null }
        Relationships: []
      }
      youtube_videos: {
        Row: { created_at: string | null; description: string | null; id: string; privacy: string | null; published_at: string | null; response_json: Json | null; status: string | null; title: string | null; video_id: string | null; video_url: string | null; youtube_url: string | null }
        Insert: { created_at?: string | null; description?: string | null; id?: string; privacy?: string | null; published_at?: string | null; response_json?: Json | null; status?: string | null; title?: string | null; video_id?: string | null; video_url?: string | null; youtube_url?: string | null }
        Update: { created_at?: string | null; description?: string | null; id?: string; privacy?: string | null; published_at?: string | null; response_json?: Json | null; status?: string | null; title?: string | null; video_id?: string | null; video_url?: string | null; youtube_url?: string | null }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
