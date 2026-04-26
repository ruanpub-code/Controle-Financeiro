import TableView from '../components/TableView'

export default function UsuariosModule({
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
      onMobileCardClick={(row) => openCrudModal('usuarios', 'edit', row)}
      onCreate={() => openCrudModal('usuarios', 'create')}
      createLabel={config.createLabel}
      filterFields={tableFilters[config.dataKey] || []}
      filterScope="usuarios"
      activeConditions={gridFilters.usuarios || []}
      onConditionsChange={(conditions) => handleGridFilterChange('usuarios', conditions, 'usuarios')}
      headerActions={[
        {
          label: <><i className="fas fa-arrows-rotate" aria-hidden="true" /> Atualizar</>,
          onClick: () => loadModules(userPerfil, gridFilters, 'usuarios'),
          className: 'btn-secondary',
        },
      ]}
      renderActions={(row) => (
        <>
          <button type="button" className="btn-warning" onClick={() => openCrudModal('usuarios', 'edit', row)}>
            <>Editar <i className="fas fa-file-pen" aria-hidden="true" /></>
          </button>
          <button type="button" className="btn-danger" onClick={() => handleDelete('usuarios', row)}>
            <>Excluir <i className="fas fa-trash" aria-hidden="true" /></>
          </button>
        </>
      )}
    />
  )
}
