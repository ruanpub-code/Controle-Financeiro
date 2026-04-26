function resolveFilterScope(dataKey, focusModule = 'dashboard') {
  if (focusModule === 'dashboard' && dataKey === 'recent') return 'dashboard:recent'
  if (focusModule === 'managementDashboard' && dataKey === 'usuarios') return 'managementDashboard:usuarios'
  if (focusModule === 'managementDashboard' && dataKey === 'auditoria') return 'managementDashboard:auditoria'
  if (focusModule === 'managementDashboard' && dataKey === 'entidades') return 'managementDashboard:entidades'
  if (focusModule === 'cofrinhos' && dataKey === 'aportes') return 'cofrinhos:aportes'

  return dataKey
}

function buildUrlWithFilters(url, key, filters = {}, focusModule = 'dashboard') {
  const shouldApply =
    key === focusModule ||
    (focusModule === 'dashboard' && key === 'recent') ||
    (focusModule === 'cofrinhos' && ['cofrinhos', 'aportes'].includes(key)) ||
    (focusModule === 'managementDashboard' && ['usuarios', 'auditoria'].includes(key))

  if (!shouldApply) return url

  const currentFilters = filters[resolveFilterScope(key, focusModule)] || []
  if (!currentFilters.length) return url

  const params = new URLSearchParams()
  params.set('filters', JSON.stringify(currentFilters))
  const query = params.toString()
  return query ? `${url}?${query}` : url
}

export default async function loadModulesData({
  profile,
  filters,
  focusModule,
  fetchJson,
  setLoading,
  setSummary,
  setDatasets,
  setStatus,
  emptyDatasets,
}) {
  setLoading(true)

  const requests = {
    summary: '/api/dashboard/summary',
    recent: buildUrlWithFilters('/api/dashboard/recent', 'recent', filters, focusModule),
    pessoas: buildUrlWithFilters('/api/pessoas', 'pessoas', filters, focusModule),
    categorias: buildUrlWithFilters('/api/categorias', 'categorias', filters, focusModule),
    contas: buildUrlWithFilters('/api/contas-caixa', 'contas', filters, focusModule),
    financeiro: buildUrlWithFilters('/api/financeiro', 'financeiro', filters, focusModule),
    cofrinhos: buildUrlWithFilters('/api/cofrinhos', 'cofrinhos', filters, focusModule),
    aportes: buildUrlWithFilters('/api/cofrinhos/aportes', 'aportes', filters, focusModule),
  }

  if (profile === 'admin' || profile === 'root') {
    requests.usuarios = buildUrlWithFilters('/api/admin/usuarios', 'usuarios', filters, focusModule)
  }

  if (profile === 'root') {
    requests.entidades = buildUrlWithFilters('/api/root/entidades', 'entidades', filters, focusModule)
    requests.auditoria = buildUrlWithFilters('/api/root/auditoria', 'auditoria', filters, focusModule)
  }

  try {
    const entries = Object.entries(requests)
    const results = await Promise.allSettled(entries.map(([, url]) => fetchJson(url)))
    const nextData = { ...emptyDatasets }

    entries.forEach(([key], index) => {
      const result = results[index]
      if (result.status === 'fulfilled') {
        if (key === 'summary') {
          setSummary(result.value.data)
        } else {
          nextData[key] = result.value.data || []
        }
      }
    })

    setDatasets(nextData)
  } catch (error) {
    setStatus(error.message)
  } finally {
    setLoading(false)
  }
}