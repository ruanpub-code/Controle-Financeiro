import TableView from '../components/TableView'

export default function PessoasModule({
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
}) {
  return (
    <TableView
      title={config.title}
      rows={rows}
      columns={config.columns}
      storageNamespace={filterStorageNamespace}
      onMobileCardClick={(row) => openCrudModal('pessoas', 'edit', row)}
      onCreate={() => openCrudModal('pessoas', 'create')}
      createLabel={config.createLabel}
      filterFields={tableFilters[config.dataKey] || []}
      filterScope="pessoas"
      activeConditions={gridFilters.pessoas || []}
      onConditionsChange={(conditions) => handleGridFilterChange('pessoas', conditions, 'pessoas')}
      headerActions={[
        {
          label: <><i className="fas fa-arrows-rotate" aria-hidden="true" /> Atualizar</>,
          onClick: () => loadModules(userPerfil, gridFilters, 'pessoas'),
          className: 'btn-secondary',
        },
      ]}
      renderActions={(row) => (
        <>
          <button type="button" className="btn-warning" onClick={() => openCrudModal('pessoas', 'edit', row)}>
            <>Editar <i className="fas fa-file-pen" aria-hidden="true" /></>
          </button>
          <button type="button" className="btn-danger" onClick={() => handleDelete('pessoas', row)}>
            <>Excluir <i className="fas fa-trash" aria-hidden="true" /></>
          </button>
        </>
      )}
    />
  )
}
