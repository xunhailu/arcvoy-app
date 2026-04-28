import { supabase } from './supabase'

function mapJob(row) {
  return { ...row, desc: row.description }
}

export async function fetchJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(mapJob)
}

export async function fetchJob(id) {
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
