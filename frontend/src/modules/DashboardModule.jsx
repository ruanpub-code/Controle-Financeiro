import TableView from '../components/TableView'

function buildDonutGradient(items) {
  if (!items.length) {
    return 'conic-gradient(rgba(21, 94, 117, 0.22) 0deg 360deg)'
  }

  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0)
  if (total <= 0) {
    return 'conic-gradient(rgba(21, 94, 117, 0.22) 0deg 360deg)'
  }

  let current = 0
  const segments = items.map((item) => {
    const start = current
    const angle = (Number(item.value || 0) / total) * 360
    current += angle
    return `${item.color} ${start}deg ${current}deg`
  })

  return `conic-gradient(${segments.join(', ')})`
}

function DoughnutChart({ items, total, moeda }) {
  if (!items.length || total <= 0) {
    return <div className="chart-empty-state">Nenhum dado disponível para exibir no gráfico.</div>
  }

  return (
    <div className="chart-panel-content">
      <div className="chart-donut" style={{ background: buildDonutGradient(items) }}>
        <div className="chart-donut-center">
          <strong>{moeda(total)}</strong>
          <span>Total</span>
        </div>
      </div>

      <div className="chart-legend-list">
        {items.map((item) => (
          <div key={item.label} className="chart-legend-item">
            <span className="chart-legend-color" style={{ background: item.color }} />
            <div>
              <strong>{item.label}</strong>
              <small>{moeda(item.value)}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardModule({
  summary,
  dashboardExpenseData,
  dashboardExpenseTotal,
  datasets,
  filterStorageNamespace,
  tableFilters,
  gridFilters,
  moeda,
  dataBr,
  userPerfil,
  loadModules,
  handleGridFilterChange,
  goToModule,
}) {
  return (
    <>
      <section className="cards-grid dashboard-summary-cards">
        <article className="metric-card red">
          <span>Total a Pagar</span>
          <strong>{moeda(summary?.totalPagar)}</strong>
        </article>
        <article className="metric-card green">
          <span>Total a Receber</span>
          <strong>{moeda(summary?.totalReceber)}</strong>
        </article>
        <article className="metric-card teal">
          <span>Saldo Total</span>
          <strong>{moeda(summary?.saldoTotal)}</strong>
        </article>
        <article className="metric-card blue">
          <span>Projeção Final</span>
          <strong>{moeda(summary?.projecaoFinal)}</strong>
        </article>
      </section>

      <section className="panel chart-panel">
        <div className="panel-header">
          <div>
            <h2>Top Receitas com Maiores Gastos</h2>
            <span>Total analisado: {moeda(dashboardExpenseTotal)}</span>
          </div>
        </div>
        <DoughnutChart items={dashboardExpenseData} total={dashboardExpenseTotal} moeda={moeda} />
      </section>

      <TableView
        title="Últimos lançamentos"
        rows={datasets.recent}
        storageNamespace={filterStorageNamespace}
        mobileCardSummary={() => []}
        filterFields={tableFilters.recent}
        filterScope="dashboard:recent"
        activeConditions={gridFilters['dashboard:recent'] || []}
        onConditionsChange={(conditions) => handleGridFilterChange('dashboard:recent', conditions, 'dashboard')}
        headerActions={[
          { label: <><i className="fas fa-arrows-rotate" aria-hidden="true" /> Atualizar</>, onClick: () => loadModules(userPerfil, gridFilters, 'dashboard'), className: 'btn-secondary' },
          { label: <><i className="fas fa-arrow-right-from-bracket" aria-hidden="true" /> Abrir Financeiro</>, onClick: () => goToModule('financeiro'), className: 'btn-primary' },
        ]}
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'status', label: 'Status' },
          { key: 'pessoa_nome', label: 'Pessoa', render: (row) => row.pessoa_nome || '-' },
          { key: 'categoria_nome', label: 'Categoria', render: (row) => row.categoria_nome || '-' },
          { key: 'valor', label: 'Valor', render: (row) => moeda(row.valor) },
          { key: 'data_vencimento', label: 'Vencimento', render: (row) => dataBr(row.data_vencimento) },
        ]}
        renderActions={null}
      />
    </>
  )
}
