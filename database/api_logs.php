<?php
// Header untuk mengizinkan akses Cross-Origin dari Vercel
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

header("Content-Type: application/json");
require_once 'db_config.php';

// FITUR SELF-HEALING: Otomatis membuat tabel system_logs jika belum ada
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `system_logs` (
      `id` INT(11) NOT NULL AUTO_INCREMENT,
      `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
      `heap_used` VARCHAR(50) NOT NULL,
      `cpu_load` FLOAT NOT NULL,
      `event_type` VARCHAR(50) DEFAULT 'monitor',
      `details` TEXT,
      PRIMARY KEY (`id`),
      INDEX (`timestamp`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
} catch (Exception $e) {
    // Abaikan error pembuatan tabel jika sudah ada
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $data = $input['data'] ?? null;

    if ($data) {
        try {
            // 1. Simpan Data Baru dari Vercel
            $stmt = $pdo->prepare("INSERT INTO system_logs (heap_used, cpu_load, event_type) VALUES (?, ?, ?)");
            $stmt->execute([
                $data['heapUsed'] ?? '0 MB',
                $data['cpuLoad'] ?? 0,
                $data['event'] ?? 'monitor'
            ]);

            // 2. AUTO-CLEANUP: Hapus data lama (Probabilitas 10%) agar tidak lemot
            if (rand(1, 10) === 1) {
                $pdo->exec("DELETE FROM system_logs WHERE id <= 
                           (SELECT id FROM (SELECT id FROM system_logs ORDER BY id DESC LIMIT 1 OFFSET 100) as tmp)");
            }

            // Ambil total count untuk monitoring di Dashboard Vercel
            $countStmt = $pdo->query("SELECT COUNT(*) FROM system_logs");
            $totalCount = $countStmt->fetchColumn();

            echo json_encode(["success" => true, "message" => "Data stored", "total_count" => $totalCount]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
} elseif ($method === 'GET') {
    try {
        // Ambil 20 log terbaru
        $stmt = $pdo->query("SELECT * FROM system_logs ORDER BY id DESC LIMIT 20");
        $logs = $stmt->fetchAll();

        // Ambil statistik untuk Dashboard InfinityFree
        $countStmt = $pdo->query("SELECT COUNT(*) FROM system_logs");
        $totalCount = (int)$countStmt->fetchColumn();

        $ingressStmt = $pdo->query("SELECT COUNT(*) FROM system_logs WHERE timestamp > DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
        $ingressRate = (int)$ingressStmt->fetchColumn();

        $latestHeap = $logs[0]['heap_used'] ?? '0 MB';

        echo json_encode([
            "logs" => logs, 
            "total_count" => $totalCount,
            "ingress_rate" => $ingressRate,
            "latest_heap" => $latestHeap
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>