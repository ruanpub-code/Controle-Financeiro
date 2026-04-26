MANUAL DE DESENVOLVIMENTO - CONTROLEFINANCEIRO-REACT
Data de referencia: 2026-04-24

==================================================
1) VISAO GERAL DA ARQUITETURA
==================================================
Projeto dividido em 2 camadas principais:
- frontend/: SPA em React (Vite)
- backend/: API REST em PHP

Fluxo de alto nivel:
1. Usuario autentica pela SPA.
2. Frontend chama endpoints /api/* via fetch.
3. Backend valida sessao/perfil e executa regras de negocio.
4. Backend responde JSON padrao { success, data|message|error }.
5. Frontend atualiza estado global (datasets/summary/modais) e renderiza modulos.

Principio usado no frontend:
- Configuracao dirigindo UI (moduleConfig)
- Componentes reutilizaveis de tabela/modal/campo
- Hooks separando estado/interacoes/CRUD/autenticacao

==================================================
2) ESTRUTURA DE PASTAS (RAIZ)
==================================================
- README.md
  Documentacao geral de stack e deploy.

- backend/
  - public/index.php
    Arquivo unico de roteamento da API (estilo front controller).
  - src/Database.php
    Fabrica de conexao PDO e leitura de configuracao de banco.

- frontend/
  - src/
    Codigo principal React.
  - package.json
    Scripts e dependencias do frontend.
  - vite.config.js
    Configuracao do Vite.

- Deploy/
  - Deploy.sh
    Script de build/publicacao para /srv/http.
  - config.php
    Exemplo/arquivo de configuracao de banco para deploy.

==================================================
3) FRONTEND - ARQUIVOS CHAVE E RELACIONAMENTO
==================================================

3.1) Composicao principal
- frontend/src/App.jsx
  E o orquestrador da aplicacao:
  - controla sessao (user), modulo ativo, datasets, summary, filtros e modais.
  - monta moduleConfig via createModuleConfig(...).
  - injeta handlers de hooks nos componentes.
  - renderiza:
    - LoginScreen quando nao autenticado
    - AppShell + modulo ativo quando autenticado
    - AppModals para fluxos de CRUD/baixa/estorno/submodal

Relacoes diretas de App.jsx:
- usa hooks:
  - hooks/useAuthSession.js
  - hooks/useAppInteractions.js
  - hooks/useCrudActions.js
  - hooks/useAppDerivedState.js
  - hooks/useSidebarState.js
  - hooks/useTheme.js
- usa servicos:
  - services/fetchJson.js
  - services/moduleLoader.js
- usa fabrica de views:
  - modules/createModuleViews.jsx
- usa configuracao:
  - config/createModuleConfig.jsx
  - config/tableFilters.js
  - config/appModules.jsx

3.2) Configuracao central dos modulos
- frontend/src/config/createModuleConfig.jsx
  Define, por modulo:
  - route (endpoint base da API)
  - dataKey (chave em datasets)
  - fields (campos do formulario de CRUD)
  - defaults (estado inicial)
  - columns (colunas para tabela)

Este arquivo e o ponto mais importante para adicionar/alterar campos de modulo.
Se um campo select precisar de cadastro rapido no modal de Financeiro, usar propriedade:
- quickAdd: 'pessoas' | 'categorias' | 'contas'

3.3) Montagem das telas por modulo
- frontend/src/modules/createModuleViews.jsx
  Recebe estados/handlers do App e retorna um objeto com a view de cada modulo.
  Exemplo: chave "financeiro" -> componente FinanceiroModule.

3.4) Sistema de modais
- frontend/src/components/AppModals.jsx
  Centraliza:
  - modal CRUD padrao
  - modal de baixar lancamento
  - modal de estornar lancamento
  - submodal de cadastro rapido (quickAdd) para Financeiro

Relacionamento do quickAdd:
1. Campo do Financeiro (createModuleConfig) possui quickAdd.
2. CrudField renderiza botao "+" ao lado do select.
3. AppModals abre submodal com campos do modulo alvo (pessoas/categorias/contas).
4. Ao salvar, backend retorna id do novo registro.
5. AppModals injeta o id no campo original do formulario financeiro.

- frontend/src/components/CrudField.jsx
  Renderiza dinamicamente input/select.
  Quando field.quickAdd existe, desenha layout com select + botao de atalho.

3.5) CRUD e acoes de negocio no frontend
- frontend/src/hooks/useCrudActions.js
  Responsavel por:
  - submit de create/edit para modulos
  - exclusao
  - baixa/estorno de financeiro
  - alteracao de senha

Regra relevante:
- financeiro e aportes exigem valor > 0 no frontend antes de enviar.

3.6) Autenticacao no frontend
- frontend/src/hooks/useAuthSession.js
  - restaura sessao em /api/auth/me na inicializacao
  - login em /api/auth/login
  - logout em /api/auth/logout

3.7) Carregamento de dados
- frontend/src/services/moduleLoader.js
  Centraliza chamada de endpoints para preencher:
  - summary
  - datasets de modulos

A funcao buildUrlWithFilters aplica filtros por escopo de tela.

- frontend/src/services/fetchJson.js
  Wrapper de fetch:
  - envia credentials same-origin
  - converte JSON
  - levanta erro padronizado quando !response.ok ou success=false

==================================================
4) BACKEND - ESTRUTURA E FLUXO
==================================================

4.1) Entrada unica da API
- backend/public/index.php
  Contem:
  - funcoes utilitarias (jsonResponse, requestJson, filtros, normalizacao)
  - regras de autenticacao/autorizacao (requireAuth, requireRole)
  - roteamento por if/regex para endpoints

4.2) Conexao com banco
- backend/src/Database.php
  Le config via:
  - variaveis de ambiente DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS
  - ou arquivo /etc/controlefinanceiro/config.php

Retorna PDO com:
- ERRMODE_EXCEPTION
- FETCH_ASSOC
- emulacao de prepared statements desativada

4.3) Endpoints principais
Autenticacao:
- GET  /api/health
- POST /api/auth/login
- GET  /api/auth/me
- POST /api/auth/logout
- POST /api/auth/change-password

Dashboard:
- GET /api/dashboard/summary
- GET /api/dashboard/recent

Cadastros e financeiro:
- GET/POST              /api/pessoas
- PUT/DELETE            /api/pessoas/{id}
- GET/POST              /api/categorias
- PUT/DELETE            /api/categorias/{id}
- GET/POST              /api/contas-caixa
- PUT/DELETE            /api/contas-caixa/{id}
- GET/POST              /api/financeiro
- PUT/DELETE            /api/financeiro/{id}
- POST                  /api/financeiro/{id}/baixar
- POST                  /api/financeiro/{id}/estornar

Cofrinhos:
- GET/POST              /api/cofrinhos
- PUT/DELETE            /api/cofrinhos/{id}
- GET/POST              /api/cofrinhos/aportes
- PUT/DELETE            /api/cofrinhos/aportes/{id}

Administracao:
- GET/POST              /api/admin/usuarios
- PUT/DELETE            /api/admin/usuarios/{id}
- GET/POST              /api/root/entidades
- PUT/DELETE            /api/root/entidades/{id}
- GET                   /api/root/auditoria

4.4) Regras importantes de negocio recentes
- Na baixa de financeiro:
  - tipo "pagar"  => subtrai valor do saldo da conta caixa vinculada
  - tipo "receber"=> soma valor no saldo da conta caixa vinculada
- No estorno:
  - desfaz o movimento acima no saldo da conta caixa
- Nos POST de pessoas/categorias/contas-caixa:
  - resposta retorna campo "id" para suportar submodal quickAdd no frontend

==================================================
5) RELACIONAMENTO ENTRE FRONTEND E BACKEND
==================================================

Padrao de integracao:
- Frontend cria moduleConfig com route por modulo.
- useCrudActions usa route para POST/PUT/DELETE.
- moduleLoader busca datasets de todos os modulos necessarios.
- Backend retorna data para GET e message/id para operacoes de escrita.

Exemplo Financeiro (create):
1. Usuario abre modal em AppModals.
2. Preenche campos definidos em createModuleConfig.financeiro.fields.
3. handleSubmitCrud envia POST /api/financeiro.
4. Backend persiste e responde success/message.
5. Frontend recarrega datasets via loadModules.

Exemplo QuickAdd em Financeiro:
1. Usuario clica + ao lado de Pessoa/Categoria/Conta.
2. AppModals abre submodal com route do modulo alvo.
3. POST para /api/pessoas, /api/categorias ou /api/contas-caixa.
4. Backend retorna id criado.
5. Frontend seta o id no campo original e atualiza listas.

==================================================
6) COMO ADICIONAR UM NOVO MODULO
==================================================
1. Backend:
- criar endpoints GET/POST/PUT/DELETE em backend/public/index.php
- implementar validacoes e respostas JSON no padrao do projeto

2. Frontend configuracao:
- adicionar definicao no createModuleConfig.jsx
  - title, route, dataKey, fields, defaults, columns

3. Frontend tela:
- criar componente em frontend/src/modules/NovoModulo.jsx
- registrar em createModuleViews.jsx
- incluir no menu (config/appModules.jsx) se necessario

4. Carregamento:
- incluir endpoint no objeto requests de services/moduleLoader.js
- alinhar dataKey com retorno esperado

5. Filtros:
- adicionar filtros em config/tableFilters.js
- conferir escopo de filtros se tela composta

==================================================
7) BOAS PRATICAS DE MANUTENCAO
==================================================
- Manter createModuleConfig como unica fonte de verdade de campos/colunas.
- Evitar logica de negocio dentro de componentes visuais; preferir hooks.
- Reutilizar fetchJson para manter tratamento de erro uniforme.
- No backend, sempre usar prepared statements e validacoes server-side.
- Em alteracoes de API, preservar formato de resposta para nao quebrar frontend.
- Testar perfil user/admin/root quando mudar permissao de endpoint.
- Ao mexer em financeiro, validar impacto em saldo de contas_caixa e dashboard.

==================================================
8) DEPLOY E AMBIENTE
==================================================
Script oficial:
- Deploy/Deploy.sh

Passos executados pelo script:
1. npm install + npm run build (frontend)
2. publica dist em /srv/http
3. publica backend/public em /srv/http/api
4. publica backend/src em /srv/http/src
5. instala config em /etc/controlefinanceiro/config.php
6. ajusta permissoes e reinicia httpd

Observacao de seguranca:
- O arquivo Deploy/config.php contem credenciais de banco.
- Em producao, controlar permissao e acesso estritamente.

==================================================
9) CHECKLIST RAPIDO PARA DEBUG
==================================================
- API responde /api/health?
- Sessao valida em /api/auth/me?
- Endpoint do modulo retorna success=true?
- dataKey do modulo confere com datasets?
- Campo/coluna alterado em createModuleConfig foi refletido no backend?
- Filtro aplicado esta no escopo correto em moduleLoader?
- Mudancas em financeiro mantiveram baixa/estorno e saldo coerentes?
