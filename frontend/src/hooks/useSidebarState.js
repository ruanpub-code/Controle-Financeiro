import { useEffect, useState } from 'react'

export default function useSidebarState() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sidebar-collapsed') === '1'
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState({ admin: false, gerenciamento: false })

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', sidebarCollapsed)
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 900) {
        setMobileSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function toggleSidebarCollapse() {
    setSidebarCollapsed((prev) => !prev)
  }

  function toggleMenu(menuKey) {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
    }

    setOpenMenus((prev) => {
      const nextValue = !prev[menuKey]
      return {
        admin: false,
        gerenciamento: false,
        [menuKey]: nextValue,
      }
    })
  }

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    openMenus,
    setOpenMenus,
    toggleSidebarCollapse,
    toggleMenu,
  }
}
