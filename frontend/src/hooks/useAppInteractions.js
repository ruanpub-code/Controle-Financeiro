import { useCallback, useEffect } from 'react'

export default function useAppInteractions({
  status,
  setStatus,
  adminMenuItems,
  managementMenuItems,
  activeModule,
  setOpenMenus,
  moduleConfig,
  user,
  setFormState,
  setModal,
  setActiveModule,
  setMobileSidebarOpen,
  loadModules,
  gridFilters,
  setGridFilters,
}) {
  useEffect(() => {
    if (!status) return undefined

    const timer = window.setTimeout(() => setStatus(''), 2400)
    return () => window.clearTimeout(timer)
  }, [setStatus, status])

  useEffect(() => {
    if (adminMenuItems.some((item) => item.id === activeModule)) {
      setOpenMenus({ admin: true, gerenciamento: false })
    }

    if (managementMenuItems.some((item) => item.id === activeModule)) {
      setOpenMenus({ admin: false, gerenciamento: true })
    }
  }, [activeModule, adminMenuItems, managementMenuItems, setOpenMenus])

  const openCrudModal = useCallback((module, mode, row = null) => {
    const config = moduleConfig[module]
    const nextState = { ...config.defaults, ...(row || {}) }

    if (module === 'usuarios' && user?.perfil !== 'root') {
      nextState.id_entidade = String(user?.id_entidade || '')
    }

    setFormState(nextState)
    setModal({ type: 'crud', module, mode })
  }, [moduleConfig, setFormState, setModal, user])

  const closeModal = useCallback(() => {
    setModal(null)
    setFormState({})
  }, [setFormState, setModal])

  const isMenuActive = useCallback((items) => items.some((item) => item.id === activeModule), [activeModule])

  const goToModule = useCallback((module) => {
    setActiveModule(module)
    setMobileSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (module === 'senha') {
      setFormState({ current_password: '', new_password: '', confirm_password: '' })
    }

    if (user?.perfil) {
      void loadModules(user.perfil, gridFilters, module)
    }
  }, [gridFilters, loadModules, setActiveModule, setFormState, setMobileSidebarOpen, user])

  const handleGridFilterChange = useCallback((moduleKey, nextConditions, focusModule = activeModule) => {
    setGridFilters((prev) => {
      const nextFilters = {
        ...prev,
        [moduleKey]: nextConditions,
      }

      setStatus('Filtros aplicados.')
      void loadModules(user?.perfil, nextFilters, focusModule)
      return nextFilters
    })
  }, [activeModule, loadModules, setGridFilters, setStatus, user])

  return {
    openCrudModal,
    closeModal,
    isMenuActive,
    goToModule,
    handleGridFilterChange,
  }
}