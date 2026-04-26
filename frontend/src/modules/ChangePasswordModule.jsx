export default function ChangePasswordModule({ formState, setFormState, handleChangePassword }) {
  return (
    <section className="panel form-panel">
      <div className="panel-header">
        <div>
          <h2>Alterar Minha Senha</h2>
          <span>Mantenha a conta protegida.</span>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleChangePassword} autoComplete="off">
        <label>
          <span>Senha atual</span>
          <input
            type="password"
            value={formState.current_password || ''}
            onChange={(event) => setFormState((prev) => ({ ...prev, current_password: event.target.value }))}
            autoComplete="off"
            required
          />
        </label>
        <label>
          <span>Nova senha</span>
          <input
            type="password"
            value={formState.new_password || ''}
            onChange={(event) => setFormState((prev) => ({ ...prev, new_password: event.target.value }))}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          <span>Confirmar nova senha</span>
          <input
            type="password"
            value={formState.confirm_password || ''}
            onChange={(event) => setFormState((prev) => ({ ...prev, confirm_password: event.target.value }))}
            autoComplete="new-password"
            required
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">Atualizar senha</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setFormState({ current_password: '', new_password: '', confirm_password: '' })}
          >
            Limpar
          </button>
        </div>
      </form>
    </section>
  )
}