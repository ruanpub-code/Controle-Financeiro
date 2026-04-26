# Controle Financeiro

Novo projeto-base em arquitetura SPA/API para evolução gradual a partir do sistema atual.

## Stack escolhida

- Frontend: React + Vite + HTML5 + CSS + JavaScript
- Backend: PHP API
- Banco: mesmo acesso e mesma base do projeto atual via variáveis de ambiente ou `/etc/controlefinanceiro/config.php`

## Motivo da escolha do backend em PHP

Como o sistema atual já está em PHP e a meta é migrar gradualmente com menor risco, manter o backend em PHP acelera o reaproveitamento das regras existentes e reduz custo de transição. O frontend moderno fica em React, preparando o projeto para futura integração com app mobile via API.

## Estrutura

- `frontend/` aplicação React SPA
- `backend/` API REST em PHP

## Execução local

1. subir a API PHP na porta 8010
2. iniciar o frontend React
3. consumir os mesmos dados do banco atual pela API

## Deploy em /srv/http

Sim. Este projeto pode ser publicado diretamente em `/srv/http` com Apache + PHP.

### Comandos

```bash
cd frontend
npm install
npm run build

sudo mkdir -p /srv/http/api /srv/http/src
sudo rsync -av --delete dist/ /srv/http/
sudo rsync -av --delete ../backend/public/ /srv/http/api/
sudo rsync -av --delete ../backend/src/ /srv/http/src/
sudo chown -R http:http /srv/http
sudo find /srv/http -type d -exec chmod 755 {} \;
sudo find /srv/http -type f -exec chmod 644 {} \;
sudo systemctl restart httpd
```

### Observações

- o frontend fica servido em `/srv/http`
- a API fica em `/srv/http/api`
- o acesso ao banco pode continuar via variáveis de ambiente ou `/etc/controlefinanceiro/config.php`
- os arquivos `.htaccess` de SPA e API já estão preparados para produção

## Próximos módulos para migrar

1. autenticação
2. pessoas/empresas
3. dashboard
4. contas e categorias
5. financeiro
6. cofrinho
