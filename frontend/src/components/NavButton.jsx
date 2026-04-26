export default function NavButton({ module, activeModule, sidebarCollapsed, goToModule, isSubmenu = false }) {
  return (
    <button
      type="button"
      className={`${activeModule === module.id ? 'active' : ''} ${isSubmenu ? 'submenu-btn' : ''}`.trim()}
      onClick={() => goToModule(module.id)}
      title={sidebarCollapsed ? module.label : undefined}
    >
      {module.icon ? <span className="nav-icon" aria-hidden="true">{module.icon}</span> : null}
      {!sidebarCollapsed ? <span className="nav-label">{module.label}</span> : null}
    </button>
  )
}