import OpenAI from 'openai'

// Groq ist API-kompatibel zu OpenAI, deshalb das OpenAI-SDK mit
// umgebogener baseURL statt eines eigenen groq-sdk-Pakets (gleiche
// Konvention wie im ai-trip-planner-Referenzprojekt).
//
// Der Client wird erst bei Bedarf gebaut (nicht beim Modul-Import), sonst
// braucht schon das reine Importieren dieser Datei einen gesetzten
// GROQ_API_KEY - das wuerde z.B. in CI ohne echten Key sofort crashen, obwohl
// recommendByText dort nie wirklich aufgerufen wird (Tests injizieren einen
// Mock statt echt gegen Groq zu gehen).
let client

function getClient() {
  if (!client) {
    client = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
    })
  }
  return client
}

export async function recommendByText({ text, cocktails }) {
  const menu = cocktails
    .map((c) => `${c.id}: ${c.name} (${c.category}) – ${c.ingredients.join(', ')}`)
    .join('\n')

  const completion = await getClient().chat.completions.create({
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Du empfiehlst Cocktails aus einer Karte passend zum Wunsch eines Gasts.

Karte:
${menu}

Antworte ausschliesslich mit einem JSON-Objekt der Form {"cocktailIds": [zahl, ...]} mit den IDs der bis zu 5 am besten passenden Cocktails, absteigend nach Passung sortiert. Keine Erklaerung, kein Text ausserhalb des JSON.`,
      },
      { role: 'user', content: text },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  return parseRecommendation(raw, cocktails)
}

// Von recommendByText getrennt, damit die Parsing-/Validierungslogik ohne
// echten API-Call testbar ist.
export function parseRecommendation(raw, cocktails) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  const ids = Array.isArray(parsed.cocktailIds) ? parsed.cocktailIds : []
  const validIds = new Set(cocktails.map((c) => c.id))
  return ids.filter((id) => validIds.has(id)).slice(0, 5)
}
