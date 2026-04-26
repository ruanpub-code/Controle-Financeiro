import TableView from '../components/TableView'

export default function CofrinhosModule({
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
      onMobileCardClick={(row) => openCrudModal('cofrinhos', 'edit', row)}
      onCreate={() => openCrudModal('cofrinhos', 'create')}
      createLabel={config.createLabel}
      filterFields={tableFilters[config.dataKey] || []}
      filterScope="cofrinhos"
      activeConditions={gridFilters.cofrinhos || []}
      onConditionsChange={(conditions) => handleGridFilterChange('cofrinhos', conditions, 'cofrinhos')}
      headerActions={[
        {
          label: <><i className="fas fa-arrows-rotate" aria-hidden="true" /> Atualizar</>,
          onClick: () => loadModules(userPerfil, gridFilters, 'cofrinhos'),
          className: 'btn-secondary',
        },
      ]}
      renderActions={(row) => (
        <>
          <button type="button" className="btn-warning" onClick={() => openCrudModal('cofrinhos', 'edit', row)}>
            <>Editar <i className="fas fa-file-pen" aria-hidden="true" /></>
          </button>
          <button type="button" className="btn-danger" onClick={() => handleDelete('cofrinhos', row)}>Arquivar</button>
        </>
      )}
    />
  )
}
