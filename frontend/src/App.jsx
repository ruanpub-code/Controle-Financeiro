import { useCallback, useMemo, useState } from 'react'
import AppModals from './components/AppModals'
import { EMPTY_DATASETS, MAIN_MODULES } from './config/appModules'
import createModuleConfig from './config/createModuleConfig'
import TABLE_FILTERS from './config/tableFilters'
import LoginScreen from './components/LoginScreen'
import AppShell from './components/AppShell'
import Toast from './components/Toast'
import DashboardModule from './modules/DashboardModule'
import createModuleViews from './modules/createModuleViews'
import useCrudActions from './hooks/useCrudActions'
import useAppDerivedState from './hooks/useAppDerivedState'
import useAppInteractions from './hooks/useAppInteractions'
import useSidebarState from './hooks/useSidebarState'
import useAuthSession from './hooks/useAuthSession'
import fetchJson from './services/fetchJson'
import loadModulesData from './services/moduleLoader'
import { dataBr, moeda, resolveAuditModule } from './utils/formatters'
import useTheme from './hooks/useTheme'

export default function App() {
  const [user, setUser] = useState(null)
  const [activeModule, setActiveModule] = useState('dashboard')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState({ nome: '', senha: '' })
  const [summary, setSummary] = useState(null)
  const [datasets, setDatasets] = useState(EMPTY_DATASETS)
  const [modal, setModal] = useState(null)
  const [baixarModal, setBaixarModal] = useState(null)
  const [estornarModal, setEstornarModal] = useState(null)
  const [formState, setFormState] = useState({})
  const [gridFilters, setGridFilters] = useState({})
  const { theme, toggleTheme } = useTheme()
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    openMenus,
    setOpenMenus,
    toggleSidebarCollapse,
    toggleMenu,
  } = useSidebarState()

  const {
    filterStorageNamespace,
    adminMenuItems,
    managementMenuItems,
    managementSummary,
    dashboardExpenseData,
    dashboardExpenseTotal,
  } = useAppDerivedState({ user, datasets })

  const tableFilters = TABLE_FILTERS

  const moduleConfig = useMemo(() => createModuleConfig({ datasets, user, moeda, dataBr }), [datasets, user])

  const loadModules = useCallback((profile = user?.perfil, filters = gridFilters, focusModule = activeModule) => (
    loadModulesData({
      profile,
      filters,
      focusModule,
      fetchJson,
      setLoading,
      setSummary,
      setDatasets,
      setStatus,
      emptyDatasets: EMPTY_DATASETS,
    })
  ), [activeModule, gridFilters, user?.perfil])

  const { handleLogin, handleLogout } = useAuthSession({
    user,
    setUser,
    credentials,
    setCredentials,
    fetchJson,
    loadModules,
    setStatus,
    setLoading,
    setActiveModule,
    setSummary,
    setDatasets,
    emptyDatasets: EMPTY_DATASETS,
  })

  const {
    openCrudModal,
    closeModal,
    isMenuActive,
    goToModule,
    handleGridFilterChange,
  } = useAppInteractions({
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
  })

  const {
    handleSubmitCrud,
    handleDelete,
    handleBaixa,
    handleConfirmBaixa,
    handleConfirmEstorno,
    handleFinanceModalAction,
    handleChangePassword,
  } = useCrudActions({
    modal,
    moduleConfig,
    formState,
    user,
    fetchJson,
    setStatus,
    closeModal,
    loadModules,
    setBaixarModal,
    baixarModal,
    estornarModal,
    setEstornarModal,
    setFormState,
  })

  const moduleViews = createModuleViews({
    moduleConfig,
    datasets,
    filterStorageNamespace,
    tableFilters,
    gridFilters,
    userPerfil: user?.perfil,
    loadModules,
    handleGridFilterChange,
    openCrudModal,
    handleDelete,
    moeda,
    setEstornarModal,
    handleBaixa,
    managementSummary,
    goToModule,
    dataBr,
    resolveAuditModule,
    formState,
    setFormState,
    handleChangePassword,
  })

  if (!user) {
    return (
      <>
        <Toast message={status} />
        <LoginScreen
          status={status}
          theme={theme}
          toggleTheme={toggleTheme}
          handleLogin={handleLogin}
          credentials={credentials}
          setCredentials={setCredentials}
          loading={loading}
        />
      </>
    )
  }

  return (
    <>
      <Toast message={status} />
      <AppShell
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebarCollapse={toggleSidebarCollapse}
        activeModule={activeModule}
        user={user}
        toggleTheme={toggleTheme}
        theme={theme}
        goToModule={goToModule}
        handleLogout={handleLogout}
        mainModules={MAIN_MODULES}
        adminMenuItems={adminMenuItems}
        managementMenuItems={managementMenuItems}
        openMenus={openMenus}
        toggleMenu={toggleMenu}
        isMenuActive={isMenuActive}
      >
          {activeModule === 'dashboard' ? (
            <DashboardModule
              summary={summary}
              dashboardExpenseData={dashboardExpenseData}
              dashboardExpenseTotal={dashboardExpenseTotal}
              datasets={datasets}
              filterStorageNamespace={filterStorageNamespace}
              tableFilters={tableFilters}
              gridFilters={gridFilters}
              moeda={moeda}
              dataBr={dataBr}
              userPerfil={user?.perfil}
              loadModules={loadModules}
              handleGridFilterChange={handleGridFilterChange}
              goToModule={goToModule}
            />
          ) : (
            moduleViews[activeModule]
          )}
      </AppShell>

      <AppModals
        baixarModal={baixarModal}
        setBaixarModal={setBaixarModal}
        handleConfirmBaixa={handleConfirmBaixa}
        estornarModal={estornarModal}
        setEstornarModal={setEstornarModal}
        handleConfirmEstorno={handleConfirmEstorno}
        modal={modal}
        moduleConfig={moduleConfig}
        closeModal={closeModal}
        handleSubmitCrud={handleSubmitCrud}
        formState={formState}
        setFormState={setFormState}
        handleFinanceModalAction={handleFinanceModalAction}
        fetchJson={fetchJson}
        loadModules={loadModules}
        user={user}
        setStatus={setStatus}
      />
    </>
  )
}
