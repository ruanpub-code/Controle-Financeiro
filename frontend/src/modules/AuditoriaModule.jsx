import TableView from '../components/TableView'

export default function AuditoriaModule({
  rows,
  filterStorageNamespace,
  tableFilters,
  gridFilters,
  userPerfil,
  loadModules,
  handleGridFilterChange,
  dataBr,
  goToModule,
  resolveAuditModule,
}) {
  return (
    <TableView
      title="Auditoria"
      rows={rows}
      storageNamespace={filterStorageNamespace}
      filterFields={tableFilters.auditoria}
      filterScope="auditoria"
      activeConditions={gridFilters.auditoria || []}
      onConditionsChange={(conditions) => handleGridFilterChange('auditoria', conditions, 'auditoria')}
      headerActions={[
        {
          label: <><i className="fas fa-arrows-rotate" aria-hidden="true" /> Atualizar</>,
          onClick: () => loadModules(userPerfil, gridFilters, 'auditoria'),
          className: 'btn-secondary',
        },
      ]}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'usuario_nome', label: 'Usuário', render: (row) => `${row.usuario_nome || '-'} (${row.usuario_perfil || '-'})` },
        { key: 'acao', label: 'Ação' },
        { key: 'recurso_tipo', label: 'Recurso' },
        { key: 'rota', label: 'Rota', render: (row) => row.rota || '-' },
        { key: 'created_at', label: 'Data', render: (row) => dataBr(row.created_at) },
      ]}
      renderActions={(row) => (
        <button type="button" className="btn-secondary" onClick={() => goToModule(resolveAuditModule(row))}>
          Abrir módulo
        </button>
      )}
    />
  )
}
