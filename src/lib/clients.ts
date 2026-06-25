import { supabase } from './supabase'
import type { Database } from '../types/database.types'

export type BusinessProfile = Database['public']['Tables']['business_profiles']['Row']
export type BusinessProfileInsert = Database['public']['Tables']['business_profiles']['Insert']
export type BusinessProfileUpdate = Database['public']['Tables']['business_profiles']['Update']

export async function listProfiles(): Promise<BusinessProfile[]> {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getProfile(id: string): Promise<BusinessProfile> {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createProfile(input: BusinessProfileInsert): Promise<BusinessProfile> {
  const { data, error } = await supabase
    .from('business_profiles')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(id: string, patch: BusinessProfileUpdate): Promise<BusinessProfile> {
  const { data, error } = await supabase
    .from('business_profiles')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
