export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_profiles: {
        Row: {
          additional_notes: string | null
          address: string | null
          assets: string | null
          brand_guidelines: string | null
          brand_voice: string | null
          business_goals: string | null
          business_name: string
          competitors: string | null
          created_at: string
          description: string | null
          email: string | null
          hours: string | null
          id: string
          industry: string | null
          phone: string | null
          products_services: string | null
          service_areas: string[]
          social_media_urls: string | null
          status: string
          tagline: string | null
          target_audience: string | null
          target_platforms: string[]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          additional_notes?: string | null
          address?: string | null
          assets?: string | null
          brand_guidelines?: string | null
          brand_voice?: string | null
          business_goals?: string | null
          business_name: string
          competitors?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          products_services?: string | null
          service_areas?: string[]
          social_media_urls?: string | null
          status?: string
          tagline?: string | null
          target_audience?: string | null
          target_platforms?: string[]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          additional_notes?: string | null
          address?: string | null
          assets?: string | null
          brand_guidelines?: string | null
          brand_voice?: string | null
          business_goals?: string | null
          business_name?: string
          competitors?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          products_services?: string | null
          service_areas?: string[]
          social_media_urls?: string | null
          status?: string
          tagline?: string | null
          target_audience?: string | null
          target_platforms?: string[]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: { created_at: string; email: string | null; full_name: string | null; id: string; role: string }
        Insert: { created_at?: string; email?: string | null; full_name?: string | null; id: string; role?: string }
        Update: { created_at?: string; email?: string | null; full_name?: string | null; id?: string; role?: string }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          buffer_post_id: string | null
          caption: string | null
          created_at: string
          error: string | null
          id: string
          platform: string
          publish_id: string | null
          published_at: string | null
          scheduled_time: string | null
          status: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          buffer_post_id?: string | null
          caption?: string | null
          created_at?: string
          error?: string | null
          id?: string
          platform?: string
          publish_id?: string | null
          published_at?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          buffer_post_id?: string | null
          caption?: string | null
          created_at?: string
          error?: string | null
          id?: string
          platform?: string
          publish_id?: string | null
          published_at?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
