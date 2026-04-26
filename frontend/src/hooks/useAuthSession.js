import { useEffect } from 'react'

export default function useAuthSession({
  user,
  setUser,
  credentials,
  setCredentials,
  fetchJson,
  loadModules,
  setStatus,
  setLoading,
  setActiveModule,
  setSummary,
  setDatasets,
  emptyDatasets,
}) {
  useEffect(() => {
    fetchJson('/api/auth/me')
      .then((json) => {
        setUser(json.user)
        setCredentials({ nome: '', senha: '' })
        setStatus('Sessão restaurada com sucesso.')
        loadModules(json.user.perfil)
      })
      .catch(() => {
        setStatus('')
      })
  }, [])

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)

    try {
      const json = await fetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      setUser(json.user)
      setCredentials({ nome: '', senha: '' })
      setStatus(`Login realizado para ${json.user.nome}.`)
      setActiveModule('dashboard')
      await loadModules(json.user.perfil)
    } catch (error) {
      setCredentials({ nome: '', senha: '' })
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST', body: '{}' })
    } catch (_) {
      // noop
    }

    setUser(null)
    setCredentials({ nome: '', senha: '' })
    setSummary(null)
    setDatasets({ ...emptyDatasets })
    setStatus('Sessão encerrada.')
  }

  return {
    handleLogin,
    handleLogout,
  }
}
