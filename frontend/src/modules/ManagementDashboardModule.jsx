import TableView from '../components/TableView'

export default function ManagementDashboardModule({
  managementSummary,
  datasets,
  moduleConfig,
  filterStorageNamespace,
  tableFilters,
  gridFilters,
  handleGridFilterChange,
  goToModule,
  dataBr,
}) {
  return (
    <div className="stack-panels">
      <section className="cards-grid management-cards-grid management-summary-cards">
        <article className="metric-card teal">
          <span>Total de Entidades</span>
          <strong>{managementSummary.totalEntidades}</strong>
        </article>
        <article className="metric-card green">
          <span>Entidades Ativas</span>
          <strong>{managementSummary.entidadesAtivas}</strong>
        </article>
        <article className="metric-card red">
          <span>Entidades Inativas</span>
          <strong>{managementSummary.entidadesInativas}</strong>
        </article>
        <article className="metric-card blue">
          <span>Total de Usuários</span>
          <strong>{managementSummary.totalUsuarios}</strong>
        </article>
        <article className="metric-card green">
          <span>Usuários Ativos</span>
          <strong>{managementSummary.usuariosAtivos}</strong>
        </article>
        <article className="metric-card red">
          <span>Usuários Inativos</span>
          <strong>{managementSummary.usuariosInativos}</strong>
        </article>
      </section>

      <TableView
        title="Admin"
        rows={datasets.usuarios}
        storageNamespace={filterStorageNamespace}
        mobileCardSummary={() => []}
        columns={moduleConfig.usuarios.columns}
        emptyText="Nenhum usuário encontrado."
        filterFields={tableFilters.usuarios}
        filterScope="managementDashboard:usuarios"
        activeConditions={gridFilters['managementDashboard:usuarios'] || []}
        onConditionsChange={(conditions) => handleGridFilterChange('managementDashboard:usuarios', conditions, 'managementDashboard')}
        headerActions={[
          { label: <><i className="fas fa-arrow-right-from-bracket" aria-hidden="true" /> Abrir Admin</>, onClick: () => goToModule('usuarios'), className: 'btn-primary' },
        ]}
      />

      <TableView
        title="Auditoria recente"
        rows={datasets.auditoria.slice(0, 10)}
        storageNamespace={filterStorageNamespace}
        mobileCardSummary={() => []}
        filterFields={tableFilters.auditoria}
        filterScope="managementDashboard:auditoria"
        activeConditions={gridFilters['managementDashboard:auditoria'] || []}
        onConditionsChange={(conditions) => handleGridFilterChange('managementDashboard:auditoria', conditions, 'managementDashboard')}
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'usuario_nome', label: 'Usuário', render: (row) => `${row.usuario_nome || '-'} (${row.usuario_perfil || '-'})` },
          { key: 'acao', label: 'Ação' },
          { key: 'recurso_tipo', label: 'Recurso' },
          { key: 'created_at', label: 'Data', render: (row) => dataBr(row.created_at) },
        ]}
        headerActions={[
          { label: <><i className="fas fa-arrow-right-from-bracket" aria-hidden="true" /> Abrir Auditoria</>, onClick: () => goToModule('auditoria'), className: 'btn-secondary' },
        ]}
      />
    </div>
  )
}
