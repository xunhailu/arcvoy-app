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
    const { email, code } = await req.json()
    if (!email || !code) return json({ error: 'Email and code required' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check code is valid and not expired
    const { data: record } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (!record) return json({ error: 'Invalid or expired code. Please try again.' }, 400)

    // Delete used code immediately (single use)
    await supabase.from('otp_codes').delete().eq('email', email)

    // Create user if they don't exist yet
    const { error: createError } = await supabase.auth.admin.createUser({
      email, email_confirm: true,
    })
    if (createError && !createError.message.toLowerCase().includes('already')) throw createError

    // Generate a session token via magic link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink', email,
    })
    if (linkError) throw linkError

    return json({ token_hash: linkData.properties.hashed_token })
  } catch (e) {
    console.error(e)
    return json({ error: 'Internal error' }, 500)
  }
})
