export default function CrudField({ field, formState, setFormState, onQuickAdd }) {
  const value = formState[field.name] ?? ''

  if (field.type === 'select') {
    const selectEl = (
      <select
        value={value}
        onChange={(event) => setFormState((prev) => ({ ...prev, [field.name]: event.target.value }))}
        required={field.required}
      >
        <option value="">Selecione...</option>
        {(field.options || []).map((option) => (
          <option key={`${field.name}-${option.value}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    )

    if (field.quickAdd && onQuickAdd) {
      return (
        <div className="field-quick-add">
          {selectEl}
          <button
            type="button"
            className="btn-quick-add"
            onClick={() => onQuickAdd(field.quickAdd, field.name)}
            title="Cadastrar novo"
          >
            <i className="fas fa-plus" aria-hidden="true" />
          </button>
        </div>
      )
    }

    return selectEl
  }

  return (
    <input
      type={field.type || 'text'}
      value={value}
      required={field.required}
      autoComplete={field.type === 'password' ? 'new-password' : undefined}
      min={field.min}
      step={field.step}
      onChange={(event) => {
        const nextValue = event.target.value
        if (field.type === 'number' && nextValue !== '' && Number(nextValue) < 0) {
          return
        }
        setFormState((prev) => ({ ...prev, [field.name]: nextValue }))
      }}
    />
  )
}