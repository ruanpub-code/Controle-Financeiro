import { useMemo } from 'react'
import { ADMIN_MODULES, MANAGEMENT_MODULES } from '../config/appModules'

function isActiveByDateLimit(row) {
  if (typeof row?.ativo !== 'undefined') {
    return Number(row.ativo) === 1
  }

  const rawDate = row?.datalimite || row?.data_limite || row?.validade || ''
  if (!rawDate) return true

  const limitDate = new Date(rawDate)
  if (Number.isNaN(limitDate.getTime())) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  limitDate.setHours(0, 0, 0, 0)
  return limitDate >= today
}

export default function useAppDerivedState({ user, datasets }) {
  const filterStorageNamespace = useMemo(() => {
    if (!user) return 'anon'
    return `entidade-${String(user.id_entidade || 'sem-entidade')}`
  }, [user])

  const adminMenuItems = useMemo(() => {
    if (user?.perfil === 'root' || user?.perfil === 'admin') return [...ADMIN_MODULES]
    return []
  }, [user])

  const managementMenuItems = useMemo(() => {
    if (user?.perfil === 'root') return [...MANAGEMENT_MODULES]
    return []
  }, [user])

  const managementSummary = useMemo(() => {
    const totalEntidades = datasets.entidades.length
    const entidadesAtivas = datasets.entidades.filter(isActiveByDateLimit).length
    const entidadesInativas = Math.max(totalEntidades - entidadesAtivas, 0)
    const totalUsuarios = datasets.usuarios.length
    const usuariosAtivos = datasets.usuarios.filter(isActiveByDateLimit).length
    const usuariosInativos = Math.max(totalUsuarios - usuariosAtivos, 0)

    return {
      totalEntidades,
      entidadesAtivas,
      entidadesInativas,
      totalUsuarios,
      usuariosAtivos,
      usuariosInativos,
    }
  }, [datasets.entidades, datasets.usuarios])

  const dashboardExpenseData = useMemo(() => {
    const fallbackColors = ['#0f766e', '#1d4ed8', '#f59e0b', '#7c3aed', '#dc2626', '#14b8a6']
    const categoryMap = new Map(datasets.categorias.map((item) => [String(item.id), item]))
    const totalsMap = new Map()

    datasets.financeiro.forEach((row) => {
      const category = categoryMap.get(String(row.categoria_id || ''))
      const type = String(row.tipo || category?.tipo || '').toLowerCase()
      if (type && type !== 'pagar') return

      const label = row.categoria_nome || category?.nome || 'Sem categoria'
      const value = Math.abs(Number(row.valor || 0))
      if (!value) return

      const current = totalsMap.get(label) || { label, value: 0, color: row.cor || category?.cor || null }
      current.value += value
      totalsMap.set(label, current)
    })

    return Array.from(totalsMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((item, index) => ({
        ...item,
        color: item.color || fallbackColors[index % fallbackColors.length],
      }))
  }, [datasets.categorias, datasets.financeiro])

  const dashboardExpenseTotal = useMemo(
    () => dashboardExpenseData.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [dashboardExpenseData]
  )

  return {
    filterStorageNamespace,
    adminMenuItems,
    managementMenuItems,
    managementSummary,
    dashboardExpenseData,
    dashboardExpenseTotal,
  }
}