import { supabase } from './supabaseClient'
import { computeProfit } from './utils'
import type { Vehicle, VehicleProfit } from './types'

// ── Vehicles ──────────────────────────────────────────────────────

export async function getVehicles(): Promise<VehicleProfit[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('attivo', true)
    .order('marca')

  if (error) {
    console.error('[getVehicles]', error.message)
    return []
  }

  return ((data ?? []) as Vehicle[]).map(computeProfit)
}

export async function getVehicleById(id: string): Promise<VehicleProfit | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getVehicleById]', error.message)
    return null
  }

  return computeProfit(data as Vehicle)
}

export async function createVehicle(payload: Omit<Vehicle, 'id' | 'created_at'>): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateVehicle(id: string, payload: Partial<Vehicle>): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .update(payload)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .update({ attivo: false })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ── Auth helpers ──────────────────────────────────────────────────

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

// ── Documents (Signed URLs) ───────────────────────────────────────

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) return null
  return data.signedUrl
}

export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(error.message)
  return path
}
