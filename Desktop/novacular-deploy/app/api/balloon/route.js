// Novacular BALLOON API — R = C − A
// novacular.ai/balloon — Tool 112

const MAX_INPUT_LENGTH = 10000

function sanitizeInput(input) {
  if (typeof input !== 'string') return null
  let clean = input.trim().slice(0, MAX_INPUT_LENGTH)
  clean = clean.replace(/\0/g, '')
  return clean.length > 0 ? clean : null
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const input = sanitizeInput(body?.input)
  const mode = body?.mode || 'analyze'
  if (!input) {
    return Response.json({ error: 'No valid input provided' }, { status: 400 })
  }
  const ANALYZE_PROMPT = `You are The Balloon — a recognition instrument built on the equation R = C - A.

When someone tells you what they're carrying, you identify their TWISTS — the constraints (A) shaping their experience. Not therapy. Not advice. Geometry.

RULES:
- Identify exactly 3-5 twists. No more, no less.
- Each twist is a constraint the person is applying to their situation.
- Name each twist in 2-4 words.
- For each twist, write ONE sentence describing what it constrains.
- Do NOT give advice. Do NOT interpret emotions. Just name the geometry.
- The tone is warm, precise, and non-judgmental.

Respond ONLY with valid JSON, no markdown, no backticks:
{"twists": [{"name": "twist name", "constrains": "what this twist prevents the person from seeing or feeling"}]}`

  const RELEASE_PROMPT = `You are The Balloon. The person has chosen to release a twist.

The twist they released: "${body?.twistName || ''}"
What it was constraining: "${body?.twistConstrains || ''}"

Write 1-2 sentences about what becomes visible now that this twist is released. What air was trapped here?

Be warm. Be precise. Do not give advice. Just describe what the untwisting reveals.

Respond with plain text only. No JSON. No markdown.`
  const systemPrompt = mode === 'release' ? RELEASE_PROMPT : ANALYZE_PROMPT

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: input }]
      })
    })

    const data = await response.json()
    const text = data?.content?.[0]?.text || ''

    if (mode === 'release') {
      return Response.json({ release: text })
    }

    try {
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      return Response.json(parsed)
    } catch {
      return Response.json({ error: 'Failed to parse response', raw: text }, { status: 500 })
    }
  } catch (e) {
    return Response.json({ error: 'API request failed' }, { status: 500 })
  }
}