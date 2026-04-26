export function moeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor || 0))
}

export function dataBr(valor) {
  if (!valor) return '-'
  const date = new Date(valor)
  return Number.isNaN(date.getTime()) ? valor : date.toLocaleDateString('pt-BR')
}

export function resolveAuditModule(row) {
  const recurso = String(row?.recurso_tipo || '').toLowerCase()
  const rota = String(row?.rota || '').toLowerCase()

  if (recurso.includes('usuario') || rota.includes('/admin/usuarios')) return 'usuarios'
  if (recurso.includes('entidade') || rota.includes('/root/entidades')) return 'entidades'
  if (recurso.includes('categoria') || rota.includes('/categorias')) return 'categorias'
  if (recurso.includes('pessoa') || rota.includes('/pessoas')) return 'pessoas'
  if (recurso.includes('conta') || rota.includes('/contas-caixa')) return 'contas'
  if (recurso.includes('aporte') || rota.includes('/cofrinhos/aportes')) return 'aportes'
  if (recurso.includes('cofrinho') || rota.includes('/cofrinhos')) return 'cofrinhos'
  if (recurso.includes('financeiro') || rota.includes('/financeiro')) return 'financeiro'

  return 'dashboard'
}