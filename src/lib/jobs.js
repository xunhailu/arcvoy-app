import { supabase, isSupabaseConfigured } from './supabase'
import { JOBS as SAMPLE_JOBS } from '../data'

function mapJob(row) {
  return { ...row, desc: row.description ?? row.desc }
}

export async function fetchJobs() {
  if (!isSupabaseConfigured) return SAMPLE_JOBS.map(mapJob)
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(mapJob)
}

export async function fetchJob(id) {
  if (!isSupabaseConfigured) {
    const job = SAMPLE_JOBS.find(j => String(j.id) === String(id))
    if (!job) throw new Error('Job not found')
    return mapJob(job)
  }
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return mapJob(data)
}

export async function createJob(job) {
  const { error } = await supabase.from('jobs').insert([{
    title: job.title,
    dept: job.dept,
    type: job.type,
    salary: job.salary,
    description: job.desc,
    reqs: job.reqs,
    bonus: job.bonus,
    locations: job.locations,
    active: true,
  }])
  if (error) throw error
}

export async function updateJob(id, job) {
  const { error } = await supabase.from('jobs').update({
    title: job.title,
    dept: job.dept,
    type: job.type,
    salary: job.salary,
    description: job.desc,
    reqs: job.reqs,
    bonus: job.bonus,
    locations: job.locations,
    active: job.active,
  }).eq('id', id)
  if (error) throw error
}

export async function deleteJob(id) {
  const { error } = await supabase.from('jobs').update({ active: false }).eq('id', id)
  if (error) throw error
}
