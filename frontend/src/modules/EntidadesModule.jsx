import TableView from '../components/TableView'

export default function EntidadesModule({
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
      onMobileCardClick={(row) => openCrudModal('entidades', 'edit', row)}
      onCreate={() => openCrudModal('entidades', 'create')}
      createLabel={config.createLabel}
      filterFields={tableFilters[config.dataKey] || []}
      filterScope="entidades"
      activeConditions={gridFilters.entidades || []}
      onConditionsChange={(conditions) => handleGridFilterChange('entidades', conditions, 'entidades')}
      headerActions={[
        {
          label: <><i className="fas fa-arrows-rotate" aria-hidden="true" /> Atualizar</>,
          onClick: () => loadModules(userPerfil, gridFilters, 'entidades'),
          className: 'btn-secondary',
        },
      ]}
      renderActions={(row) => (
        <>
          <button type="button" className="btn-warning" onClick={() => openCrudModal('entidades', 'edit', row)}>
            <>Editar <i className="fas fa-file-pen" aria-hidden="true" /></>
          </button>
          <button type="button" className="btn-danger" onClick={() => handleDelete('entidades', row)}>
            <>Excluir <i className="fas fa-trash" aria-hidden="true" /></>
          </button>
        </>
      )}
    />
  )
}
