<?php
declare(strict_types=1);

function ControleFinanceiroConfig(): array
{
    $config = [];
    $configPath = getenv('CFIN_CONFIG_FILE') ?: '/etc/controlefinanceiro/config.php';

    if ($configPath && is_file($configPath)) {
        $loaded = require $configPath;
        if (is_array($loaded)) {
            $config = $loaded;
        }
    }

    return [
        'host' => (string) (getenv('DB_HOST') ?: ($config['host'] ?? '127.0.0.1')),
        'port' => (string) (getenv('DB_PORT') ?: ($config['port'] ?? '3306')),
        'name' => (string) (getenv('DB_NAME') ?: ($config['name'] ?? $config['dbname'] ?? 'ControleFinanceiro')),
        'user' => (string) (getenv('DB_USER') ?: ($config['user'] ?? '')),
        'pass' => (string) (getenv('DB_PASS') ?: ($config['pass'] ?? '')),
    ];
}

function ControleFinanceiroDb(): PDO
{
    static $db = null;

    if ($db instanceof PDO) {
        return $db;
    }

    $cfg = ControleFinanceiroConfig();
    if ($cfg['user'] === '' || $cfg['pass'] === '') {
        throw new RuntimeException('Configuração do banco ausente. Defina DB_HOST, DB_NAME, DB_USER, DB_PASS ou /etc/controlefinanceiro/config.php');
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $cfg['host'],
        $cfg['port'],
        $cfg['name']
    );

    $db = new PDO($dsn, $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $db;
}
