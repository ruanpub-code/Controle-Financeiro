export default async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  const text = await response.text()
  let json = {}

  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Resposta inválida da API.')
  }

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Erro ao consultar a API.')
  }

  return json
}