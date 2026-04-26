import { useEffect, useState } from 'react'

function getOperatorsByType(type = 'text') {
  if (type === 'number' || type === 'date') {
    return [
      { value: 'eq', label: 'Igual' },
      { value: 'gt', label: 'Maior' },
      { value: 'lt', label: 'Menor' },
      { value: 'between', label: 'Entre' },
    ]
  }

  return [
    { value: 'like', label: 'Contém' },
    { value: 'nlike', label: 'Não contém' },
  ]
}

function formatConditionLabel(condition, fields) {
  const field = fields.find((item) => item.field === condition.field)
  const operator = getOperatorsByType(field?.type).find((item) => item.value === condition.op)
  const secondValue = condition.op === 'between' && condition.value2 ? ` e ${condition.value2}` : ''
  return `${field?.label || condition.field} · ${operator?.label || condition.op} · ${condition.value1 || ''}${secondValue}`
}

export default function TableView({
  title,
  rows,
  columns,
  emptyText = 'Nenhum registro encontrado.',
  onCreate,
  createLabel = 'Novo',
  renderActions,
  headerActions = [],
  filterFields = [],
  activeConditions = [],
  onConditionsChange = () => {},
  filterScope = title,
  mobileCardSummary,
  mobileCardColumns,
  mobileCardColumnsClassName,
  mobileCardClassName,
  compactTools = false,
  storageNamespace = 'global',
  onMobileCardClick,
}) {
  const initialField = filterFields[0]
  const storageKey = `controle-financeiro-filtros-${storageNamespace}-${filterScope}`
  const [showEditor, setShowEditor] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('')
  const [savedPresets, setSavedPresets] = useState(() => {
    if (typeof window === 'undefined') return []

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]')
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })
  const [draftCondition, setDraftCondition] = useState({
    field: initialField?.field || '',
    op: initialField?.type === 'number' || initialField?.type === 'date' ? 'eq' : 'like',
    value1: '',
    value2: '',
  })

  useEffect(() => {
    if (!filterFields.length) return

    setDraftCondition((prev) => {
      if (prev.field && filterFields.some((item) => item.field === prev.field)) {
        return prev
      }

      const nextField = filterFields[0]
      return {
        field: nextField?.field || '',
        op: nextField?.type === 'number' || nextField?.type === 'date' ? 'eq' : 'like',
        value1: '',
        value2: '',
      }
    })
  }, [filterFields])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]')
      setSavedPresets(Array.isArray(saved) ? saved : [])
    } catch {
      setSavedPresets([])
    }

    setSelectedPreset('')
  }, [storageKey])

  const selectedField = filterFields.find((item) => item.field === draftCondition.field) || initialField
  const operators = getOperatorsByType(selectedField?.type)
  const inputType = selectedField?.type === 'number' ? 'number' : selectedField?.type === 'date' ? 'date' : 'text'
  const isBetween = draftCondition.op === 'between'

  const mobileColumns = columns.filter((column) => column.key !== 'id').slice(0, 2)

  function formatMobileCardValue(row, column) {
    const rendered = column.render ? column.render(row) : row[column.key]
    if (typeof rendered === 'string' || typeof rendered === 'number') return rendered

    const raw = row[column.key]
    if (typeof raw === 'string' || typeof raw === 'number') return raw
    return '-'
  }

  function getMobileCardSummary(row) {
    if (typeof mobileCardSummary === 'function') {
      return mobileCardSummary(row)
    }

    return []
  }

  function getMobileCardColumns(row) {
    if (typeof mobileCardColumns === 'function') {
      return mobileCardColumns(row)
    }

    const [left, right] = mobileColumns
    return {
      leftLabel: left?.label || '-',
      leftValue: left ? formatMobileCardValue(row, left) : '-',
      centerLabel: '',
      centerValue: '',
      rightLabel: right?.label || '-',
      rightValue: right ? formatMobileCardValue(row, right) : '-',
    }
  }

  function resetDraft(field = filterFields[0]) {
    setDraftCondition({
      field: field?.field || '',
      op: field?.type === 'number' || field?.type === 'date' ? 'eq' : 'like',
      value1: '',
      value2: '',
    })
  }

  function handleFieldChange(value) {
    const nextField = filterFields.find((item) => item.field === value)
    setDraftCondition({
      field: value,
      op: nextField?.type === 'number' || nextField?.type === 'date' ? 'eq' : 'like',
      value1: '',
      value2: '',
    })
  }

  function addCondition() {
    if (!draftCondition.field || !draftCondition.value1) return
    if (isBetween && !draftCondition.value2) return

    const nextCondition = {
      field: draftCondition.field,
      op: draftCondition.op,
      value1: draftCondition.value1,
      value2: draftCondition.value2,
    }

    const nextConditions = editingIndex === null
      ? [...activeConditions, nextCondition]
      : activeConditions.map((condition, index) => (index === editingIndex ? nextCondition : condition))

    onConditionsChange(nextConditions)
    setShowEditor(false)
    setEditingIndex(null)
    resetDraft(selectedField || filterFields[0])
  }

  function editCondition(index) {
    const condition = activeConditions[index]
    if (!condition) return

    setDraftCondition({
      field: condition.field,
      op: condition.op,
      value1: condition.value1 || '',
      value2: condition.value2 || '',
    })
    setEditingIndex(index)
    setShowEditor(true)
  }

  function removeCondition(index) {
    setEditingIndex(null)
    onConditionsChange(activeConditions.filter((_, currentIndex) => currentIndex !== index))
  }

  function clearConditions() {
    setEditingIndex(null)
    setSelectedPreset('')
    onConditionsChange([])
  }

  function savePreset() {
    if (!activeConditions.length) return

    const name = window.prompt('Nome do filtro condicional:')?.trim()
    if (!name) return

    const nextPresets = [...savedPresets.filter((preset) => preset.name !== name), { name, conditions: activeConditions }]
    setSavedPresets(nextPresets)
    setSelectedPreset(name)
    localStorage.setItem(storageKey, JSON.stringify(nextPresets))
  }

  function applySavedPreset(name) {
    setSelectedPreset(name)
    setEditingIndex(null)

    if (!name) {
      onConditionsChange([])
      return
    }

    const preset = savedPresets.find((item) => item.name === name)
    if (preset) {
      onConditionsChange(preset.conditions || [])
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <span>{rows.length} itens</span>
        </div>
      </div>

      <div className={`table-tools-row ${compactTools ? 'compact' : ''}`.trim()}>
        <div className="toolbar-actions toolbar-actions-filters">
          {filterFields.length > 0 ? (
            <button type="button" className="btn-filter btn-filter-add filter-btn-add" onClick={() => {
              setEditingIndex(null)
              setShowEditor((prev) => !prev)
            }}>
              <><i className="fas fa-filter" aria-hidden="true" /> Filtro</>
            </button>
          ) : null}
          {filterFields.length > 0 ? (
            <button type="button" className="btn-filter btn-filter-clear filter-btn-clear" onClick={clearConditions} disabled={!activeConditions.length}>
              <><i className="fas fa-filter-circle-xmark" aria-hidden="true" /> Limpar</>
            </button>
          ) : null}
          {filterFields.length > 0 ? (
            <button type="button" className="btn-filter btn-filter-save filter-btn-save" onClick={savePreset} disabled={!activeConditions.length}>
              <><i className="fas fa-bookmark" aria-hidden="true" /> Salvar filtro</>
            </button>
          ) : null}
          {savedPresets.length > 0 ? (
            <select value={selectedPreset} className="saved-filter-select" onChange={(event) => applySavedPreset(event.target.value)}>
              <option value="">Filtros salvos</option>
              {savedPresets.map((preset) => (
                <option key={`${title}-${preset.name}`} value={preset.name}>{preset.name}</option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="toolbar-actions">
          {headerActions.map((action) => (
            <button
              key={`${title}-${action.label}`}
              type="button"
              className={action.className || 'btn-secondary'}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
          {onCreate ? <button type="button" className="btn-primary" onClick={onCreate}>{createLabel}</button> : null}
        </div>
      </div>

      {activeConditions.length > 0 ? (
        <div className="filter-condition-chips">
          {activeConditions.map((condition, index) => (
            <span key={`${title}-condition-${index}`} className="condition-chip-item">
              <button type="button" className="condition-select-chip" onClick={() => editCondition(index)}>
                {formatConditionLabel(condition, filterFields)}
              </button>
              <button type="button" className="condition-chip-remove" onClick={() => removeCondition(index)}>×</button>
            </span>
          ))}
        </div>
      ) : null}

      {showEditor && filterFields.length > 0 ? (
        <div className="filters-panel open">
          <div className="filter-condition-editor">
            <div className="filter-condition-row">
              <select value={draftCondition.field} onChange={(event) => handleFieldChange(event.target.value)}>
                {filterFields.map((field) => (
                  <option key={`${title}-${field.field}`} value={field.field}>{field.label}</option>
                ))}
              </select>

              <select value={draftCondition.op} onChange={(event) => setDraftCondition((prev) => ({ ...prev, op: event.target.value, value2: '' }))}>
                {operators.map((operator) => (
                  <option key={`${title}-${operator.value}`} value={operator.value}>{operator.label}</option>
                ))}
              </select>

              <input
                type={inputType}
                value={draftCondition.value1}
                placeholder="Valor"
                onChange={(event) => setDraftCondition((prev) => ({ ...prev, value1: event.target.value }))}
              />

              {isBetween ? (
                <input
                  type={inputType}
                  value={draftCondition.value2}
                  placeholder="Até"
                  onChange={(event) => setDraftCondition((prev) => ({ ...prev, value2: event.target.value }))}
                />
              ) : <div />}

              <button type="button" className="btn-primary" onClick={addCondition}>{editingIndex === null ? 'Aplicar' : 'Atualizar'}</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              {renderActions ? <th>Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)}>{emptyText}</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id ?? `${title}-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '-'}</td>
                  ))}
                  {renderActions ? <td className="action-cell">{renderActions(row)}</td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-records" aria-label={`${title} em cards`}>
        {rows.length === 0 ? (
          <p className="mobile-records-empty">{emptyText}</p>
        ) : (
          rows.map((row, index) => {
            const mobilePair = getMobileCardColumns(row)

            return (
              <article
                className={`mobile-record-card ${typeof mobileCardClassName === 'function' ? mobileCardClassName(row) : ''}`.trim()}
                key={`mobile-${row.id ?? `${title}-${index}`}`}
                onClick={onMobileCardClick ? () => onMobileCardClick(row) : undefined}
                onKeyDown={onMobileCardClick ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onMobileCardClick(row)
                  }
                } : undefined}
                role={onMobileCardClick ? 'button' : undefined}
                tabIndex={onMobileCardClick ? 0 : undefined}
              >
                <div className={`mobile-record-columns ${typeof mobileCardColumnsClassName === 'function' ? mobileCardColumnsClassName(row) : ''}`.trim()}>
                  <div className="mobile-record-col">
                    <span>{mobilePair.leftLabel}</span>
                    <strong>{mobilePair.leftValue ?? '-'}</strong>
                  </div>
                  {mobilePair.centerLabel || mobilePair.centerValue ? (
                    <div className="mobile-record-col">
                      <span>{mobilePair.centerLabel}</span>
                      <strong>{mobilePair.centerValue ?? '-'}</strong>
                    </div>
                  ) : null}
                  <div className="mobile-record-col">
                    <span>{mobilePair.rightLabel}</span>
                    <strong>{mobilePair.rightValue ?? '-'}</strong>
                  </div>
                </div>

                {getMobileCardSummary(row).map((item, itemIndex) => (
                  <div className="mobile-record-line" key={`${title}-mobile-line-${row.id ?? index}-${item.label ?? itemIndex}`}>
                    {item.label ? <span>{item.label}</span> : null}
                    <strong>{item.value ?? '-'}</strong>
                  </div>
                ))}
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
