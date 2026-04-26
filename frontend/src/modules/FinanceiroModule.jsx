import TableView from '../components/TableView'

export default function FinanceiroModule({
  config,
  rows,
  filterStorageNamespace,
  tableFilters,
  gridFilters,
  moeda,
  userPerfil,
  loadModules,
  handleGridFilterChange,
  openCrudModal,
  setEstornarModal,
  handleDelete,
  handleBaixa,
}) {
  return (
    <TableView
      title={config.title}
      rows={rows}
      columns={config.columns}
      storageNamespace={filterStorageNamespace}
      compactTools
      mobileCardColumns={(row) => ({
        leftLabel: 'Valor',
        leftValue: moeda(row.valor),
        centerLabel: 'Pessoa',
        centerValue: row.pessoa_nome || '-',
        rightLabel: 'Status',
        rightValue: row.status || '-',
      })}
      mobileCardColumnsClassName={() => 'mobile-record-columns-financeiro'}
      mobileCardSummary={() => []}
      mobileCardClassName={(row) => {
        const tipo = String(row.tipo || '').toLowerCase()
        if (tipo === 'pagar') return 'mobile-record-card-pagar mobile-record-card-single'
        if (tipo === 'receber') return 'mobile-record-card-receber mobile-record-card-single'
        return 'mobile-record-card-single'
      }}
      onMobileCardClick={(row) => openCrudModal('financeiro', 'edit', row)}
      onCreate={() => openCrudModal('financeiro', 'create')}
      createLabel={config.createLabel}
      filterFields={tableFilters[config.dataKey] || []}
      filterScope="financeiro"
      activeConditions={gridFilters.financeiro || []}
      onConditionsChange={(conditions) => handleGridFilterChange('financeiro', conditions, 'financeiro')}
      headerActions={[
        {
          label: <><i className="fas fa-arrows-rotate" aria-hidden="true" /> Atualizar</>,
          onClick: () => loadModules(userPerfil, gridFilters, 'financeiro'),
          className: 'btn-secondary',
        },
      ]}
      renderActions={(row) => {
        const isPaid = ['pago', 'recebido'].includes(String(row.status || '').toLowerCase())

        return (
          <>
            <button type="button" className="btn-warning" onClick={() => openCrudModal('financeiro', 'edit', row)}>
              <>Editar <i className="fas fa-file-pen" aria-hidden="true" /></>
            </button>
            {row.status === 'pendente' ? (
              <button type="button" className="btn-success" onClick={() => handleBaixa(row)}>
                Registrar <i className="fas fa-money-bill-transfer" aria-hidden="true" />
              </button>
            ) : null}
            {isPaid ? (
              <button type="button" className="btn-estorno" onClick={() => setEstornarModal(row)}>
                Estornar <i className="fas fa-money-bill-transfer" aria-hidden="true" />
              </button>
            ) : null}
            {!isPaid ? (
              <button type="button" className="btn-danger" onClick={() => handleDelete('financeiro', row)}>
                <>Excluir <i className="fas fa-trash" aria-hidden="true" /></>
              </button>
            ) : null}
          </>
        )
      }}
    />
  )
}
