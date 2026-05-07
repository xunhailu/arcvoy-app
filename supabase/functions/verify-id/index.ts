import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractJSON(text: string): Record<string, unknown> {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch { /* fall through */ }
  return {}
}

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { fileBase64, fileType } = await req.json()

    if (!fileBase64 || !fileType) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const isImage = IMAGE_TYPES.includes(fileType)

    const reqHeaders: Record<string, string> = {
      'x-api-key': ANTHROPIC_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }
    if (!isImage) reqHeaders['anthropic-beta'] = 'pdfs-2024-09-25'

    const docBlock = isImage
      ? { type: 'image', source: { type: 'base64', media_type: fileType, data: fileBase64 } }
      : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            docBlock,
            {
              type: 'text',
              text: `Examine this document and determine if it is a government-issued photo ID (passport, driver's licence, national ID card, or similar official identity document). Then extract the holder's personal details.

Return ONLY a JSON object with these exact keys (use null for anything not found or not clearly visible):
{"is_id":true,"id_type":"","first":"","last":"","dob":"","address":"","city":"","state":"","country":"","zip":""}

Rules:
- Set is_id to false if this is NOT a government-issued photo ID (e.g. a selfie, receipt, credit card, bank card, screenshot, random image, or any non-identity document).
- Set is_id to true only if it is clearly a government-issued identity document with a photo.
- For dob use YYYY-MM-DD format.
- For country use the full English name (e.g. "United States" not "US").
- Return JSON only — no extra text.`,
            },
          ],
        }],
      }),
    })

    const result = await res.json()
    if (!result.content) {
      return new Response(JSON.stringify({ error: 'claude_error', detail: result }), {
        status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const text = result.content[0]?.text || '{}'
    const extracted = extractJSON(text)

    return new Response(JSON.stringify(extracted), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
