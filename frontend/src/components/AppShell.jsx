import NavButton from './NavButton'

export default function AppShell({
  mobileSidebarOpen,
  setMobileSidebarOpen,
  sidebarCollapsed,
  toggleSidebarCollapse,
  activeModule,
  user,
  toggleTheme,
  theme,
  goToModule,
  handleLogout,
  mainModules,
  adminMenuItems,
  managementMenuItems,
  openMenus,
  toggleMenu,
  isMenuActive,
  children,
}) {
  return (
    <>
      <button
        type="button"
        className="mobile-sidebar-toggle"
        onClick={() => setMobileSidebarOpen((prev) => !prev)}
        aria-label={mobileSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
        title={mobileSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <button
        type="button"
        className={`mobile-sidebar-backdrop ${mobileSidebarOpen ? 'open' : ''}`.trim()}
        onClick={() => setMobileSidebarOpen(false)}
        aria-label="Fechar menu"
      />
      <div className={`spa-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <aside className={`spa-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`.trim()}>
          <div className="sidebar-top">
            <div>
              <div className="sidebar-title-row">
                <h2>{sidebarCollapsed ? 'CF' : 'Controle Financeiro'}</h2>
                <button
                  type="button"
                  className="sidebar-collapse-btn"
                  onClick={toggleSidebarCollapse}
                  aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
                  title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
                >
                  {sidebarCollapsed ? '»' : '«'}
                </button>
              </div>
              {!sidebarCollapsed ? <p className="sidebar-user">{user.nome} · {user.perfil}</p> : null}
            </div>

            {!sidebarCollapsed ? (
              <div className="sidebar-quick-actions">
                <button
                  type="button"
                  className="sidebar-header-btn"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Ativar light mode' : 'Ativar dark mode'}
                  title={theme === 'dark' ? 'Ativar light mode' : 'Ativar dark mode'}
                >
                  <span aria-hidden="true">{theme === 'dark' ? '☀' : '🌙'}</span>
                </button>

                <button
                  type="button"
                  className="sidebar-header-btn"
                  onClick={() => goToModule('senha')}
                  aria-label="Trocar senha"
                  title="Trocar senha"
                >
                  <span aria-hidden="true">🔑</span>
                </button>

                <button
                  type="button"
                  className="sidebar-header-btn danger"
                  onClick={handleLogout}
                  aria-label="Sair"
                  title="Sair"
                >
                  <span aria-hidden="true">⎋</span>
                </button>
              </div>
            ) : null}
          </div>

          <nav className="spa-nav" aria-label="Menu principal">
            {mainModules.map((module) => (
              <NavButton
                key={module.id}
                module={module}
                activeModule={activeModule}
                sidebarCollapsed={sidebarCollapsed}
                goToModule={goToModule}
              />
            ))}

            {adminMenuItems.length > 0 ? (
              <div className={`nav-group ${openMenus.admin ? 'open' : ''}`}>
                <button
                  type="button"
                  className={`nav-group-trigger ${isMenuActive(adminMenuItems) ? 'active' : ''}`}
                  onClick={() => toggleMenu('admin')}
                  aria-expanded={openMenus.admin}
                >
                  <span className="nav-group-trigger-content">
                    {!sidebarCollapsed ? (
                      <span className="nav-label"><i className="fas fa-sliders" aria-hidden="true" /> Admin</span>
                    ) : null}
                  </span>
                  {!sidebarCollapsed ? <span className="submenu-indicator">{openMenus.admin ? '▾' : '▸'}</span> : null}
                </button>

                {!sidebarCollapsed && openMenus.admin ? (
                  <div className="nav-submenu">
                    {adminMenuItems.map((module) => (
                      <NavButton
                        key={module.id}
                        module={module}
                        activeModule={activeModule}
                        sidebarCollapsed={sidebarCollapsed}
                        goToModule={goToModule}
                        isSubmenu
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {managementMenuItems.length > 0 ? (
              <div className={`nav-group ${openMenus.gerenciamento ? 'open' : ''}`}>
                <button
                  type="button"
                  className={`nav-group-trigger ${isMenuActive(managementMenuItems) ? 'active' : ''}`}
                  onClick={() => toggleMenu('gerenciamento')}
                  aria-expanded={openMenus.gerenciamento}
                >
                  <span className="nav-group-trigger-content">
                    <span className="nav-icon" aria-hidden="true">⚙</span>
                    {!sidebarCollapsed ? <span className="nav-label">Gerenciamento</span> : null}
                  </span>
                  {!sidebarCollapsed ? <span className="submenu-indicator">{openMenus.gerenciamento ? '▾' : '▸'}</span> : null}
                </button>

                {!sidebarCollapsed && openMenus.gerenciamento ? (
                  <div className="nav-submenu">
                    {managementMenuItems.map((module) => (
                      <NavButton
                        key={module.id}
                        module={module}
                        activeModule={activeModule}
                        sidebarCollapsed={sidebarCollapsed}
                        goToModule={goToModule}
                        isSubmenu
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </nav>
        </aside>

        <main className="spa-content">{children}</main>
      </div>
    </>
  )
}
