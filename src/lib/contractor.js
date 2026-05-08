import { supabase } from './supabase'

export async function getW9(userId) {
  const { data } = await supabase.from('w9_submissions')
    .select('*').eq('user_id', userId).maybeSingle()
  return data
}

export async function saveW9(userId, email, form) {
  const { data, error } = await supabase.from('w9_submissions').upsert({
    user_id: userId, email, ...form,
    certified_at: new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'user_id' }).select().single()
  if (error) throw error
  return data
}

export async function getPaymentInfo(userId) {
  const { data } = await supabase.from('payment_info')
    .select('*').eq('user_id', userId).maybeSingle()
  return data
}

export async function savePaymentInfo(userId, email, form) {
  const { data, error } = await supabase.from('payment_info').upsert({
    user_id: userId, email, ...form,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).select().single()
  if (error) throw error
  return data
}

/* ── admin ── */
export async function fetchAllW9() {
  const { data } = await supabase.from('w9_submissions')
    .select('*').order('created_at', { ascending: false })
  return data || []
}

export async function fetchAllPaymentInfo() {
  const { data } = await supabase.from('payment_info')
    .select('*').order('created_at', { ascending: false })
  return data || []
}

export async function fetchPaymentRecords() {
  const { data } = await supabase.from('payments')
    .select('*').order('paid_at', { ascending: false })
  return data || []
}

export async function recordPayment(payment) {
  const { data, error } = await supabase.from('payments').insert(payment).select().single()
  if (error) throw error
  return data
}
