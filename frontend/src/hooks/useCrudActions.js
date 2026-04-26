import { useCallback } from 'react'

export default function useCrudActions({
  modal,
  moduleConfig,
  formState,
  user,
  fetchJson,
  setStatus,
  closeModal,
  loadModules,
  setBaixarModal,
  baixarModal,
  estornarModal,
  setEstornarModal,
  setFormState,
}) {
  const handleSubmitCrud = useCallback(async (event) => {
    event.preventDefault()
    if (!modal?.module) return

    const config = moduleConfig[modal.module]
    if (!config) {
      setStatus('Configuração inválida do módulo.')
      return
    }

    const isEdit = modal.mode === 'edit'
    const url = isEdit ? `${config.route}/${formState.id}` : config.route
    const payload = { ...formState }

    if (modal.module === 'usuarios' && user?.perfil !== 'root') {
      payload.id_entidade = user?.id_entidade
    }

    if (['financeiro', 'aportes'].includes(modal.module) && Number(payload.valor) <= 0) {
      setStatus('Informe um valor positivo maior que zero.')
      return
    }

    try {
      const json = await fetchJson(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setStatus(json.message || 'Operação realizada com sucesso.')
      closeModal()
      await loadModules(user?.perfil)
    } catch (error) {
      setStatus(error.message)
    }
  }, [closeModal, fetchJson, formState, loadModules, modal, moduleConfig, setStatus, user])

  const handleDelete = useCallback(async (module, row) => {
    const config = moduleConfig[module]
    if (!config || !row?.id) {
      setStatus('Registro inválido para exclusão.')
      return
    }

    const actionLabel = module === 'cofrinhos' ? 'arquivar' : 'excluir'

    if (!window.confirm(`Deseja ${actionLabel} este registro?`)) {
      return
    }

    try {
      const json = await fetchJson(`${config.route}/${row.id}`, { method: 'DELETE' })
      setStatus(json.message || 'Registro removido com sucesso.')
      await loadModules(user?.perfil)
    } catch (error) {
      setStatus(error.message)
    }
  }, [fetchJson, loadModules, moduleConfig, setStatus, user])

  const handleBaixa = useCallback((row) => {
    setBaixarModal({ row, dataPagamento: new Date().toISOString().slice(0, 10) })
  }, [setBaixarModal])

  const handleConfirmBaixa = useCallback(async () => {
    if (!baixarModal?.row?.id || !baixarModal?.dataPagamento) {
      setStatus('Dados inválidos para registrar baixa.')
      return
    }

    try {
      const json = await fetchJson(`/api/financeiro/${baixarModal.row.id}/baixar`, {
        method: 'POST',
        body: JSON.stringify({ data_transacao: baixarModal.dataPagamento }),
      })
      setStatus(json.message || 'Baixa registrada com sucesso.')
      setBaixarModal(null)
      await loadModules(user?.perfil)
    } catch (error) {
      setStatus(error.message)
    }
  }, [baixarModal, fetchJson, loadModules, setBaixarModal, setStatus, user])

  const handleConfirmEstorno = useCallback(async () => {
    if (!estornarModal?.id) {
      setStatus('Dados inválidos para estorno.')
      return
    }

    try {
      const json = await fetchJson(`/api/financeiro/${estornarModal.id}/estornar`, { method: 'POST' })
      setStatus(json.message || 'Estorno realizado com sucesso.')
      setEstornarModal(null)
      await loadModules(user?.perfil)
    } catch (error) {
      setStatus(error.message)
    }
  }, [estornarModal, fetchJson, loadModules, setEstornarModal, setStatus, user])

  const handleFinanceModalAction = useCallback(() => {
    if (modal?.module !== 'financeiro' || modal?.mode !== 'edit') return

    const status = String(formState.status || '').toLowerCase()
    closeModal()

    if (['pago', 'recebido'].includes(status)) {
      setEstornarModal(formState)
      return
    }

    handleBaixa(formState)
  }, [closeModal, formState, handleBaixa, modal, setEstornarModal])

  const handleChangePassword = useCallback(async (event) => {
    event.preventDefault()

    try {
      const json = await fetchJson('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(formState),
      })
      setStatus(json.message || 'Senha alterada com sucesso.')
      setFormState({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      setStatus(error.message)
    }
  }, [fetchJson, formState, setFormState, setStatus])

  return {
    handleSubmitCrud,
    handleDelete,
    handleBaixa,
    handleConfirmBaixa,
    handleConfirmEstorno,
    handleFinanceModalAction,
    handleChangePassword,
  }
}