import AportesModule from './AportesModule'
import AuditoriaModule from './AuditoriaModule'
import CategoriasModule from './CategoriasModule'
import ChangePasswordModule from './ChangePasswordModule'
import CofrinhosAportesModule from './CofrinhosAportesModule'
import ContasModule from './ContasModule'
import EntidadesModule from './EntidadesModule'
import FinanceiroModule from './FinanceiroModule'
import ManagementDashboardModule from './ManagementDashboardModule'
import PessoasModule from './PessoasModule'
import UsuariosModule from './UsuariosModule'

export default function createModuleViews({
  moduleConfig,
  datasets,
  filterStorageNamespace,
  tableFilters,
  gridFilters,
  userPerfil,
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
}) {
  return {
    pessoas: (
      <PessoasModule
        config={moduleConfig.pessoas}
        rows={datasets.pessoas}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        userPerfil={userPerfil}
        loadModules={loadModules}
        handleGridFilterChange={handleGridFilterChange}
        openCrudModal={openCrudModal}
        handleDelete={handleDelete}
      />
    ),
    categorias: (
      <CategoriasModule
        config={moduleConfig.categorias}
        rows={datasets.categorias}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        userPerfil={userPerfil}
        loadModules={loadModules}
        handleGridFilterChange={handleGridFilterChange}
        openCrudModal={openCrudModal}
        handleDelete={handleDelete}
      />
    ),
    contas: (
      <ContasModule
        config={moduleConfig.contas}
        rows={datasets.contas}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        userPerfil={userPerfil}
        loadModules={loadModules}
        handleGridFilterChange={handleGridFilterChange}
        openCrudModal={openCrudModal}
        handleDelete={handleDelete}
      />
    ),
    financeiro: (
      <FinanceiroModule
        config={moduleConfig.financeiro}
        rows={datasets.financeiro}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        moeda={moeda}
        userPerfil={userPerfil}
        loadModules={loadModules}
        handleGridFilterChange={handleGridFilterChange}
        openCrudModal={openCrudModal}
        setEstornarModal={setEstornarModal}
        handleDelete={handleDelete}
        handleBaixa={handleBaixa}
      />
    ),
    cofrinhos: (
      <CofrinhosAportesModule
        cofrinhosConfig={moduleConfig.cofrinhos}
        cofrinhosRows={datasets.cofrinhos}
        aportesConfig={moduleConfig.aportes}
        aportesRows={datasets.aportes}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        userPerfil={userPerfil}
        loadModules={loadModules}
        handleGridFilterChange={handleGridFilterChange}
        openCrudModal={openCrudModal}
        handleDelete={handleDelete}
      />
    ),
    aportes: (
      <AportesModule
        config={moduleConfig.aportes}
        rows={datasets.aportes}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        userPerfil={userPerfil}
        loadModules={loadModules}
        handleGridFilterChange={handleGridFilterChange}
        openCrudModal={openCrudModal}
        handleDelete={handleDelete}
      />
    ),
    managementDashboard: (
      <ManagementDashboardModule
        managementSummary={managementSummary}
        datasets={datasets}
        moduleConfig={moduleConfig}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        handleGridFilterChange={handleGridFilterChange}
        goToModule={goToModule}
        dataBr={dataBr}
      />
    ),
    usuarios: (
      <UsuariosModule
        config={moduleConfig.usuarios}
        rows={datasets.usuarios}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        userPerfil={userPerfil}
        loadModules={loadModules}
        handleGridFilterChange={handleGridFilterChange}
        openCrudModal={openCrudModal}
        handleDelete={handleDelete}
      />
    ),
    entidades: (
      <EntidadesModule
        config={moduleConfig.entidades}
        rows={datasets.entidades}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        userPerfil={userPerfil}
        loadModules={loadModules}
        handleGridFilterChange={handleGridFilterChange}
        openCrudModal={openCrudModal}
        handleDelete={handleDelete}
      />
    ),
    auditoria: (
      <AuditoriaModule
        rows={datasets.auditoria}
        filterStorageNamespace={filterStorageNamespace}
        tableFilters={tableFilters}
        gridFilters={gridFilters}
        userPerfil={userPerfil}
        loadModules={loadModules}
        handleGridFilterChange={handleGridFilterChange}
        dataBr={dataBr}
        goToModule={goToModule}
        resolveAuditModule={resolveAuditModule}
      />
    ),
    senha: (
      <ChangePasswordModule
        formState={formState}
        setFormState={setFormState}
        handleChangePassword={handleChangePassword}
      />
    ),
  }
}