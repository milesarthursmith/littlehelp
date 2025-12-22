import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export type PasswordVault = {
  id: string
  user_id: string
  name: string
  encrypted_password: string
  iv: string
  salt: string
  created_at: string
}

export type ScheduledUnlock = {
  id: string
  vault_id: string
  user_id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string // HH:MM:SS format
  end_time: string
  enabled: boolean
  created_at: string
}

export type EmergencyAccessRequest = {
  id: string
  vault_id: string
  user_id: string
  requested_at: string
  unlock_at: string
  completed_at: string | null
  cancelled: boolean
  created_at: string
}

export type UserSubscription = {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: 'free' | 'premium'
  status: 'active' | 'cancelled' | 'past_due'
  current_period_end: string | null
  created_at: string
  updated_at: string
}

// Helper function to check if current time is within a scheduled unlock window
export function isWithinScheduledUnlock(schedules: ScheduledUnlock[]): boolean {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday
  const currentTime = now.toTimeString().slice(0, 8) // HH:MM:SS
  
  return schedules.some(schedule => {
    if (!schedule.enabled) return false
    if (schedule.day_of_week !== currentDay) return false
    return currentTime >= schedule.start_time && currentTime <= schedule.end_time
  })
}

// Helper function to check if emergency access is available
export function isEmergencyAccessReady(request: EmergencyAccessRequest | null): boolean {
  if (!request || request.cancelled || request.completed_at) return false
  return new Date() >= new Date(request.unlock_at)
}

