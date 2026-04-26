import { useState } from 'react'
import Modal from './Modal'
import CrudField from './CrudField'

export default function AppModals({
  baixarModal,
  setBaixarModal,
  handleConfirmBaixa,
  estornarModal,
  setEstornarModal,
  handleConfirmEstorno,
  modal,
  moduleConfig,
  closeModal,
  handleSubmitCrud,
  formState,
  setFormState,
  handleFinanceModalAction,
  fetchJson,
  loadModules,
  user,
  setStatus,
}) {
  const [quickAdd, setQuickAdd] = useState(null)
  const [quickAddForm, setQuickAddForm] = useState({})

  const handleOpenQuickAdd = (module, fieldName) => {
    const config = moduleConfig[module]
    if (!config) return
    setQuickAddForm({ ...config.defaults })
    setQuickAdd({ module, fieldName })
  }

  const handleCloseQuickAdd = () => {
    setQuickAdd(null)
    setQuickAddForm({})
  }

  const handleSubmitQuickAdd = async (event) => {
    event.preventDefault()
    if (!quickAdd) return
    const config = moduleConfig[quickAdd.module]
    try {
      const json = await fetchJson(config.route, {
        method: 'POST',
        body: JSON.stringify(quickAddForm),
      })
      if (json.id) {
        setFormState((prev) => ({ ...prev, [quickAdd.fieldName]: String(json.id) }))
      }
      await loadModules(user?.perfil)
      handleCloseQuickAdd()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const isFinanceiroModal = modal?.type === 'crud' && modal?.module === 'financeiro'

  return (
    <>
      <Modal
        open={!!baixarModal}
        title="Confirmar Baixa"
        onClose={() => setBaixarModal(null)}
      >
        {baixarModal ? (
          <div className="form-grid">
            <label>
              <span>Data de pagamento</span>
              <input
                type="date"
                value={baixarModal.dataPagamento}
                onChange={(e) => setBaixarModal((prev) => ({ ...prev, dataPagamento: e.target.value }))}
              />
            </label>
            <div className="form-actions">
              <button type="button" className="btn-success" onClick={handleConfirmBaixa}>Confirmar</button>
              <button type="button" className="btn-secondary" onClick={() => setBaixarModal(null)}>Cancelar</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!estornarModal}
        title="Confirmar Estorno"
        onClose={() => setEstornarModal(null)}
      >
        {estornarModal ? (
          <div className="form-grid">
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Deseja estornar o lançamento <strong>#{estornarModal.id}</strong>? O registro será marcado como <strong>pendente</strong> e a data de pagamento será removida.</p>
            <div className="form-actions">
              <button type="button" className="btn-danger" onClick={handleConfirmEstorno}>Confirmar Estorno</button>
              <button type="button" className="btn-secondary" onClick={() => setEstornarModal(null)}>Cancelar</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={modal?.type === 'crud'}
        title={modal ? `${modal.mode === 'edit' ? 'Editar' : 'Novo'} ${moduleConfig[modal.module]?.title || ''}` : ''}
        onClose={closeModal}
      >
        {modal?.type === 'crud' ? (
          <form className="form-grid" onSubmit={handleSubmitCrud}>
            {moduleConfig[modal.module]?.fields.map((field) => (
              <label key={field.name}>
                <span>{field.label}</span>
                <CrudField
                  field={field}
                  formState={formState}
                  setFormState={setFormState}
                  onQuickAdd={isFinanceiroModal ? handleOpenQuickAdd : undefined}
                />
              </label>
            ))}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
              {modal.module === 'financeiro' && modal.mode === 'edit' ? (
                <button
                  type="button"
                  className={['pago', 'recebido'].includes(String(formState.status || '').toLowerCase()) ? 'btn-estorno' : 'btn-success'}
                  onClick={handleFinanceModalAction}
                >
                  {['pago', 'recebido'].includes(String(formState.status || '').toLowerCase()) ? 'Estornar' : 'Baixar'}
                </button>
              ) : null}
              <button type="submit" className="btn-primary">Salvar</button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={!!quickAdd}
        title={quickAdd ? `Novo(a) ${moduleConfig[quickAdd.module]?.title || ''}` : ''}
        onClose={handleCloseQuickAdd}
      >
        {quickAdd ? (
          <form className="form-grid" onSubmit={handleSubmitQuickAdd}>
            {moduleConfig[quickAdd.module]?.fields.map((field) => (
              <label key={field.name}>
                <span>{field.label}</span>
                <CrudField field={field} formState={quickAddForm} setFormState={setQuickAddForm} />
              </label>
            ))}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleCloseQuickAdd}>Cancelar</button>
              <button type="submit" className="btn-primary">Salvar</button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  )
}
