import TableView from '../components/TableView'

export default function AportesModule({
  config,
  rows,
  filterStorageNamespace,
  tableFilters,
  gridFilters,
  userPerfil,
  loadModules,
  handleGridFilterChange,
  openCrudModal,
  handleDelete,
  filterScope = 'aportes',
  focusModule = 'aportes',
}) {
  return (
    <TableView
      title={config.title}
      rows={rows}
      columns={config.columns}
      storageNamespace={filterStorageNamespace}
      onMobileCardClick={(row) => openCrudModal('aportes', 'edit', row)}
      onCreate={() => openCrudModal('aportes', 'create')}
      createLabel={config.createLabel}
      filterFields={tableFilters[config.dataKey] || []}
      filterScope={filterScope}
      activeConditions={gridFilters[filterScope] || []}
      onConditionsChange={(conditions) => handleGridFilterChange(filterScope, conditions, focusModule)}
      headerActions={[
        {
          label: <><i className="fas fa-arrows-rotate" aria-hidden="true" /> Atualizar</>,
          onClick: () => loadModules(userPerfil, gridFilters, focusModule),
          className: 'btn-secondary',
        },
      ]}
      renderActions={(row) => (
        <>
          <button type="button" className="btn-warning" onClick={() => openCrudModal('aportes', 'edit', row)}>
            <>Editar <i className="fas fa-file-pen" aria-hidden="true" /></>
          </button>
          <button type="button" className="btn-danger" onClick={() => handleDelete('aportes', row)}>
            <>Excluir <i className="fas fa-trash" aria-hidden="true" /></>
          </button>
        </>
      )}
    />
  )
}
