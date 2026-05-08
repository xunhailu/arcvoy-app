import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) return json({ error: 'Valid email required' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Rate limit: 1 code per 60 seconds per email
    const { data: existing } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      const secsAgo = (Date.now() - new Date(existing.created_at).getTime()) / 1000
      if (secsAgo < 60) return json({ error: `Wait ${Math.ceil(60 - secsAgo)}s before requesting a new code.` }, 429)
    }

    // Generate 6-digit code
    const code  = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('otp_codes').upsert(
      { email, code, expires_at: expires, created_at: new Date().toISOString() },
      { onConflict: 'email' }
    )

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Arcvoy <noreply@arcvoy.com>',
        to: email,
        subject: `${code} — your Arcvoy sign-in code`,
        html: `
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:48px 32px;background:#0d0906;border-radius:20px;">
  <div style="font-size:30px;font-weight:800;color:#f2ede7;letter-spacing:-0.5px;margin-bottom:4px;">Arcvoy</div>
  <div style="height:2px;width:48px;background:linear-gradient(90deg,#cc6633,#e07a4a);border-radius:2px;margin-bottom:32px;"></div>

  <p style="font-size:15px;color:#a89880;margin:0 0 6px;font-weight:500;">Your sign-in code</p>
  <p style="font-size:13px;color:#6b5e4e;margin:0 0 28px;">Enter this code on the Arcvoy sign-in page. It expires in 10 minutes.</p>

  <div style="background:#1a1310;border:1px solid rgba(204,102,51,0.3);border-radius:14px;padding:28px 24px;text-align:center;margin-bottom:28px;">
    <span style="font-size:48px;font-weight:700;letter-spacing:16px;color:#cc6633;font-family:'Courier New',monospace;">${code}</span>
  </div>

  <p style="font-size:12px;color:#4a3f36;margin:0 0 6px;">Do not share this code with anyone — Arcvoy will never ask for it.</p>
  <p style="font-size:12px;color:#4a3f36;margin:0;">If you didn't request this, ignore this email.</p>
</div>`,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return json({ error: 'Failed to send email. Please try again.' }, 500)
    }

    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return json({ error: 'Internal error' }, 500)
  }
})
