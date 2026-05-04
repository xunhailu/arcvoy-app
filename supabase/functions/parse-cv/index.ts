import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractJSON(text: string): Record<string, string | null> {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch { /* fall through */ }
  return {}
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { fileBase64, fileType } = await req.json()

    if (!fileBase64) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 },
            },
            {
              type: 'text',
              text: `First decide if this document is a genuine CV or resume — a professional document showing someone's work experience, education, skills, or contact details. Then extract contact details.

Return ONLY a JSON object with these exact keys (use null for anything not found):
{"is_cv":true,"first":"","last":"","email":"","address":"","city":"","state":"","country":"","zip":"","linkedin":"","lang1":"","lang2":""}

Set is_cv to false if the document is NOT a CV or resume (e.g. invoice, receipt, article, bank statement, image, random file). Set is_cv to true only if it is a CV, resume, or professional profile.
For country use the full English name (e.g. "United States" not "US"). For languages use full names (e.g. "English", "Spanish"). Return JSON only.`,
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
