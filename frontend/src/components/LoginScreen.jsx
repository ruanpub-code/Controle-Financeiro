export default function LoginScreen({
  status,
  theme,
  toggleTheme,
  handleLogin,
  credentials,
  setCredentials,
  loading,
}) {
  return (
    <>
      <div className="login-shell">
        <section className="login-card">
          <div className="login-card-top">
            <div>
              <h1>Controle Financeiro</h1>
              <p className="subtitle">
                Faça login para acessar os módulos do sistema.
              </p>
            </div>
            <button
              type="button"
              className="login-theme-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ativar light mode' : 'Ativar dark mode'}
              title={theme === 'dark' ? 'Ativar light mode' : 'Ativar dark mode'}
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀' : '🌙'}</span>
            </button>
          </div>

          <form className="login-form" onSubmit={handleLogin} autoComplete="off">
            <label>
              Usuário
              <input
                value={credentials.nome}
                onChange={(event) => setCredentials((prev) => ({ ...prev, nome: event.target.value }))}
                placeholder="Digite seu usuário"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={credentials.senha}
                onChange={(event) => setCredentials((prev) => ({ ...prev, senha: event.target.value }))}
                placeholder="Digite sua senha"
                autoComplete="new-password"
                required
              />
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setCredentials({ nome: '', senha: '' })}><><i className="fas fa-ban" aria-hidden="true" /> Cancelar</></button>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Entrando...' : <><i className="fas fa-arrow-right-from-bracket" aria-hidden="true" /> Entrar</>}</button>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
