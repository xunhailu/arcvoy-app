import { supabase } from './supabase'

const ADMIN_EMAIL = 'support@arcvoy.com'

/* ── Upload CV to Supabase Storage ── */
async function uploadCV(file, applicationId) {
  const ext = file.name.split('.').pop()
  const path = `${applicationId}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('cvs')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error
  return { path: data.path, filename: file.name }
}

/* ── Send email via Supabase Edge Function ── */
async function sendEmail({ to, subject, html, from: fromAddr }) {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html, from: fromAddr },
    })
    if (error) console.warn('Email send failed:', error)
  } catch (err) {
    console.warn('Email send failed:', err)
  }
}

/* ── Submit application ── */
export async function submitApplication({ fields, cvFile, job }) {
  // 1. Guard: prevent duplicate applications to the same role
  // Uses maybeSingle — returns null (not error) if no rows visible due to RLS
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('email', fields.email)
    .eq('job_id', job.id)
    .maybeSingle()

  if (existing) {
    throw new Error('You have already applied for this role.')
  }

  // 2. Generate ID client-side so we never need to SELECT back the inserted row
  const applicationId = crypto.randomUUID()

  const { error } = await supabase
    .from('applications')
    .insert([{
      id: applicationId,
      first_name: fields.first,
      last_name: fields.last,
      email: fields.email,
      address: fields.address,
      city: fields.city,
      state: fields.state,
      zip: fields.zip,
      country: fields.country,
      dob: fields.dob || null,
      linkedin: fields.linkedin,
      lang1: fields.lang1,
      lang2: fields.lang2,
      job_id: job.id,
      job_title: job.title,
      job_dept: job.dept,
      job_type: job.type,
      cv_path: null,
      cv_filename: null,
      status: 'applied',
    }])

  if (error) throw error

  // 3. Upload CV and update the record with the file path
  let cvPath = null
  let cvFilename = null
  if (cvFile) {
    const uploaded = await uploadCV(cvFile, applicationId)
    cvPath = uploaded.path
    cvFilename = uploaded.filename
    const { error: cvUpdateError } = await supabase
      .from('applications')
      .update({ cv_path: cvPath, cv_filename: cvFilename })
      .eq('id', applicationId)
    if (cvUpdateError) throw cvUpdateError
  }

  const data = { id: applicationId }

  // 3. Send confirmation email to applicant
  await sendEmail({
    to: fields.email,
    subject: `Application received — ${job.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1710">
        <div style="border-bottom:2px solid #cc6633;padding-bottom:16px;margin-bottom:24px;display:flex;align-items:center;gap:10px">
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 Q32 6 54 50" stroke="#cc6633" stroke-width="5" stroke-linecap="round"/><path d="M22 37 L42 37" stroke="#cc6633" stroke-width="5" stroke-linecap="round"/><circle cx="54" cy="50" r="3.5" fill="#cc6633"/></svg>
          <span style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-.02em;color:#1c1710">Arcvoy</span>
        </div>
        <h2 style="font-size:24px;font-weight:600;margin-bottom:8px">Application Received</h2>
        <p style="color:#6b5e4e;line-height:1.7">Hi ${fields.first},</p>
        <p style="color:#6b5e4e;line-height:1.7">
          Thank you for applying for the <strong style="color:#1c1710">${job.title}</strong> position at Arcvoy.
          We've received your application and our team will review it shortly.
        </p>
        <div style="background:#faf8f4;border:1px solid #e0d8cc;border-left:3px solid #cc6633;padding:16px 20px;margin:24px 0;border-radius:2px">
          <p style="margin:0;font-size:13px;color:#6b5e4e"><strong style="color:#1c1710">Role:</strong> ${job.title}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b5e4e"><strong style="color:#1c1710">Department:</strong> ${job.dept}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b5e4e"><strong style="color:#1c1710">Work type:</strong> ${job.type}</p>
        </div>
        <p style="color:#6b5e4e;line-height:1.7">
          You can expect to hear back from us within <strong style="color:#1c1710">48 hours</strong>. 
          If you have any questions in the meantime, reply to this email.
        </p>
        <p style="color:#6b5e4e;margin-top:32px">Best,<br><strong style="color:#1c1710">The Arcvoy Team</strong></p>
        <div style="border-top:1px solid #e0d8cc;margin-top:32px;padding-top:16px;font-size:11px;color:#b0a090">
          © 2026 Arcvoy · Building the future of distributed work
        </div>
      </div>
    `,
  })

  // 4. Notify admin
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New application — ${job.title} (${fields.first} ${fields.last})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1710">
        <h2 style="font-size:20px;font-weight:600;border-bottom:2px solid #cc6633;padding-bottom:12px">New Application Received</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px 0;color:#6b5e4e;font-size:13px;width:140px">Name</td><td style="padding:8px 0;font-weight:600">${fields.first} ${fields.last}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e4e;font-size:13px">Email</td><td style="padding:8px 0">${fields.email}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e4e;font-size:13px">Role</td><td style="padding:8px 0">${job.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e4e;font-size:13px">Department</td><td style="padding:8px 0">${job.dept}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e4e;font-size:13px">Country</td><td style="padding:8px 0">${fields.country || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e4e;font-size:13px">Date of Birth</td><td style="padding:8px 0">${fields.dob || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e4e;font-size:13px">LinkedIn</td><td style="padding:8px 0">${fields.linkedin || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e4e;font-size:13px">CV</td><td style="padding:8px 0">${cvFilename || 'Not uploaded'}</td></tr>
        </table>
        <p style="margin-top:24px;font-size:13px;color:#6b5e4e">Log in to the Arcvoy admin panel to review and take action.</p>
      </div>
    `,
  })

  return data
}

/* ── Fetch all applications (admin only) ── */
export async function fetchApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/* ── Update application status ── */
export async function updateStatus(id, status, applicant) {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id)

  if (error) throw error

  // Send status update email to applicant
  const messages = {
    reviewing:   { subject: 'Your application is under review', body: 'Great news — your application is currently being reviewed by our team.' },
    interviewed: { subject: 'Interview stage — Arcvoy', body: 'We\'d like to move forward with an interview. Our team will be in touch shortly with next steps.' },
    offered:     { subject: 'Offer from Arcvoy', body: 'We\'re thrilled to extend an offer to you. Our team will be in contact with full details very soon.' },
    hired:       { subject: 'Welcome to Arcvoy!', body: 'Congratulations — we\'re excited to have you join the Arcvoy team. More details coming your way shortly.' },
    rejected:    { subject: 'Update on your Arcvoy application', body: 'Thank you for your interest in Arcvoy. After careful consideration, we\'ve decided to move forward with other candidates for this role. We appreciate your time and encourage you to apply again in the future.' },
  }

  const msg = messages[status]
  if (msg && applicant?.email) {
    await sendEmail({
      to: applicant.email,
      subject: msg.subject,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1710">
          <div style="border-bottom:2px solid #cc6633;padding-bottom:16px;margin-bottom:24px;display:flex;align-items:center;gap:10px">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 Q32 6 54 50" stroke="#cc6633" stroke-width="5" stroke-linecap="round"/><path d="M22 37 L42 37" stroke="#cc6633" stroke-width="5" stroke-linecap="round"/><circle cx="54" cy="50" r="3.5" fill="#cc6633"/></svg>
            <span style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-.02em;color:#1c1710">Arcvoy</span>
          </div>
          <p style="color:#6b5e4e;line-height:1.7">Hi ${applicant.first_name},</p>
          <p style="color:#6b5e4e;line-height:1.7">${msg.body}</p>
          <p style="color:#6b5e4e;line-height:1.7">Role: <strong style="color:#1c1710">${applicant.job_title}</strong></p>
          <p style="color:#6b5e4e;margin-top:32px">Best,<br><strong style="color:#1c1710">The Arcvoy Team</strong></p>
        </div>
      `,
    })
  }
}

/* ── Update admin notes ── */
export async function updateNotes(id, notes) {
  const { error } = await supabase
    .from('applications')
    .update({ notes })
    .eq('id', id)

  if (error) throw error
}

/* ── Get signed CV download URL ── */
export async function getCVUrl(path) {
  const { data, error } = await supabase.storage
    .from('cvs')
    .createSignedUrl(path, 3600) // 1 hour expiry

  if (error) throw error
  return data.signedUrl
}

/* ── Fetch tickets (admin only) ── */
export async function fetchTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateTicketStatus(id, status) {
  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

/* ── Fetch subscribers (admin only) ── */
export async function fetchSubscribers() {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/* ── Admin auth ── */
export async function adminLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function adminLogout() {
  await supabase.auth.signOut()
}

export async function getAdminSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
