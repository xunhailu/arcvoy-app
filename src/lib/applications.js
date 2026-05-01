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

  // 2. Generate ID client-side, upload CV first, then insert in one shot (avoids a separate UPDATE)
  const applicationId = crypto.randomUUID()

  let cvPath = null
  let cvFilename = null
  if (cvFile) {
    const uploaded = await uploadCV(cvFile, applicationId)
    cvPath = uploaded.path
    cvFilename = uploaded.filename
  }

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
      linkedin: fields.linkedin,
      lang1: fields.lang1,
      lang2: fields.lang2,
      job_id: job.id,
      job_title: job.title,
      job_dept: job.dept,
      job_type: job.type,
      dob: null,
      cv_path: cvPath,
      cv_filename: cvFilename,
      status: 'applied',
    }])

  if (error) throw error

  const data = { id: applicationId }

  // 3. Send confirmation email to applicant
  await sendEmail({
    to: fields.email,
    subject: `Application received — ${job.title}`,
    html: `
      <div style="font-family:Calibri,Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;">
        <div style="background:#1A1410;padding:22px 32px;border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 Q32 6 54 50" stroke="#d97757" stroke-width="5" stroke-linecap="round"/><path d="M22 37 L42 37" stroke="#d97757" stroke-width="5" stroke-linecap="round"/><circle cx="54" cy="50" r="3.5" fill="#d97757"/></svg>
            <span style="font-family:Georgia,serif;font-size:20px;color:#F5F0EB;font-weight:400;letter-spacing:0.01em;">Arcvoy</span>
          </div>
          <span style="font-size:10px;color:#6a5a4a;letter-spacing:0.1em;text-transform:uppercase;">Talent Platform</span>
        </div>
        <div style="background:#d97757;padding:30px 32px;">
          <p style="margin:0 0 6px;font-size:10px;color:rgba(255,255,255,0.65);letter-spacing:0.12em;text-transform:uppercase;font-family:Calibri,Arial,sans-serif;">Application Received</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#ffffff;font-weight:400;line-height:1.25;letter-spacing:-0.2px;">${job.title}</h1>
        </div>
        <div style="padding:38px 32px;background:#ffffff;">
          <p style="font-size:14px;color:#1A1410;margin:0 0 4px;font-weight:600;">Hi ${fields.first},</p>
          <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 32px;">We have received your application and we are genuinely glad you chose to apply through Arcvoy. Every application is reviewed personally by our team and we will be in touch shortly.</p>
          <div style="border-top:1px solid #EDE8E2;margin-bottom:24px;"></div>
          <p style="font-size:10px;color:#b0a090;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px;">Application Details</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;width:42%;border-bottom:1px solid #F5F0EB;">Position</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${job.title}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Department</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${job.dept}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;">Work Type</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;">${job.type}</td></tr>
          </table>
          <div style="border-top:1px solid #EDE8E2;margin:28px 0;"></div>
          <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 32px;">Expect to hear from us within <strong style="color:#1A1410;">48 hours</strong>. If you have any questions before then, simply reply to this email.</p>
          <p style="font-size:14px;color:#6b5e4e;margin:0;">Warm regards,</p>
          <p style="font-size:14px;color:#1A1410;margin:4px 0 0;font-weight:600;">The Arcvoy Team</p>
        </div>
        <div style="background:#F5F0EB;padding:16px 32px;border-radius:0 0 10px 10px;display:flex;justify-content:space-between;align-items:center;">
          <p style="margin:0;font-size:11px;color:#b0a090;">© 2026 Arcvoy</p>
          <p style="margin:0;font-size:11px;color:#b0a090;"><a href="https://arcvoy.com" style="color:#b0a090;text-decoration:none;">arcvoy.com</a> &nbsp;·&nbsp; <a href="https://x.com/helloarcvoy" style="color:#b0a090;text-decoration:none;">@helloarcvoy</a></p>
        </div>
      </div>
    `,
  })

  // 4. Notify admin
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New application — ${job.title} (${fields.first} ${fields.last})`,
    html: `
      <div style="font-family:Calibri,Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;">
        <div style="background:#1A1410;padding:22px 32px;border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 Q32 6 54 50" stroke="#d97757" stroke-width="5" stroke-linecap="round"/><path d="M22 37 L42 37" stroke="#d97757" stroke-width="5" stroke-linecap="round"/><circle cx="54" cy="50" r="3.5" fill="#d97757"/></svg>
            <span style="font-family:Georgia,serif;font-size:20px;color:#F5F0EB;font-weight:400;">Arcvoy</span>
          </div>
          <span style="font-size:10px;color:#6a5a4a;letter-spacing:0.1em;text-transform:uppercase;">Talent Platform</span>
        </div>
        <div style="padding:38px 32px;background:#ffffff;">
          <p style="font-size:10px;color:#b0a090;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">New Application</p>
          <h2 style="font-size:14px;color:#1A1410;font-weight:700;margin:0 0 28px;letter-spacing:0.06em;text-transform:uppercase;">${job.title} — ${fields.first} ${fields.last}</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;width:42%;border-bottom:1px solid #F5F0EB;">Name</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${fields.first} ${fields.last}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Email</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${fields.email}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Role</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${job.title}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Department</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${job.dept}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Country</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${fields.country || '—'}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">LinkedIn</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${fields.linkedin || '—'}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;">CV</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;">${cvFilename || 'Not uploaded'}</td></tr>
          </table>
          <div style="border-top:1px solid #EDE8E2;margin:28px 0 0;"></div>
          <p style="margin:20px 0 0;font-size:13px;color:#9a8f85;">Log in to the Arcvoy admin panel to review and take action.</p>
        </div>
        <div style="background:#F5F0EB;padding:16px 32px;border-radius:0 0 10px 10px;display:flex;justify-content:space-between;align-items:center;">
          <p style="margin:0;font-size:11px;color:#b0a090;">© 2026 Arcvoy</p>
          <p style="margin:0;font-size:11px;color:#b0a090;"><a href="https://arcvoy.com" style="color:#b0a090;text-decoration:none;">arcvoy.com</a> &nbsp;·&nbsp; <a href="https://x.com/helloarcvoy" style="color:#b0a090;text-decoration:none;">@helloarcvoy</a></p>
        </div>
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
export async function updateStatus(id, status) {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

/* ── Update admin notes ── */
export async function updateNotes(id, notes) {
  const { error } = await supabase
    .from('applications')
    .update({ notes })
    .eq('id', id)

  if (error) throw error
}

/* ── Save verification links (admin only) ── */
export async function updateVerificationLinks(id, identityLink, complianceLink) {
  const { error } = await supabase
    .from('applications')
    .update({ identity_link: identityLink || null, compliance_link: complianceLink || null })
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

/* ── Delete application (admin only) ── */
export async function deleteApplication(id) {
  const { error } = await supabase.from('applications').delete().eq('id', id)
  if (error) throw error
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
