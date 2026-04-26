const TABLE_FILTERS = {
  recent: [
    { field: 'status', label: 'Status', type: 'text' },
    { field: 'tipo', label: 'Tipo', type: 'text' },
    { field: 'valor', label: 'Valor', type: 'number' },
    { field: 'data_vencimento', label: 'Vencimento', type: 'date' },
  ],
  pessoas: [
    { field: 'tipo', label: 'Tipo', type: 'text' },
    { field: 'nome', label: 'Nome', type: 'text' },
    { field: 'documento', label: 'Documento', type: 'text' },
    { field: 'email', label: 'Email', type: 'text' },
  ],
  categorias: [
    { field: 'nome', label: 'Nome', type: 'text' },
    { field: 'tipo', label: 'Tipo', type: 'text' },
    { field: 'ativo', label: 'Ativo', type: 'number' },
  ],
  contas: [
    { field: 'nome', label: 'Nome', type: 'text' },
    { field: 'banco', label: 'Banco', type: 'text' },
    { field: 'saldo', label: 'Saldo', type: 'number' },
  ],
  financeiro: [
    { field: 'tipo', label: 'Tipo', type: 'text' },
    { field: 'status', label: 'Status', type: 'text' },
    { field: 'pessoa_nome', label: 'Pessoa', type: 'text' },
    { field: 'categoria_nome', label: 'Categoria', type: 'text' },
    { field: 'valor', label: 'Valor', type: 'number' },
    { field: 'data_vencimento', label: 'Vencimento', type: 'date' },
  ],
  cofrinhos: [
    { field: 'nome', label: 'Nome', type: 'text' },
    { field: 'saldo_atual', label: 'Saldo Atual', type: 'number' },
    { field: 'valor_objetivo', label: 'Objetivo', type: 'number' },
    { field: 'meses_meta', label: 'Meses', type: 'number' },
  ],
  aportes: [
    { field: 'cofrinho_nome', label: 'Cofrinho', type: 'text' },
    { field: 'valor', label: 'Valor', type: 'number' },
    { field: 'data_aporte', label: 'Data', type: 'date' },
  ],
  usuarios: [
    { field: 'nome', label: 'Nome', type: 'text' },
    { field: 'perfil', label: 'Perfil', type: 'text' },
    { field: 'entidade_nome', label: 'Entidade', type: 'text' },
    { field: 'datalimite', label: 'Validade', type: 'date' },
  ],
  entidades: [
    { field: 'nome', label: 'Nome', type: 'text' },
    { field: 'datalimite', label: 'Data Limite', type: 'date' },
  ],
  auditoria: [
    { field: 'usuario_nome', label: 'Usuário', type: 'text' },
    { field: 'acao', label: 'Ação', type: 'text' },
    { field: 'recurso_tipo', label: 'Recurso', type: 'text' },
    { field: 'created_at', label: 'Data', type: 'date' },
  ],
}

export default TABLE_FILTERS