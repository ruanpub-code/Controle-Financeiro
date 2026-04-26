<?php
declare(strict_types=1);

session_start();
require_once __DIR__ . '/../src/Database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function routePath(): string
{
    return rtrim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/') ?: '/';
}

function requestJson(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function currentEntidadeId(): int
{
    return max(1, (int) ($_SESSION['id_entidade'] ?? $_GET['entidade_id'] ?? 1));
}

function currentUserId(): int
{
    return (int) ($_SESSION['usuario_id'] ?? 0);
}

function currentUserProfile(): string
{
    return (string) ($_SESSION['usuario_perfil'] ?? 'guest');
}

function requireAuth(): void
{
    if (currentUserId() <= 0) {
        jsonResponse([
            'success' => false,
            'error' => 'Login necessário.',
        ], 401);
    }
}

function requireRole(array $roles): void
{
    requireAuth();

    if (!in_array(currentUserProfile(), $roles, true)) {
        jsonResponse([
            'success' => false,
            'error' => 'Permissão negada para este módulo.',
        ], 403);
    }
}

function fetchAllRows(PDO $db, string $sql, array $params = []): array
{
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function fetchRow(PDO $db, string $sql, array $params = []): array|false
{
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetch();
}

function validateDateInput(?string $date): bool
{
    if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        return false;
    }

    [$year, $month, $day] = array_map('intval', explode('-', $date));
    return checkdate($month, $day, $year);
}

function queryParam(string $key): ?string
{
    $value = trim((string) ($_GET[$key] ?? ''));
    return $value === '' ? null : $value;
}

function queryFilters(): array
{
    $raw = $_GET['filters'] ?? '';
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function buildConditionalSql(array $fieldMap, array &$params): array
{
    $sqlParts = [];

    foreach (queryFilters() as $condition) {
        if (!is_array($condition)) {
            continue;
        }

        $field = (string) ($condition['field'] ?? '');
        $op = (string) ($condition['op'] ?? 'eq');
        $value1 = trim((string) ($condition['value1'] ?? ''));
        $value2 = trim((string) ($condition['value2'] ?? ''));

        if ($field === '' || $value1 === '' || !isset($fieldMap[$field])) {
            continue;
        }

        $column = (string) $fieldMap[$field]['column'];
        $type = (string) ($fieldMap[$field]['type'] ?? 'text');

        if ($type === 'number') {
            if (!is_numeric($value1)) {
                continue;
            }

            if ($op === 'gt') {
                $sqlParts[] = "$column > ?";
                $params[] = (float) $value1;
                continue;
            }

            if ($op === 'lt') {
                $sqlParts[] = "$column < ?";
                $params[] = (float) $value1;
                continue;
            }

            if ($op === 'between' && is_numeric($value2)) {
                $min = min((float) $value1, (float) $value2);
                $max = max((float) $value1, (float) $value2);
                $sqlParts[] = "$column BETWEEN ? AND ?";
                $params[] = $min;
                $params[] = $max;
                continue;
            }

            $sqlParts[] = "$column = ?";
            $params[] = (float) $value1;
            continue;
        }

        if ($type === 'date') {
            if (!validateDateInput($value1)) {
                continue;
            }

            if ($op === 'gt') {
                $sqlParts[] = "DATE($column) > ?";
                $params[] = $value1;
                continue;
            }

            if ($op === 'lt') {
                $sqlParts[] = "DATE($column) < ?";
                $params[] = $value1;
                continue;
            }

            if ($op === 'between' && validateDateInput($value2)) {
                $start = min($value1, $value2);
                $end = max($value1, $value2);
                $sqlParts[] = "DATE($column) BETWEEN ? AND ?";
                $params[] = $start;
                $params[] = $end;
                continue;
            }

            $sqlParts[] = "DATE($column) = ?";
            $params[] = $value1;
            continue;
        }

        if ($op === 'like') {
            $sqlParts[] = "LOWER(COALESCE($column, '')) LIKE ?";
            $params[] = '%' . strtolower($value1) . '%';
            continue;
        }

        if ($op === 'nlike') {
            $sqlParts[] = "LOWER(COALESCE($column, '')) NOT LIKE ?";
            $params[] = '%' . strtolower($value1) . '%';
            continue;
        }

        $sqlParts[] = "LOWER(COALESCE($column, '')) LIKE ?";
        $params[] = '%' . strtolower($value1) . '%';
    }

    return $sqlParts;
}

function normalizeMoney(float|int|string|null $value): float
{
    if (is_string($value)) {
        $clean = preg_replace('/[^0-9,.-]/', '', trim($value)) ?: '0';

        if (str_contains($clean, ',') && str_contains($clean, '.')) {
            $clean = str_replace('.', '', $clean);
            $clean = str_replace(',', '.', $clean);
        } elseif (str_contains($clean, ',')) {
            $clean = str_replace(',', '.', $clean);
        }

        $value = $clean;
    }

    return round((float) $value, 2);
}

function nullableText(mixed $value): ?string
{
    $text = trim((string) ($value ?? ''));
    return $text === '' ? null : $text;
}

function calcularMensalNecessario(float $saldoAtual, float $valorObjetivo, int $mesesMeta): float
{
    if ($mesesMeta <= 0) {
        return 0.0;
    }

    $faltante = max($valorObjetivo - $saldoAtual, 0);
    return round($faltante / $mesesMeta, 2);
}

try {
    $db = ControleFinanceiroDb();
    $path = routePath();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $entidadeId = currentEntidadeId();

    if ($path === '/api/health') {
        jsonResponse([
            'success' => true,
            'project' => 'ControleFinanceiro',
            'architecture' => 'SPA/API',
            'backend' => 'PHP',
            'needsReverseProxyInProduction' => true,
        ]);
    }

    if ($path === '/api/auth/login' && $method === 'POST') {
        $input = requestJson();
        $nome = trim((string) ($input['nome'] ?? ''));
        $senha = (string) ($input['senha'] ?? '');

        if ($nome === '' || $senha === '') {
            jsonResponse(['success' => false, 'error' => 'Informe usuário e senha.'], 422);
        }

        $stmt = $db->prepare(
            "SELECT u.id, u.nome, u.senha, u.perfil, u.id_entidade, u.datalimite, e.nome AS entidade_nome, e.datalimite AS entidade_datalimite
             FROM usuario u
             INNER JOIN entidade e ON e.id = u.id_entidade
             WHERE u.nome = ?
             LIMIT 1"
        );
        $stmt->execute([$nome]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($senha, (string) $user['senha'])) {
            jsonResponse(['success' => false, 'error' => 'Credenciais inválidas.'], 401);
        }

        $hoje = date('Y-m-d');
        if (($user['datalimite'] ?? '0000-00-00') < $hoje || ($user['entidade_datalimite'] ?? '0000-00-00') < $hoje) {
            jsonResponse(['success' => false, 'error' => 'Usuário ou entidade com acesso expirado.'], 403);
        }

        session_regenerate_id(true);
        $_SESSION['usuario_id'] = (int) $user['id'];
        $_SESSION['usuario_nome'] = (string) $user['nome'];
        $_SESSION['usuario_perfil'] = (string) $user['perfil'];
        $_SESSION['id_entidade'] = (int) $user['id_entidade'];

        jsonResponse([
            'success' => true,
            'user' => [
                'id' => (int) $user['id'],
                'nome' => (string) $user['nome'],
                'perfil' => (string) $user['perfil'],
                'id_entidade' => (int) $user['id_entidade'],
                'entidade_nome' => (string) ($user['entidade_nome'] ?? ''),
            ],
        ]);
    }

    if ($path === '/api/auth/me') {
        if (!isset($_SESSION['usuario_id'])) {
            jsonResponse(['success' => false, 'error' => 'Sem sessão ativa.'], 401);
        }

        jsonResponse([
            'success' => true,
            'user' => [
                'id' => (int) ($_SESSION['usuario_id'] ?? 0),
                'nome' => (string) ($_SESSION['usuario_nome'] ?? ''),
                'perfil' => (string) ($_SESSION['usuario_perfil'] ?? 'user'),
                'id_entidade' => (int) ($_SESSION['id_entidade'] ?? 1),
            ],
        ]);
    }

    if ($path === '/api/auth/logout' && $method === 'POST') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        jsonResponse(['success' => true, 'message' => 'Sessão encerrada.']);
    }

    if ($path === '/api/auth/change-password' && $method === 'POST') {
        requireAuth();
        $input = requestJson();
        $senhaAtual = (string) ($input['current_password'] ?? '');
        $novaSenha = (string) ($input['new_password'] ?? '');
        $confirmacao = (string) ($input['confirm_password'] ?? '');

        if ($senhaAtual === '' || $novaSenha === '' || $confirmacao === '') {
            jsonResponse(['success' => false, 'error' => 'Preencha todos os campos da senha.'], 422);
        }

        if ($novaSenha !== $confirmacao) {
            jsonResponse(['success' => false, 'error' => 'A confirmação da nova senha não confere.'], 422);
        }

        if (strlen($novaSenha) < 6) {
            jsonResponse(['success' => false, 'error' => 'A nova senha deve ter pelo menos 6 caracteres.'], 422);
        }

        $row = fetchRow($db, 'SELECT senha FROM usuario WHERE id = ? LIMIT 1', [currentUserId()]);
        if (!$row || !password_verify($senhaAtual, (string) $row['senha'])) {
            jsonResponse(['success' => false, 'error' => 'Senha atual inválida.'], 422);
        }

        $stmt = $db->prepare('UPDATE usuario SET senha = ? WHERE id = ?');
        $stmt->execute([password_hash($novaSenha, PASSWORD_DEFAULT), currentUserId()]);

        jsonResponse(['success' => true, 'message' => 'Senha alterada com sucesso.']);
    }

    if ($path === '/api/dashboard/summary' && $method === 'GET') {
        $stmt = $db->prepare("SELECT COALESCE(ABS(SUM(valor)), 0) FROM financeiro WHERE tipo = 'pagar' AND status != 'pago' AND id_entidade = ?");
        $stmt->execute([$entidadeId]);
        $totalPagar = (float) $stmt->fetchColumn();

        $stmt = $db->prepare("SELECT COALESCE(SUM(valor), 0) FROM financeiro WHERE tipo = 'receber' AND status != 'recebido' AND id_entidade = ?");
        $stmt->execute([$entidadeId]);
        $totalReceber = (float) $stmt->fetchColumn();

        $stmt = $db->prepare("SELECT COALESCE(SUM(saldo), 0) FROM contas_caixa WHERE ativo = 1 AND id_entidade = ?");
        $stmt->execute([$entidadeId]);
        $saldoTotal = (float) $stmt->fetchColumn();

        jsonResponse([
            'success' => true,
            'data' => [
                'totalPagar' => $totalPagar,
                'totalReceber' => $totalReceber,
                'saldoTotal' => $saldoTotal,
                'projecaoFinal' => $saldoTotal + $totalReceber - $totalPagar,
            ],
        ]);
    }

    if ($path === '/api/dashboard/recent' && $method === 'GET') {
        $conditions = ['f.id_entidade = ?'];
        $params = [$entidadeId];
        $conditions = array_merge($conditions, buildConditionalSql([
            'tipo' => ['column' => 'f.tipo', 'type' => 'text'],
            'status' => ['column' => 'f.status', 'type' => 'text'],
            'valor' => ['column' => 'f.valor', 'type' => 'number'],
            'data_vencimento' => ['column' => 'f.data_vencimento', 'type' => 'date'],
        ], $params));

        $rows = fetchAllRows(
            $db,
            "SELECT f.id, f.tipo, f.status, f.valor, f.data_vencimento, pe.nome AS pessoa_nome, c.nome AS categoria_nome
             FROM financeiro f
             LEFT JOIN pessoas_empresas pe ON pe.id = f.pessoa_id
             LEFT JOIN categorias c ON c.id = f.categoria_id
             WHERE " . implode(' AND ', $conditions) . "
             ORDER BY f.id DESC
             LIMIT 10",
            $params
        );

        jsonResponse(['success' => true, 'data' => $rows]);
    }

    if ($path === '/api/pessoas' && $method === 'GET') {
        $conditions = ['id_entidade = ?'];
        $params = [$entidadeId];
        $conditions = array_merge($conditions, buildConditionalSql([
            'id' => ['column' => 'id', 'type' => 'number'],
            'tipo' => ['column' => 'tipo', 'type' => 'text'],
            'nome' => ['column' => 'nome', 'type' => 'text'],
            'documento' => ['column' => 'documento', 'type' => 'text'],
            'email' => ['column' => 'email', 'type' => 'text'],
            'telefone' => ['column' => 'telefone', 'type' => 'text'],
        ], $params));

        $rows = fetchAllRows(
            $db,
            'SELECT id, tipo, nome, documento, email, telefone FROM pessoas_empresas WHERE ' . implode(' AND ', $conditions) . ' ORDER BY id DESC LIMIT 100',
            $params
        );
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    if ($path === '/api/pessoas' && $method === 'POST') {
        $input = requestJson();
        $tipo = in_array(($input['tipo'] ?? ''), ['Física', 'Jurídica'], true) ? $input['tipo'] : 'Física';
        $nome = trim((string) ($input['nome'] ?? ''));
        $documento = preg_replace('/\D+/', '', (string) ($input['documento'] ?? ''));
        $email = nullableText($input['email'] ?? null);
        $telefone = nullableText($input['telefone'] ?? null);

        if ($nome === '') {
            jsonResponse(['success' => false, 'error' => 'Nome é obrigatório.'], 422);
        }

        if ($documento !== '') {
            $exists = fetchRow($db, 'SELECT id FROM pessoas_empresas WHERE documento = ? AND id_entidade = ?', [$documento, $entidadeId]);
            if ($exists) {
                jsonResponse(['success' => false, 'error' => 'Documento já cadastrado para esta entidade.'], 422);
            }
        }

        $stmt = $db->prepare('INSERT INTO pessoas_empresas (tipo, nome, documento, email, telefone, id_entidade) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$tipo, $nome, $documento !== '' ? $documento : null, $email, $telefone, $entidadeId]);

        jsonResponse(['success' => true, 'message' => 'Pessoa cadastrada com sucesso.', 'id' => (int) $db->lastInsertId()]);
    }

    if (preg_match('#^/api/pessoas/(\d+)$#', $path, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'PUT') {
            $input = requestJson();
            $tipo = in_array(($input['tipo'] ?? ''), ['Física', 'Jurídica'], true) ? $input['tipo'] : 'Física';
            $nome = trim((string) ($input['nome'] ?? ''));
            $documento = preg_replace('/\D+/', '', (string) ($input['documento'] ?? ''));
            $email = nullableText($input['email'] ?? null);
            $telefone = nullableText($input['telefone'] ?? null);

            if ($nome === '') {
                jsonResponse(['success' => false, 'error' => 'Nome é obrigatório.'], 422);
            }

            if ($documento !== '') {
                $exists = fetchRow($db, 'SELECT id FROM pessoas_empresas WHERE documento = ? AND id != ? AND id_entidade = ?', [$documento, $id, $entidadeId]);
                if ($exists) {
                    jsonResponse(['success' => false, 'error' => 'Documento já cadastrado para esta entidade.'], 422);
                }
            }

            $stmt = $db->prepare('UPDATE pessoas_empresas SET tipo = ?, nome = ?, documento = ?, email = ?, telefone = ? WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$tipo, $nome, $documento !== '' ? $documento : null, $email, $telefone, $id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Pessoa atualizada com sucesso.']);
        }

        if ($method === 'DELETE') {
            $count = (int) fetchRow($db, 'SELECT COUNT(*) AS total FROM financeiro WHERE pessoa_id = ? AND id_entidade = ?', [$id, $entidadeId])['total'];
            if ($count > 0) {
                jsonResponse(['success' => false, 'error' => 'Esta pessoa está vinculada ao financeiro e não pode ser excluída.'], 422);
            }

            $stmt = $db->prepare('DELETE FROM pessoas_empresas WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Pessoa excluída com sucesso.']);
        }
    }

    if ($path === '/api/categorias' && $method === 'GET') {
        $conditions = ['id_entidade = ?'];
        $params = [$entidadeId];
        $conditions = array_merge($conditions, buildConditionalSql([
            'id' => ['column' => 'id', 'type' => 'number'],
            'nome' => ['column' => 'nome', 'type' => 'text'],
            'tipo' => ['column' => 'tipo', 'type' => 'text'],
            'ativo' => ['column' => 'ativo', 'type' => 'number'],
        ], $params));

        $rows = fetchAllRows(
            $db,
            'SELECT id, nome, tipo, cor, ativo FROM categorias WHERE ' . implode(' AND ', $conditions) . ' ORDER BY id DESC LIMIT 100',
            $params
        );
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    if ($path === '/api/categorias' && $method === 'POST') {
        $input = requestJson();
        $nome = trim((string) ($input['nome'] ?? ''));
        $tipo = ($input['tipo'] ?? 'despesa') === 'receita' ? 'receita' : 'despesa';
        $cor = nullableText($input['cor'] ?? '#667eea') ?? '#667eea';

        if ($nome === '') {
            jsonResponse(['success' => false, 'error' => 'Nome da categoria é obrigatório.'], 422);
        }

        $exists = fetchRow($db, 'SELECT id FROM categorias WHERE nome = ? AND tipo = ? AND id_entidade = ?', [$nome, $tipo, $entidadeId]);
        if ($exists) {
            jsonResponse(['success' => false, 'error' => 'Já existe uma categoria com este nome e tipo.'], 422);
        }

        $stmt = $db->prepare('INSERT INTO categorias (nome, tipo, cor, ativo, id_entidade) VALUES (?, ?, ?, 1, ?)');
        $stmt->execute([$nome, $tipo, $cor, $entidadeId]);
        jsonResponse(['success' => true, 'message' => 'Categoria cadastrada com sucesso.', 'id' => (int) $db->lastInsertId()]);
    }

    if (preg_match('#^/api/categorias/(\d+)$#', $path, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'PUT') {
            $input = requestJson();
            $nome = trim((string) ($input['nome'] ?? ''));
            $tipo = ($input['tipo'] ?? 'despesa') === 'receita' ? 'receita' : 'despesa';
            $cor = nullableText($input['cor'] ?? '#667eea') ?? '#667eea';

            if ($nome === '') {
                jsonResponse(['success' => false, 'error' => 'Nome da categoria é obrigatório.'], 422);
            }

            $exists = fetchRow($db, 'SELECT id FROM categorias WHERE nome = ? AND tipo = ? AND id != ? AND id_entidade = ?', [$nome, $tipo, $id, $entidadeId]);
            if ($exists) {
                jsonResponse(['success' => false, 'error' => 'Já existe uma categoria com este nome e tipo.'], 422);
            }

            $stmt = $db->prepare('UPDATE categorias SET nome = ?, tipo = ?, cor = ? WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$nome, $tipo, $cor, $id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Categoria atualizada com sucesso.']);
        }

        if ($method === 'DELETE') {
            $count = (int) fetchRow($db, 'SELECT COUNT(*) AS total FROM financeiro WHERE categoria_id = ? AND id_entidade = ?', [$id, $entidadeId])['total'];
            if ($count > 0) {
                jsonResponse(['success' => false, 'error' => 'Esta categoria está vinculada ao financeiro e não pode ser excluída.'], 422);
            }

            $stmt = $db->prepare('DELETE FROM categorias WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Categoria excluída com sucesso.']);
        }
    }

    if ($path === '/api/contas-caixa' && $method === 'GET') {
        $conditions = ['id_entidade = ?'];
        $params = [$entidadeId];
        $conditions = array_merge($conditions, buildConditionalSql([
            'id' => ['column' => 'id', 'type' => 'number'],
            'nome' => ['column' => 'nome', 'type' => 'text'],
            'banco' => ['column' => 'banco', 'type' => 'text'],
            'agencia' => ['column' => 'agencia', 'type' => 'text'],
            'conta' => ['column' => 'conta', 'type' => 'text'],
            'saldo' => ['column' => 'saldo', 'type' => 'number'],
            'ativo' => ['column' => 'ativo', 'type' => 'number'],
        ], $params));

        $rows = fetchAllRows(
            $db,
            'SELECT id, nome, banco, agencia, conta, saldo, ativo FROM contas_caixa WHERE ' . implode(' AND ', $conditions) . ' ORDER BY id DESC LIMIT 100',
            $params
        );
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    if ($path === '/api/contas-caixa' && $method === 'POST') {
        $input = requestJson();
        $nome = trim((string) ($input['nome'] ?? ''));
        $banco = nullableText($input['banco'] ?? null);
        $agencia = nullableText($input['agencia'] ?? null);
        $conta = nullableText($input['conta'] ?? null);
        $saldo = normalizeMoney($input['saldo'] ?? 0);

        if ($nome === '') {
            jsonResponse(['success' => false, 'error' => 'Nome da conta é obrigatório.'], 422);
        }

        $stmt = $db->prepare('INSERT INTO contas_caixa (nome, banco, agencia, conta, saldo, ativo, id_entidade) VALUES (?, ?, ?, ?, ?, 1, ?)');
        $stmt->execute([$nome, $banco, $agencia, $conta, $saldo, $entidadeId]);
        jsonResponse(['success' => true, 'message' => 'Conta cadastrada com sucesso.', 'id' => (int) $db->lastInsertId()]);
    }

    if (preg_match('#^/api/contas-caixa/(\d+)$#', $path, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'PUT') {
            $input = requestJson();
            $nome = trim((string) ($input['nome'] ?? ''));
            $banco = nullableText($input['banco'] ?? null);
            $agencia = nullableText($input['agencia'] ?? null);
            $conta = nullableText($input['conta'] ?? null);
            $saldo = normalizeMoney($input['saldo'] ?? 0);

            if ($nome === '') {
                jsonResponse(['success' => false, 'error' => 'Nome da conta é obrigatório.'], 422);
            }

            $stmt = $db->prepare('UPDATE contas_caixa SET nome = ?, banco = ?, agencia = ?, conta = ?, saldo = ? WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$nome, $banco, $agencia, $conta, $saldo, $id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Conta atualizada com sucesso.']);
        }

        if ($method === 'DELETE') {
            $count = (int) fetchRow($db, 'SELECT COUNT(*) AS total FROM financeiro WHERE conta_caixa_id = ? AND id_entidade = ?', [$id, $entidadeId])['total'];
            if ($count > 0) {
                jsonResponse(['success' => false, 'error' => 'Esta conta está vinculada ao financeiro e não pode ser excluída.'], 422);
            }

            $stmt = $db->prepare('DELETE FROM contas_caixa WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Conta excluída com sucesso.']);
        }
    }

    if ($path === '/api/financeiro' && $method === 'GET') {
        $conditions = ['f.id_entidade = ?'];
        $params = [$entidadeId];
        $conditions = array_merge($conditions, buildConditionalSql([
            'id' => ['column' => 'f.id', 'type' => 'number'],
            'tipo' => ['column' => 'f.tipo', 'type' => 'text'],
            'status' => ['column' => 'f.status', 'type' => 'text'],
            'pessoa_nome' => ['column' => 'pe.nome', 'type' => 'text'],
            'categoria_nome' => ['column' => 'c.nome', 'type' => 'text'],
            'conta_nome' => ['column' => 'cc.nome', 'type' => 'text'],
            'valor' => ['column' => 'f.valor', 'type' => 'number'],
            'data_vencimento' => ['column' => 'f.data_vencimento', 'type' => 'date'],
        ], $params));

        $rows = fetchAllRows(
            $db,
            "SELECT f.id, f.tipo, f.status, f.valor, f.data_vencimento, f.pessoa_id, f.categoria_id, f.conta_caixa_id, pe.nome AS pessoa_nome, c.nome AS categoria_nome, cc.nome AS conta_nome
             FROM financeiro f
             LEFT JOIN pessoas_empresas pe ON pe.id = f.pessoa_id
             LEFT JOIN categorias c ON c.id = f.categoria_id
             LEFT JOIN contas_caixa cc ON cc.id = f.conta_caixa_id
             WHERE " . implode(' AND ', $conditions) . "
             ORDER BY f.id DESC
             LIMIT 150",
            $params
        );
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    if ($path === '/api/financeiro' && $method === 'POST') {
        $input = requestJson();
        $pessoaId = (int) ($input['pessoa_id'] ?? 0);
        $categoriaId = (int) ($input['categoria_id'] ?? 0);
        $contaId = (int) ($input['conta_caixa_id'] ?? 0);
        $valor = abs(normalizeMoney($input['valor'] ?? 0));
        $dataVencimento = (string) ($input['data_vencimento'] ?? '');

        if ($pessoaId <= 0 || $categoriaId <= 0 || $contaId <= 0 || $valor <= 0) {
            jsonResponse(['success' => false, 'error' => 'Preencha pessoa, categoria, conta e valor.'], 422);
        }

        if (!validateDateInput($dataVencimento)) {
            jsonResponse(['success' => false, 'error' => 'Data de vencimento inválida.'], 422);
        }

        $pessoa = fetchRow($db, 'SELECT id FROM pessoas_empresas WHERE id = ? AND id_entidade = ?', [$pessoaId, $entidadeId]);
        $categoria = fetchRow($db, 'SELECT id, tipo FROM categorias WHERE id = ? AND ativo = 1 AND id_entidade = ?', [$categoriaId, $entidadeId]);
        $conta = fetchRow($db, 'SELECT id FROM contas_caixa WHERE id = ? AND ativo = 1 AND id_entidade = ?', [$contaId, $entidadeId]);

        if (!$pessoa || !$categoria || !$conta) {
            jsonResponse(['success' => false, 'error' => 'Pessoa, categoria ou conta inválida para esta entidade.'], 422);
        }

        $tipo = ((string) $categoria['tipo'] === 'receita') ? 'receber' : 'pagar';

        $stmt = $db->prepare('INSERT INTO financeiro (pessoa_id, conta_caixa_id, categoria_id, valor, data_vencimento, data_transacao, status, tipo, id_entidade) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)');
        $stmt->execute([$pessoaId, $contaId, $categoriaId, $valor, $dataVencimento, 'pendente', $tipo, $entidadeId]);
        jsonResponse(['success' => true, 'message' => 'Lançamento financeiro criado com sucesso.']);
    }

    if (preg_match('#^/api/financeiro/(\d+)$#', $path, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'PUT') {
            $input = requestJson();
            $pessoaId = (int) ($input['pessoa_id'] ?? 0);
            $categoriaId = (int) ($input['categoria_id'] ?? 0);
            $contaId = (int) ($input['conta_caixa_id'] ?? 0);
            $valor = abs(normalizeMoney($input['valor'] ?? 0));
            $dataVencimento = (string) ($input['data_vencimento'] ?? '');

            if ($pessoaId <= 0 || $categoriaId <= 0 || $contaId <= 0 || $valor <= 0) {
                jsonResponse(['success' => false, 'error' => 'Preencha pessoa, categoria, conta e valor.'], 422);
            }

            if (!validateDateInput($dataVencimento)) {
                jsonResponse(['success' => false, 'error' => 'Data de vencimento inválida.'], 422);
            }

            $categoria = fetchRow($db, 'SELECT id, tipo FROM categorias WHERE id = ? AND ativo = 1 AND id_entidade = ?', [$categoriaId, $entidadeId]);
            if (!$categoria) {
                jsonResponse(['success' => false, 'error' => 'Categoria inválida.'], 422);
            }

            $tipo = ((string) $categoria['tipo'] === 'receita') ? 'receber' : 'pagar';
            $stmt = $db->prepare('UPDATE financeiro SET pessoa_id = ?, conta_caixa_id = ?, categoria_id = ?, valor = ?, data_vencimento = ?, tipo = ? WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$pessoaId, $contaId, $categoriaId, $valor, $dataVencimento, $tipo, $id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Lançamento financeiro atualizado com sucesso.']);
        }

        if ($method === 'DELETE') {
            $registro = fetchRow($db, 'SELECT status FROM financeiro WHERE id = ? AND id_entidade = ?', [$id, $entidadeId]);
            if (!$registro) {
                jsonResponse(['success' => false, 'error' => 'Lançamento não encontrado.'], 404);
            }

            if (in_array((string) ($registro['status'] ?? ''), ['pago', 'recebido'], true)) {
                jsonResponse(['success' => false, 'error' => 'Lançamentos já baixados não podem ser excluídos.'], 422);
            }

            $stmt = $db->prepare('DELETE FROM financeiro WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Lançamento financeiro excluído com sucesso.']);
        }
    }

    if (preg_match('#^/api/financeiro/(\d+)/baixar$#', $path, $matches) && $method === 'POST') {
        $id = (int) $matches[1];
        $input = requestJson();
        $dataTransacao = (string) ($input['data_transacao'] ?? date('Y-m-d'));

        if (!validateDateInput($dataTransacao)) {
            jsonResponse(['success' => false, 'error' => 'Data da transação inválida.'], 422);
        }

        $row = fetchRow($db, 'SELECT tipo, valor, conta_caixa_id FROM financeiro WHERE id = ? AND id_entidade = ?', [$id, $entidadeId]);
        if (!$row) {
            jsonResponse(['success' => false, 'error' => 'Lançamento não encontrado.'], 404);
        }

        $novoStatus = ((string) $row['tipo'] === 'receber') ? 'recebido' : 'pago';
        $stmt = $db->prepare('UPDATE financeiro SET status = ?, data_transacao = ? WHERE id = ? AND id_entidade = ?');
        $stmt->execute([$novoStatus, $dataTransacao, $id, $entidadeId]);

        if (!empty($row['conta_caixa_id'])) {
            $ajuste = ((string) $row['tipo'] === 'receber') ? (float) $row['valor'] : -((float) $row['valor']);
            $stmt = $db->prepare('UPDATE contas_caixa SET saldo = saldo + ? WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$ajuste, (int) $row['conta_caixa_id'], $entidadeId]);
        }

        jsonResponse(['success' => true, 'message' => 'Baixa registrada com sucesso.']);
    }

    if (preg_match('#^/api/financeiro/(\d+)/estornar$#', $path, $matches) && $method === 'POST') {
        $id = (int) $matches[1];
        $row = fetchRow($db, 'SELECT status, tipo, valor, conta_caixa_id FROM financeiro WHERE id = ? AND id_entidade = ?', [$id, $entidadeId]);
        if (!$row) {
            jsonResponse(['success' => false, 'error' => 'Lançamento não encontrado.'], 404);
        }
        if (!in_array((string) ($row['status'] ?? ''), ['pago', 'recebido'], true)) {
            jsonResponse(['success' => false, 'error' => 'Apenas lançamentos pagos ou recebidos podem ser estornados.'], 422);
        }
        $stmt = $db->prepare('UPDATE financeiro SET status = ?, data_transacao = NULL WHERE id = ? AND id_entidade = ?');
        $stmt->execute(['pendente', $id, $entidadeId]);

        if (!empty($row['conta_caixa_id'])) {
            $ajuste = ((string) $row['tipo'] === 'receber') ? -((float) $row['valor']) : (float) $row['valor'];
            $stmt = $db->prepare('UPDATE contas_caixa SET saldo = saldo + ? WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$ajuste, (int) $row['conta_caixa_id'], $entidadeId]);
        }

        jsonResponse(['success' => true, 'message' => 'Estorno realizado com sucesso.']);
    }

    if ($path === '/api/cofrinhos' && $method === 'GET') {
        $conditions = ['id_entidade = ?', 'ativo = 1'];
        $params = [$entidadeId];
        $conditions = array_merge($conditions, buildConditionalSql([
            'id' => ['column' => 'id', 'type' => 'number'],
            'nome' => ['column' => 'nome', 'type' => 'text'],
            'saldo_atual' => ['column' => 'saldo_atual', 'type' => 'number'],
            'valor_objetivo' => ['column' => 'valor_objetivo', 'type' => 'number'],
            'meses_meta' => ['column' => 'meses_meta', 'type' => 'number'],
            'valor_mensal_necessario' => ['column' => 'valor_mensal_necessario', 'type' => 'number'],
        ], $params));

        $rows = fetchAllRows(
            $db,
            'SELECT id, nome, saldo_atual, valor_objetivo, meses_meta, valor_mensal_necessario, ativo FROM cofrinhos WHERE ' . implode(' AND ', $conditions) . ' ORDER BY id DESC LIMIT 100',
            $params
        );
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    if ($path === '/api/cofrinhos' && $method === 'POST') {
        $input = requestJson();
        $nome = trim((string) ($input['nome'] ?? ''));
        $saldoAtual = max(0, normalizeMoney($input['saldo_atual'] ?? 0));
        $valorObjetivo = normalizeMoney($input['valor_objetivo'] ?? 0);
        $mesesMeta = max(1, (int) ($input['meses_meta'] ?? 1));

        if ($nome === '' || $valorObjetivo <= 0) {
            jsonResponse(['success' => false, 'error' => 'Nome e valor objetivo são obrigatórios.'], 422);
        }

        $mensal = calcularMensalNecessario($saldoAtual, $valorObjetivo, $mesesMeta);
        $stmt = $db->prepare('INSERT INTO cofrinhos (nome, saldo_atual, valor_objetivo, meses_meta, valor_mensal_necessario, ativo, id_entidade) VALUES (?, ?, ?, ?, ?, 1, ?)');
        $stmt->execute([$nome, $saldoAtual, $valorObjetivo, $mesesMeta, $mensal, $entidadeId]);
        jsonResponse(['success' => true, 'message' => 'Cofrinho cadastrado com sucesso.']);
    }

    if (preg_match('#^/api/cofrinhos/(\d+)$#', $path, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'PUT') {
            $input = requestJson();
            $nome = trim((string) ($input['nome'] ?? ''));
            $saldoAtual = max(0, normalizeMoney($input['saldo_atual'] ?? 0));
            $valorObjetivo = normalizeMoney($input['valor_objetivo'] ?? 0);
            $mesesMeta = max(1, (int) ($input['meses_meta'] ?? 1));

            if ($nome === '' || $valorObjetivo <= 0) {
                jsonResponse(['success' => false, 'error' => 'Nome e valor objetivo são obrigatórios.'], 422);
            }

            $mensal = calcularMensalNecessario($saldoAtual, $valorObjetivo, $mesesMeta);
            $stmt = $db->prepare('UPDATE cofrinhos SET nome = ?, saldo_atual = ?, valor_objetivo = ?, meses_meta = ?, valor_mensal_necessario = ? WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$nome, $saldoAtual, $valorObjetivo, $mesesMeta, $mensal, $id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Cofrinho atualizado com sucesso.']);
        }

        if ($method === 'DELETE') {
            $stmt = $db->prepare('UPDATE cofrinhos SET ativo = 0 WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$id, $entidadeId]);
            jsonResponse(['success' => true, 'message' => 'Cofrinho arquivado com sucesso.']);
        }
    }

    if ($path === '/api/cofrinhos/aportes' && $method === 'GET') {
        $conditions = ['a.id_entidade = ?'];
        $params = [$entidadeId];
        $conditions = array_merge($conditions, buildConditionalSql([
            'id' => ['column' => 'a.id', 'type' => 'number'],
            'cofrinho_nome' => ['column' => 'c.nome', 'type' => 'text'],
            'valor' => ['column' => 'a.valor', 'type' => 'number'],
            'data_aporte' => ['column' => 'a.data_aporte', 'type' => 'date'],
            'observacao' => ['column' => 'a.observacao', 'type' => 'text'],
        ], $params));

        $rows = fetchAllRows(
            $db,
            "SELECT a.id, a.id_cofrinho, a.valor, a.data_aporte, a.observacao, c.nome AS cofrinho_nome
             FROM cofrinho_aportes a
             INNER JOIN cofrinhos c ON c.id = a.id_cofrinho
             WHERE " . implode(' AND ', $conditions) . "
             ORDER BY a.id DESC
             LIMIT 100",
            $params
        );
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    if ($path === '/api/cofrinhos/aportes' && $method === 'POST') {
        $input = requestJson();
        $idCofrinho = (int) ($input['id_cofrinho'] ?? 0);
        $valor = normalizeMoney($input['valor'] ?? 0);
        $dataAporte = (string) ($input['data_aporte'] ?? '');
        $observacao = nullableText($input['observacao'] ?? null);

        if ($idCofrinho <= 0 || $valor <= 0) {
            jsonResponse(['success' => false, 'error' => 'Cofrinho e valor do aporte são obrigatórios.'], 422);
        }

        if (!validateDateInput($dataAporte)) {
            jsonResponse(['success' => false, 'error' => 'Data do aporte inválida.'], 422);
        }

        $db->beginTransaction();
        $cofrinho = fetchRow($db, 'SELECT id, saldo_atual, valor_objetivo, meses_meta FROM cofrinhos WHERE id = ? AND id_entidade = ? FOR UPDATE', [$idCofrinho, $entidadeId]);
        if (!$cofrinho) {
            $db->rollBack();
            jsonResponse(['success' => false, 'error' => 'Cofrinho não encontrado.'], 404);
        }

        $stmt = $db->prepare('INSERT INTO cofrinho_aportes (id_cofrinho, valor, data_aporte, observacao, id_entidade) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$idCofrinho, $valor, $dataAporte, $observacao, $entidadeId]);

        $novoSaldo = (float) $cofrinho['saldo_atual'] + $valor;
        $mensal = calcularMensalNecessario($novoSaldo, (float) $cofrinho['valor_objetivo'], (int) $cofrinho['meses_meta']);
        $stmt = $db->prepare('UPDATE cofrinhos SET saldo_atual = ?, valor_mensal_necessario = ? WHERE id = ? AND id_entidade = ?');
        $stmt->execute([$novoSaldo, $mensal, $idCofrinho, $entidadeId]);
        $db->commit();

        jsonResponse(['success' => true, 'message' => 'Aporte registrado com sucesso.']);
    }

    if (preg_match('#^/api/cofrinhos/aportes/(\d+)$#', $path, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'PUT') {
            $input = requestJson();
            $idCofrinho = (int) ($input['id_cofrinho'] ?? 0);
            $novoValor = normalizeMoney($input['valor'] ?? 0);
            $dataAporte = (string) ($input['data_aporte'] ?? '');
            $observacao = nullableText($input['observacao'] ?? null);

            if ($idCofrinho <= 0 || $novoValor <= 0 || !validateDateInput($dataAporte)) {
                jsonResponse(['success' => false, 'error' => 'Dados do aporte inválidos.'], 422);
            }

            $db->beginTransaction();
            $aporte = fetchRow($db, 'SELECT id, id_cofrinho, valor FROM cofrinho_aportes WHERE id = ? AND id_entidade = ? FOR UPDATE', [$id, $entidadeId]);
            if (!$aporte) {
                $db->rollBack();
                jsonResponse(['success' => false, 'error' => 'Aporte não encontrado.'], 404);
            }

            $cofrinhoOrigem = fetchRow($db, 'SELECT id, saldo_atual, valor_objetivo, meses_meta FROM cofrinhos WHERE id = ? AND id_entidade = ? FOR UPDATE', [(int) $aporte['id_cofrinho'], $entidadeId]);
            $cofrinhoDestino = $idCofrinho === (int) $aporte['id_cofrinho']
                ? $cofrinhoOrigem
                : fetchRow($db, 'SELECT id, saldo_atual, valor_objetivo, meses_meta FROM cofrinhos WHERE id = ? AND id_entidade = ? FOR UPDATE', [$idCofrinho, $entidadeId]);

            if (!$cofrinhoOrigem || !$cofrinhoDestino) {
                $db->rollBack();
                jsonResponse(['success' => false, 'error' => 'Cofrinho não encontrado.'], 404);
            }

            $stmt = $db->prepare('UPDATE cofrinho_aportes SET id_cofrinho = ?, valor = ?, data_aporte = ?, observacao = ? WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$idCofrinho, $novoValor, $dataAporte, $observacao, $id, $entidadeId]);

            if ($idCofrinho === (int) $aporte['id_cofrinho']) {
                $novoSaldo = (float) $cofrinhoDestino['saldo_atual'] - (float) $aporte['valor'] + $novoValor;
                $mensal = calcularMensalNecessario($novoSaldo, (float) $cofrinhoDestino['valor_objetivo'], (int) $cofrinhoDestino['meses_meta']);
                $stmt = $db->prepare('UPDATE cofrinhos SET saldo_atual = ?, valor_mensal_necessario = ? WHERE id = ? AND id_entidade = ?');
                $stmt->execute([$novoSaldo, $mensal, $idCofrinho, $entidadeId]);
            } else {
                $saldoOrigem = max(0, (float) $cofrinhoOrigem['saldo_atual'] - (float) $aporte['valor']);
                $mensalOrigem = calcularMensalNecessario($saldoOrigem, (float) $cofrinhoOrigem['valor_objetivo'], (int) $cofrinhoOrigem['meses_meta']);
                $stmt = $db->prepare('UPDATE cofrinhos SET saldo_atual = ?, valor_mensal_necessario = ? WHERE id = ? AND id_entidade = ?');
                $stmt->execute([$saldoOrigem, $mensalOrigem, (int) $aporte['id_cofrinho'], $entidadeId]);

                $saldoDestino = (float) $cofrinhoDestino['saldo_atual'] + $novoValor;
                $mensalDestino = calcularMensalNecessario($saldoDestino, (float) $cofrinhoDestino['valor_objetivo'], (int) $cofrinhoDestino['meses_meta']);
                $stmt->execute([$saldoDestino, $mensalDestino, $idCofrinho, $entidadeId]);
            }

            $db->commit();

            jsonResponse(['success' => true, 'message' => 'Aporte atualizado com sucesso.']);
        }

        if ($method === 'DELETE') {
            $db->beginTransaction();
            $aporte = fetchRow($db, 'SELECT id, id_cofrinho, valor FROM cofrinho_aportes WHERE id = ? AND id_entidade = ? FOR UPDATE', [$id, $entidadeId]);
            if (!$aporte) {
                $db->rollBack();
                jsonResponse(['success' => false, 'error' => 'Aporte não encontrado.'], 404);
            }

            $cofrinho = fetchRow($db, 'SELECT id, saldo_atual, valor_objetivo, meses_meta FROM cofrinhos WHERE id = ? AND id_entidade = ? FOR UPDATE', [(int) $aporte['id_cofrinho'], $entidadeId]);
            if (!$cofrinho) {
                $db->rollBack();
                jsonResponse(['success' => false, 'error' => 'Cofrinho não encontrado.'], 404);
            }

            $stmt = $db->prepare('DELETE FROM cofrinho_aportes WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$id, $entidadeId]);

            $novoSaldo = max(0, (float) $cofrinho['saldo_atual'] - (float) $aporte['valor']);
            $mensal = calcularMensalNecessario($novoSaldo, (float) $cofrinho['valor_objetivo'], (int) $cofrinho['meses_meta']);
            $stmt = $db->prepare('UPDATE cofrinhos SET saldo_atual = ?, valor_mensal_necessario = ? WHERE id = ? AND id_entidade = ?');
            $stmt->execute([$novoSaldo, $mensal, (int) $aporte['id_cofrinho'], $entidadeId]);
            $db->commit();

            jsonResponse(['success' => true, 'message' => 'Aporte removido com sucesso.']);
        }
    }

    if ($path === '/api/admin/usuarios' && $method === 'GET') {
        requireRole(['admin', 'root']);
        $conditions = [];
        $params = [];

        if (currentUserProfile() !== 'root') {
            $conditions[] = 'u.id_entidade = ?';
            $params[] = $entidadeId;
        }

        $conditions = array_merge($conditions, buildConditionalSql([
            'id' => ['column' => 'u.id', 'type' => 'number'],
            'nome' => ['column' => 'u.nome', 'type' => 'text'],
            'perfil' => ['column' => 'u.perfil', 'type' => 'text'],
            'entidade_nome' => ['column' => 'e.nome', 'type' => 'text'],
            'datalimite' => ['column' => 'u.datalimite', 'type' => 'date'],
        ], $params));

        $whereSql = $conditions ? 'WHERE ' . implode(' AND ', $conditions) . ' ' : '';

        $rows = fetchAllRows(
            $db,
            "SELECT u.id, u.nome, u.perfil, u.id_entidade, u.datalimite, e.nome AS entidade_nome
             FROM usuario u
             INNER JOIN entidade e ON e.id = u.id_entidade
             " . $whereSql .
             "ORDER BY u.id DESC LIMIT 100",
            $params
        );
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    if ($path === '/api/admin/usuarios' && $method === 'POST') {
        requireRole(['admin', 'root']);
        $input = requestJson();
        $nome = trim((string) ($input['nome'] ?? ''));
        $senha = (string) ($input['senha'] ?? '');
        $perfil = (string) ($input['perfil'] ?? 'user');
        $userEntidadeId = currentUserProfile() === 'root' ? (int) ($input['id_entidade'] ?? 0) : $entidadeId;
        $datalimite = (string) ($input['datalimite'] ?? '');

        if ($nome === '' || $senha === '' || $datalimite === '') {
            jsonResponse(['success' => false, 'error' => 'Nome, senha e validade são obrigatórios.'], 422);
        }

        if (!validateDateInput($datalimite)) {
            jsonResponse(['success' => false, 'error' => 'Data limite inválida.'], 422);
        }

        if (!in_array($perfil, ['user', 'admin', 'root'], true) || (currentUserProfile() !== 'root' && $perfil === 'root')) {
            jsonResponse(['success' => false, 'error' => 'Perfil inválido para seu nível de acesso.'], 422);
        }

        $entidade = fetchRow($db, 'SELECT id FROM entidade WHERE id = ?', [$userEntidadeId]);
        if (!$entidade) {
            jsonResponse(['success' => false, 'error' => 'Entidade inválida.'], 422);
        }

        $stmt = $db->prepare('INSERT INTO usuario (nome, senha, perfil, id_entidade, datalimite) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$nome, password_hash($senha, PASSWORD_DEFAULT), $perfil, $userEntidadeId, $datalimite]);
        jsonResponse(['success' => true, 'message' => 'Usuário cadastrado com sucesso.']);
    }

    if (preg_match('#^/api/admin/usuarios/(\d+)$#', $path, $matches)) {
        requireRole(['admin', 'root']);
        $id = (int) $matches[1];

        if ($method === 'PUT') {
            $input = requestJson();
            $nome = trim((string) ($input['nome'] ?? ''));
            $senha = (string) ($input['senha'] ?? '');
            $perfil = (string) ($input['perfil'] ?? 'user');
            $userEntidadeId = currentUserProfile() === 'root' ? (int) ($input['id_entidade'] ?? 0) : $entidadeId;
            $datalimite = (string) ($input['datalimite'] ?? '');

            if ($nome === '' || $datalimite === '') {
                jsonResponse(['success' => false, 'error' => 'Nome e validade são obrigatórios.'], 422);
            }

            if (!validateDateInput($datalimite)) {
                jsonResponse(['success' => false, 'error' => 'Data limite inválida.'], 422);
            }

            if (!in_array($perfil, ['user', 'admin', 'root'], true) || (currentUserProfile() !== 'root' && $perfil === 'root')) {
                jsonResponse(['success' => false, 'error' => 'Perfil inválido para seu nível de acesso.'], 422);
            }

            if ($senha !== '') {
                $stmt = currentUserProfile() === 'root'
                    ? $db->prepare('UPDATE usuario SET nome = ?, perfil = ?, senha = ?, id_entidade = ?, datalimite = ? WHERE id = ?')
                    : $db->prepare('UPDATE usuario SET nome = ?, perfil = ?, senha = ?, id_entidade = ?, datalimite = ? WHERE id = ? AND id_entidade = ?');

                $params = currentUserProfile() === 'root'
                    ? [$nome, $perfil, password_hash($senha, PASSWORD_DEFAULT), $userEntidadeId, $datalimite, $id]
                    : [$nome, $perfil, password_hash($senha, PASSWORD_DEFAULT), $userEntidadeId, $datalimite, $id, $entidadeId];
            } else {
                $stmt = currentUserProfile() === 'root'
                    ? $db->prepare('UPDATE usuario SET nome = ?, perfil = ?, id_entidade = ?, datalimite = ? WHERE id = ?')
                    : $db->prepare('UPDATE usuario SET nome = ?, perfil = ?, id_entidade = ?, datalimite = ? WHERE id = ? AND id_entidade = ?');

                $params = currentUserProfile() === 'root'
                    ? [$nome, $perfil, $userEntidadeId, $datalimite, $id]
                    : [$nome, $perfil, $userEntidadeId, $datalimite, $id, $entidadeId];
            }

            $stmt->execute($params);
            jsonResponse(['success' => true, 'message' => 'Usuário atualizado com sucesso.']);
        }

        if ($method === 'DELETE') {
            if ($id === currentUserId()) {
                jsonResponse(['success' => false, 'error' => 'Não é permitido excluir o próprio usuário logado.'], 422);
            }

            $stmt = currentUserProfile() === 'root'
                ? $db->prepare('DELETE FROM usuario WHERE id = ?')
                : $db->prepare('DELETE FROM usuario WHERE id = ? AND id_entidade = ? AND perfil != ?');
            $params = currentUserProfile() === 'root' ? [$id] : [$id, $entidadeId, 'root'];
            $stmt->execute($params);
            jsonResponse(['success' => true, 'message' => 'Usuário excluído com sucesso.']);
        }
    }

    if ($path === '/api/root/entidades' && $method === 'GET') {
        requireRole(['root']);
        $params = [];
        $conditions = buildConditionalSql([
            'id' => ['column' => 'id', 'type' => 'number'],
            'nome' => ['column' => 'nome', 'type' => 'text'],
            'datalimite' => ['column' => 'datalimite', 'type' => 'date'],
        ], $params);

        $sql = 'SELECT id, nome, datalimite FROM entidade ' . ($conditions ? 'WHERE ' . implode(' AND ', $conditions) . ' ' : '') . 'ORDER BY id DESC LIMIT 100';
        $rows = fetchAllRows($db, $sql, $params);
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    if ($path === '/api/root/entidades' && $method === 'POST') {
        requireRole(['root']);
        $input = requestJson();
        $nome = trim((string) ($input['nome'] ?? ''));
        $datalimite = (string) ($input['datalimite'] ?? '');

        if ($nome === '' || !validateDateInput($datalimite)) {
            jsonResponse(['success' => false, 'error' => 'Nome e data limite válidos são obrigatórios.'], 422);
        }

        $stmt = $db->prepare('INSERT INTO entidade (nome, datalimite) VALUES (?, ?)');
        $stmt->execute([$nome, $datalimite]);
        jsonResponse(['success' => true, 'message' => 'Entidade cadastrada com sucesso.']);
    }

    if (preg_match('#^/api/root/entidades/(\d+)$#', $path, $matches)) {
        requireRole(['root']);
        $id = (int) $matches[1];

        if ($method === 'PUT') {
            $input = requestJson();
            $nome = trim((string) ($input['nome'] ?? ''));
            $datalimite = (string) ($input['datalimite'] ?? '');

            if ($nome === '' || !validateDateInput($datalimite)) {
                jsonResponse(['success' => false, 'error' => 'Nome e data limite válidos são obrigatórios.'], 422);
            }

            $stmt = $db->prepare('UPDATE entidade SET nome = ?, datalimite = ? WHERE id = ?');
            $stmt->execute([$nome, $datalimite, $id]);
            jsonResponse(['success' => true, 'message' => 'Entidade atualizada com sucesso.']);
        }

        if ($method === 'DELETE') {
            if ($id === $entidadeId) {
                jsonResponse(['success' => false, 'error' => 'Não é permitido excluir a própria entidade em uso.'], 422);
            }

            $stmt = $db->prepare('DELETE FROM entidade WHERE id = ?');
            $stmt->execute([$id]);
            jsonResponse(['success' => true, 'message' => 'Entidade excluída com sucesso.']);
        }
    }

    if ($path === '/api/root/auditoria' && $method === 'GET') {
        requireRole(['root']);
        $params = [];
        $conditions = buildConditionalSql([
            'id' => ['column' => 'id', 'type' => 'number'],
            'usuario_nome' => ['column' => 'usuario_nome', 'type' => 'text'],
            'usuario_perfil' => ['column' => 'usuario_perfil', 'type' => 'text'],
            'acao' => ['column' => 'acao', 'type' => 'text'],
            'recurso_tipo' => ['column' => 'recurso_tipo', 'type' => 'text'],
            'rota' => ['column' => 'rota', 'type' => 'text'],
            'created_at' => ['column' => 'created_at', 'type' => 'date'],
        ], $params);

        $sql = 'SELECT id, usuario_nome, usuario_perfil, acao, recurso_tipo, rota, created_at FROM audit_log ' . ($conditions ? 'WHERE ' . implode(' AND ', $conditions) . ' ' : '') . 'ORDER BY id DESC LIMIT 100';
        try {
            $rows = fetchAllRows($db, $sql, $params);
        } catch (PDOException $e) {
            $message = strtolower($e->getMessage());
            $missingAuditTable = str_contains($message, 'audit_log')
                && (
                    str_contains($message, "doesn't exist")
                    || str_contains($message, 'does not exist')
                    || str_contains($message, 'no such table')
                );

            if ($missingAuditTable) {
                jsonResponse([
                    'success' => true,
                    'data' => [],
                ]);
            }

            throw $e;
        }

        jsonResponse(['success' => true, 'data' => $rows]);
    }

    jsonResponse([
        'success' => false,
        'error' => 'Rota não encontrada',
        'path' => $path,
    ], 404);
} catch (Throwable $e) {
    if ($db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }

    jsonResponse([
        'success' => false,
        'error' => $e->getMessage(),
    ], 500);
}
