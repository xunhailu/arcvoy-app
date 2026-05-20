import { supabase } from './supabase'

const ADMIN_EMAIL = 'admin@arcvoy.com'

export function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/* ── Shared email template parts ── */
const BRAND_HEADER = `
  <tr><td style="padding:0;line-height:0;font-size:0;">
    <img src="https://arcvoy.com/og-image.png" width="580" alt="Arcvoy — Build the Future"
      style="display:block;width:100%;max-width:580px;height:auto;border-radius:10px 10px 0 0;" />
  </td></tr>`

const BRAND_FOOTER = `
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F0EB;border-radius:0 0 10px 10px;">
      <tr>
        <td style="padding:16px 32px;"><span style="font-size:11px;color:#b0a090;">© 2026 Arcvoy</span></td>
        <td style="padding:16px 32px;text-align:right;"><span style="font-size:11px;color:#b0a090;"><a href="https://arcvoy.com" style="color:#b0a090;text-decoration:none;">arcvoy.com</a> &nbsp;·&nbsp; <a href="https://x.com/helloarcvoy" style="color:#b0a090;text-decoration:none;">@helloarcvoy</a></span></td>
      </tr>
    </table>
  </td></tr>`

function emailWrap(inner) {
  return `<table width="580" cellpadding="0" cellspacing="0" border="0" style="font-family:'Raleway',Calibri,Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;">${inner}</table>`
}

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

/* ── Upload ID to Supabase Storage (cvs bucket, id-docs/ prefix) ── */
async function uploadID(file, applicationId) {
  const ext = file.name.split('.').pop()
  const path = `id-docs/${applicationId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('cvs')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return { path: data.path, filename: file.name }
}

/* ── Send a single email via Edge Function — throws on failure ── */
async function sendEmail({ to, subject, html, from: fromAddr, replyTo }) {
  const { error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, html, from: fromAddr, replyTo },
  })
  if (error) throw new Error(error.message || 'Email delivery failed')
}

/* ── Append a row to email_logs (never throws — logging must not block UI) ── */
async function logEmail({ applicationId, emailType, recipientEmail, subject, status, errorMessage }) {
  try {
    await supabase.from('email_logs').insert([{
      application_id: applicationId || null,
      email_type: emailType,
      recipient_email: recipientEmail,
      subject: subject || null,
      status,
      error_message: errorMessage || null,
    }])
  } catch { /* intentionally silent */ }
}

/* ── Fetch email log for one application (admin only) ── */
export async function fetchEmailLogs(applicationId) {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('application_id', applicationId)
    .order('sent_at', { ascending: false })
  if (error) return []
  return data || []
}

/* ── Submit application ── */
export async function submitApplication({ fields, cvFile, idFrontFile, idBackFile, idType, job }) {
  const { data: existing } = await supabase
    .from('applications')
    .select('id, job_title')
    .eq('email', fields.email)
    .in('status', ['applied', 'reviewing', 'interviewed', 'offered'])
    .maybeSingle()

  if (existing) throw new Error(`You already have an active application for ${existing.job_title}. Please wait for a decision before applying to another role.`)

  const applicationId = crypto.randomUUID()

  let cvPath = null
  let cvFilename = null
  if (cvFile) {
    const uploaded = await uploadCV(cvFile, applicationId)
    cvPath = uploaded.path
    cvFilename = uploaded.filename
  }

  let idPath = null
  let idFilename = null
  let idBackPath = null
  let idBackFilename = null
  if (idFrontFile) {
    const uploaded = await uploadID(idFrontFile, applicationId)
    idPath = uploaded.path
    idFilename = uploaded.filename
  }
  if (idBackFile) {
    const uploaded = await uploadID(idBackFile, applicationId)
    idBackPath = uploaded.path
    idBackFilename = uploaded.filename
  }

  const { error } = await supabase
    .from('applications')
    .insert([{
      id: applicationId,
      first_name: fields.first,
      last_name: fields.last,
      email: fields.email,
      phone: fields.phoneCode && fields.phone
        ? fields.phoneCode + fields.phone.replace(/\D/g, '')
        : null,
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
      dob: fields.dob || null,
      cv_path: cvPath,
      cv_filename: cvFilename,
      id_path: idPath,
      id_filename: idFilename,
      id_back_path: idBackPath,
      id_back_filename: idBackFilename,
      id_type: idType || null,
      status: 'applied',
    }])

  if (error) {
    if (error.code === '23505') throw new Error('You have already applied for this role.')
    throw error
  }

  // Confirmation to applicant
  const confirmSubject = `Application received — ${job.title}`
  const confirmHtml = emailWrap(`
    ${BRAND_HEADER}
    <tr><td style="background:#d97757;padding:28px 32px;">
      <p style="margin:0 0 6px;font-size:10px;color:rgba(255,255,255,0.7);letter-spacing:0.14em;text-transform:uppercase;font-family:'Raleway',Calibri,Arial,sans-serif;">Application Received</p>
      <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#ffffff;font-weight:400;line-height:1.25;text-transform:uppercase;">${escHtml(job.title)}</h1>
    </td></tr>
    <tr><td style="padding:38px 32px;background:#ffffff;">
      <p style="font-size:14px;color:#1A1410;margin:0 0 4px;font-weight:600;">Hi ${escHtml(fields.first)},</p>
      <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 32px;">Your application has landed with Arcvoy. Thank you for taking the time to share your work with us. We are reviewing your profile against the role requirements and the hiring team's current priorities.</p>
      <div style="border-top:1px solid #EDE8E2;margin-bottom:24px;"></div>
      <p style="font-size:10px;color:#b0a090;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px;">Application Details</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;width:42%;border-bottom:1px solid #F5F0EB;">Position</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${escHtml(job.title)}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Department</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${escHtml(job.dept)}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;">Work Type</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;">${escHtml(job.type)}</td></tr>
      </table>
      <div style="border-top:1px solid #EDE8E2;margin:28px 0;"></div>
      <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 32px;">You can expect an update within <strong style="color:#1A1410;">48 hours</strong>. If anything in your application changes before then, you can reply directly to this email.</p>
      <p style="font-size:14px;color:#6b5e4e;margin:0;">Regards,</p>
      <p style="font-size:14px;color:#1A1410;margin:4px 0 0;font-weight:600;">Arcvoy Team</p>
    </td></tr>
    ${BRAND_FOOTER}`)

  try {
    await sendEmail({ to: fields.email, from: 'Arcvoy Careers <careers@arcvoy.com>', replyTo: 'support@arcvoy.com', subject: confirmSubject, html: confirmHtml })
    await logEmail({ applicationId, emailType: 'confirmation', recipientEmail: fields.email, subject: confirmSubject, status: 'sent' })
  } catch (err) {
    await logEmail({ applicationId, emailType: 'confirmation', recipientEmail: fields.email, subject: confirmSubject, status: 'failed', errorMessage: err.message })
  }

  // Admin notification
  const adminSubject = `New application — ${job.title} (${fields.first} ${fields.last})`
  const adminHtml = emailWrap(`
    ${BRAND_HEADER}
    <tr><td style="padding:38px 32px;background:#ffffff;">
      <p style="font-size:10px;color:#b0a090;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">New Application</p>
      <h2 style="font-size:14px;color:#1A1410;font-weight:700;margin:0 0 28px;letter-spacing:0.06em;text-transform:uppercase;">${escHtml(job.title)} — ${escHtml(fields.first)} ${escHtml(fields.last)}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;width:42%;border-bottom:1px solid #F5F0EB;">Name</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${escHtml(fields.first)} ${escHtml(fields.last)}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Email</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${escHtml(fields.email)}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Phone</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${escHtml(fields.phoneCode || '')}${fields.phone ? escHtml(fields.phone.replace(/\D/g, '')) : '—'}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Role</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${escHtml(job.title)}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Department</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${escHtml(job.dept)}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Country</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${escHtml(fields.country || '—')}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">LinkedIn</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${escHtml(fields.linkedin || '—')}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;">CV</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;">${escHtml(cvFilename || 'Not uploaded')}</td></tr>
      </table>
      <div style="border-top:1px solid #EDE8E2;margin:28px 0 0;"></div>
      <p style="margin:20px 0 0;font-size:13px;color:#9a8f85;">Log in to the Arcvoy admin panel to review and take action.</p>
    </td></tr>
    ${BRAND_FOOTER}`)

  try {
    await sendEmail({ to: ADMIN_EMAIL, from: 'Arcvoy Platform <careers@arcvoy.com>', subject: adminSubject, html: adminHtml })
    await logEmail({ applicationId, emailType: 'admin_notification', recipientEmail: ADMIN_EMAIL, subject: adminSubject, status: 'sent' })
  } catch (err) {
    await logEmail({ applicationId, emailType: 'admin_notification', recipientEmail: ADMIN_EMAIL, subject: adminSubject, status: 'failed', errorMessage: err.message })
  }

  return { id: applicationId }
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

/* ── Send status update email — throws on failure ── */
export async function sendStatusEmail(status, app) {
  const name = escHtml(app.first_name)
  const role = escHtml(app.job_title)

  const configs = {
    reviewing: {
      subject: 'Your application is under review — Arcvoy',
      banner: '#cc6633',
      bannerLabel: 'Application Update',
      headline: 'Under Review',
      body: `Your application for <strong style="color:#1A1410;">${role}</strong> has moved into team review. At this stage, we are looking closely at your recent projects, technical depth, and fit for the role's operating environment.`,
      note: 'No action is needed from you right now. We will send a clear update as soon as the review is complete.',
    },
    interviewed: {
      subject: 'You have been selected for an interview — Arcvoy',
      banner: '#9f4f2d',
      bannerLabel: 'Next Step',
      headline: 'Interview Invitation',
      body: `Good news — the hiring team would like to meet with you for the <strong style="color:#1A1410;">${role}</strong> role. We saw strong alignment between your background and the work this team is building.`,
      note: 'We will follow up with scheduling details, interview format, and anything useful to prepare. You do not need to send anything extra yet.',
    },
    offered: {
      subject: 'You have received an offer — Arcvoy',
      banner: '#6f3f2d',
      bannerLabel: 'Offer',
      headline: 'You Have an Offer',
      body: `We are pleased to move forward with an offer for the <strong style="color:#1A1410;">${role}</strong> role. Your experience, judgment, and approach stood out through the process.`,
      note: 'A formal offer packet will follow with compensation, start date, and onboarding details. Please review it carefully once it arrives, and reply here with any questions.',
    },
    hired: {
      subject: 'Welcome to Arcvoy',
      banner: '#7a5a34',
      bannerLabel: 'Confirmed',
      headline: 'Welcome to Arcvoy',
      body: `Congratulations, ${name}. You are confirmed for the <strong style="color:#1A1410;">${role}</strong> role. We are looking forward to helping you settle in and get connected with the right people from day one.`,
      note: 'Your onboarding details are on their way. We will send first-day timing, access steps, and the main contacts you will hear from next.',
    },
    rejected: {
      subject: 'An update on your Arcvoy application',
      banner: '#5b5149',
      bannerLabel: 'Application Update',
      headline: 'Thank You for Applying',
      body: `Thank you for taking the time to apply for the <strong style="color:#1A1410;">${role}</strong> role. After reviewing the current shortlist, we will not be moving forward with your application for this opening.`,
      note: 'We appreciate the care you put into your application. Your profile will remain welcome for future Arcvoy roles that may be a closer match.',
    },
  }

  const c = configs[status]
  if (!c || !app.email) return

  const html = emailWrap(`
    ${BRAND_HEADER}
    <tr><td style="background:${c.banner};padding:28px 32px;">
      <p style="margin:0 0 6px;font-size:10px;color:rgba(255,255,255,0.7);letter-spacing:0.14em;text-transform:uppercase;font-family:'Raleway',Calibri,Arial,sans-serif;">${c.bannerLabel}</p>
      <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#ffffff;font-weight:400;line-height:1.25;text-transform:uppercase;">${c.headline}</h1>
    </td></tr>
    <tr><td style="padding:38px 32px;background:#ffffff;">
      <p style="font-size:14px;color:#1A1410;margin:0 0 4px;font-weight:600;">Hi ${name},</p>
      <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 32px;">${c.body}</p>
      <div style="border-top:1px solid #EDE8E2;margin-bottom:24px;"></div>
      <p style="font-size:13px;color:#9a8f85;line-height:1.7;margin:0;">${c.note}</p>
      <p style="font-size:14px;color:#6b5e4e;margin:24px 0 0;">Warm regards,</p>
      <p style="font-size:14px;color:#1A1410;margin:4px 0 0;font-weight:600;">The Arcvoy Team</p>
    </td></tr>
    ${BRAND_FOOTER}`)

  const emailType = `status_${status}`
  try {
    await sendEmail({ to: app.email, subject: c.subject, html, from: 'Arcvoy Careers <careers@arcvoy.com>', replyTo: 'support@arcvoy.com' })
    await logEmail({ applicationId: app.id, emailType, recipientEmail: app.email, subject: c.subject, status: 'sent' })
  } catch (err) {
    await logEmail({ applicationId: app.id, emailType, recipientEmail: app.email, subject: c.subject, status: 'failed', errorMessage: err.message })
    throw err
  }
}

/* ── Identity verification email — throws on failure ── */
export async function sendIdentityVerificationEmail(app, link) {
  const subject = 'Identity Verification — Arcvoy'
  const html = emailWrap(`
    ${BRAND_HEADER}
    <tr><td style="background:#cc6633;padding:28px 32px;">
      <p style="margin:0 0 8px;font-size:10px;color:rgba(255,255,255,0.7);letter-spacing:0.14em;text-transform:uppercase;">Action Required</p>
      <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#ffffff;font-weight:700;line-height:1.2;">Identity Verification</h1>
    </td></tr>
    <tr><td style="padding:38px 32px;background:#ffffff;">
      <p style="font-size:14px;color:#1A1410;margin:0 0 4px;font-weight:600;">Hi ${escHtml(app.first_name)},</p>
      <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 28px;">Your application with Arcvoy is currently in progress. The next step is to complete your identity verification. This is a quick process and ensures we can move your application forward securely.</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E0DAD4;border-radius:8px;margin-bottom:28px;background:#faf9f7;">
        <tr><td style="padding:24px;">
          <p style="font-size:13px;color:#1A1410;font-weight:700;margin:0 0 12px;line-height:1.5;">To help your verification go through quickly, please follow these tips:</p>
          <ul style="margin:0 0 16px;padding-left:18px;">
            <li style="font-size:13px;color:#6b5e4e;padding:3px 0;line-height:1.6;">Use a valid, non-expired ID</li>
            <li style="font-size:13px;color:#6b5e4e;padding:3px 0;line-height:1.6;">Take photos in good lighting (no glare or shadows)</li>
            <li style="font-size:13px;color:#6b5e4e;padding:3px 0;line-height:1.6;">Make sure the entire ID is visible and clear (not blurry)</li>
            <li style="font-size:13px;color:#6b5e4e;padding:3px 0;line-height:1.6;">Ensure all details match what you entered</li>
            <li style="font-size:13px;color:#6b5e4e;padding:3px 0;line-height:1.6;">For selfies: look straight at the camera and avoid hats or sunglasses</li>
          </ul>
          <p style="font-size:13px;color:#6b5e4e;line-height:1.7;margin:0 0 18px;">Click the button below to begin. If it does not open, copy the link and paste it into your browser.</p>
          <a href="${link}" style="display:inline-block;background:#cc6633;color:#ffffff;font-family:'Raleway',Calibri,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:12px 24px;border-radius:5px;text-decoration:none;margin-bottom:14px;">Verify Identity</a><br/>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #D8D2CC;border-radius:5px;table-layout:fixed;margin-top:4px;">
            <tr>
              <td style="background:#f0ece8;padding:11px 14px;font-size:12px;color:#9a8f85;word-break:break-all;width:100%;">${link}</td>
              <td width="96" style="padding:0;vertical-align:middle;"><a href="${link}" style="display:block;background:#1A1410;color:#ffffff;font-family:'Raleway',Calibri,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:11px 14px;text-decoration:none;text-align:center;white-space:nowrap;">Open Link</a></td>
            </tr>
          </table>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid #cc6633;margin-bottom:28px;">
        <tr><td style="padding:10px 16px;"><p style="font-size:13px;color:#6b5e4e;line-height:1.7;margin:0;">If you have any issues completing this step, reply to this email and our team will assist you as soon as possible.</p></td></tr>
      </table>
      <p style="font-size:14px;color:#6b5e4e;margin:0 0 2px;">Regards,</p>
      <p style="font-size:14px;color:#1A1410;margin:0;font-weight:700;">Arcvoy Team</p>
    </td></tr>
    ${BRAND_FOOTER}`)

  try {
    await sendEmail({ to: app.email, from: 'Arcvoy Careers <careers@arcvoy.com>', replyTo: 'support@arcvoy.com', subject, html })
    await logEmail({ applicationId: app.id, emailType: 'identity_verification', recipientEmail: app.email, subject, status: 'sent' })
  } catch (err) {
    await logEmail({ applicationId: app.id, emailType: 'identity_verification', recipientEmail: app.email, subject, status: 'failed', errorMessage: err.message })
    throw err
  }
}

/* ── Compliance verification email — throws on failure ── */
export async function sendComplianceVerificationEmail(app, link) {
  const subject = 'Compliance Verification — Arcvoy'
  const html = emailWrap(`
    ${BRAND_HEADER}
    <tr><td style="background:#8a4a2f;padding:28px 32px;">
      <p style="margin:0 0 8px;font-size:10px;color:rgba(255,255,255,0.7);letter-spacing:0.14em;text-transform:uppercase;">Final Step</p>
      <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#ffffff;font-weight:700;line-height:1.2;text-transform:uppercase;">Compliance Verification</h1>
    </td></tr>
    <tr><td style="padding:38px 32px;background:#ffffff;">
      <p style="font-size:14px;color:#1A1410;margin:0 0 4px;font-weight:600;">Hi ${escHtml(app.first_name)},</p>
      <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 16px;">Thank you for completing your identity verification. We appreciate your cooperation.</p>
      <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 28px;">As legally required, all businesses must conduct sanction screening and global compliance checks. Please click the button below to be directed to our third party vendor's site and follow the instructions provided to complete the process.</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E0DAD4;border-radius:8px;margin-bottom:28px;background:#faf9f7;">
        <tr><td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #f0c48a;border-radius:6px;background:#fffaf3;margin-bottom:20px;">
            <tr><td style="padding:14px 16px;">
              <p style="font-size:13px;color:#1A1410;line-height:1.75;margin:0;"><strong>Important</strong> &ndash; the following verification link is personalized and can only be used by a single individual. Do not share this link with other individuals. Sharing of the link is considered a violation of our Contributor Standards and will result in account deactivation.</p>
            </td></tr>
          </table>
          <a href="${link}" style="display:inline-block;background:#8a4a2f;color:#ffffff;font-family:'Raleway',Calibri,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:12px 24px;border-radius:5px;text-decoration:none;margin-bottom:14px;">Begin Compliance Check</a><br/>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #D8D2CC;border-radius:5px;table-layout:fixed;margin-top:4px;">
            <tr>
              <td style="background:#f0ece8;padding:11px 14px;font-size:12px;color:#9a8f85;word-break:break-all;width:100%;">${link}</td>
              <td width="96" style="padding:0;vertical-align:middle;"><a href="${link}" style="display:block;background:#1A1410;color:#ffffff;font-family:'Raleway',Calibri,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:11px 14px;text-decoration:none;text-align:center;white-space:nowrap;">Open Link</a></td>
            </tr>
          </table>
          <p style="font-size:12px;color:#9a8f85;line-height:1.6;margin:12px 0 0;">If the button does not open, copy the link above and paste it directly into your browser.</p>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid #8a4a2f;margin-bottom:28px;">
        <tr><td style="padding:10px 16px;"><p style="font-size:13px;color:#6b5e4e;line-height:1.7;margin:0;">If you have any issues completing this step, reply to this email and our team will assist you as soon as possible.</p></td></tr>
      </table>
      <p style="font-size:14px;color:#6b5e4e;margin:0 0 2px;">Regards,</p>
      <p style="font-size:14px;color:#1A1410;margin:0;font-weight:700;">Arcvoy Team</p>
    </td></tr>
    ${BRAND_FOOTER}`)

  try {
    await sendEmail({ to: app.email, from: 'Arcvoy Careers <careers@arcvoy.com>', replyTo: 'support@arcvoy.com', subject, html })
    await logEmail({ applicationId: app.id, emailType: 'compliance_verification', recipientEmail: app.email, subject, status: 'sent' })
  } catch (err) {
    await logEmail({ applicationId: app.id, emailType: 'compliance_verification', recipientEmail: app.email, subject, status: 'failed', errorMessage: err.message })
    throw err
  }
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
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

/* ── Get signed ID document URL (same cvs bucket, id-docs/ prefix) ── */
export async function getIdUrl(path) {
  const { data, error } = await supabase.storage
    .from('cvs')
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

/* ── Create sourced application (admin only) ── */
export async function createSourcedApplication({ firstName, lastName, email, job }) {
  const applicationId = crypto.randomUUID()
  const { error } = await supabase
    .from('applications')
    .insert([{
      id: applicationId,
      first_name: firstName,
      last_name: lastName,
      email,
      job_id: job.id,
      job_title: job.title,
      job_dept: job.dept,
      job_type: job.type,
      status: 'applied',
      source: 'sourced',
    }])
  if (error) {
    if (error.code === '23505') throw new Error('This person has already been added for this role.')
    throw error
  }
  return { id: applicationId }
}

/* ── Send welcome email to sourced candidate — throws on failure ── */
export async function sendWelcomeEmail(app) {
  const subject = 'You have been selected for consideration — Arcvoy'
  const html = emailWrap(`
    ${BRAND_HEADER}
    <tr><td style="background:#cc6633;padding:28px 32px;">
      <p style="margin:0 0 8px;font-size:10px;color:rgba(255,255,255,0.7);letter-spacing:0.14em;text-transform:uppercase;font-family:'Raleway',Calibri,Arial,sans-serif;">Talent Opportunity</p>
      <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#ffffff;font-weight:400;line-height:1.2;text-transform:uppercase;">An Opportunity with Arcvoy</h1>
    </td></tr>
    <tr><td style="padding:38px 32px;background:#ffffff;">
      <p style="font-size:14px;color:#1A1410;margin:0 0 4px;font-weight:600;">Hi ${escHtml(app.first_name)},</p>
      <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 24px;">We are reaching out from Arcvoy, a specialist talent platform for AI-first teams. Your profile came up in our search for candidates with the right mix of engineering depth, product sense, and frontier AI experience.</p>
      <p style="font-size:14px;color:#6b5e4e;line-height:1.85;margin:0 0 28px;">We would like to consider you for the <strong style="color:#1A1410;">${escHtml(app.job_title)}</strong> role. If the timing is right, our team will share the role context, company details, and next steps so you can decide whether it is worth exploring.</p>
      <div style="height:1px;background:#EDE8E2;margin-bottom:24px;"></div>
      <p style="font-size:13px;color:#9a8f85;line-height:1.7;margin:0;">If you are open to hearing more, reply to this email and we will send the next details. If now is not the right time, no action is needed.</p>
      <p style="font-size:14px;color:#6b5e4e;margin:24px 0 0;">Regards,</p>
      <p style="font-size:14px;color:#1A1410;margin:4px 0 0;font-weight:600;">Arcvoy Team</p>
    </td></tr>
    ${BRAND_FOOTER}`)

  try {
    await sendEmail({ to: app.email, from: 'Arcvoy Careers <careers@arcvoy.com>', replyTo: 'support@arcvoy.com', subject, html })
    await logEmail({ applicationId: app.id, emailType: 'welcome', recipientEmail: app.email, subject, status: 'sent' })
  } catch (err) {
    await logEmail({ applicationId: app.id, emailType: 'welcome', recipientEmail: app.email, subject, status: 'failed', errorMessage: err.message })
    throw err
  }
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

/* ── Send email blast using Resend batch API (50 per request) ── */
export async function sendBlastEmail(subject, body, subscribers) {
  if (!subscribers.length) return { sent: 0, failed: 0 }

  const safeSubject = String(subject || '').slice(0, 200)
  const unique = [...new Map(subscribers.map(s => [s.email, s])).values()]

  const html = emailWrap(`
    ${BRAND_HEADER}
    <tr><td style="background:#cc6633;padding:28px 32px;">
      <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#ffffff;font-weight:700;line-height:1.25;">${escHtml(safeSubject)}</h1>
    </td></tr>
    <tr><td style="padding:38px 32px;background:#ffffff;">
      <div style="font-size:14px;color:#6b5e4e;line-height:1.85;">${escHtml(body).replace(/\n/g, '<br>')}</div>
      <div style="height:1px;background:#EDE8E2;margin:28px 0;"></div>
      <p style="font-size:14px;color:#6b5e4e;margin:0 0 2px;">Regards,</p>
      <p style="font-size:14px;color:#1A1410;margin:0;font-weight:600;">Arcvoy Team</p>
      <p style="font-size:11px;color:#b0a090;margin:20px 0 0;line-height:1.6;">You are receiving this because you subscribed at arcvoy.com. Reply to unsubscribe.</p>
    </td></tr>
    ${BRAND_FOOTER}`)

  const BATCH_SIZE = 50
  let sent = 0
  let failed = 0

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const chunk = unique.slice(i, i + BATCH_SIZE)
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          batch: chunk.map(s => ({
            to: s.email,
            from: 'Arcvoy <careers@arcvoy.com>',
            replyTo: 'support@arcvoy.com',
            subject: safeSubject,
            html,
          })),
        },
      })
      if (error) throw new Error(error.message)
      sent += chunk.length
    } catch {
      failed += chunk.length
    }
  }

  return { sent, failed }
}

/* ── Admin auth ── */
export async function adminLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (data.user?.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut()
    throw new Error('Access denied.')
  }
  return data
}

export async function adminLogout() {
  await supabase.auth.signOut()
}

export async function getAdminSession() {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) return null
  if (session.user?.app_metadata?.role !== 'admin') return null
  return session
}
