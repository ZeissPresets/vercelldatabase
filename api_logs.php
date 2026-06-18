<?php
header("Content-Type: application/json");
require_once 'db_config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $data = $input['data'] ?? null;

    if ($data) {
        try {
            // 1. Simpan Data Baru
            $stmt = $pdo->prepare("INSERT INTO system_logs (heap_used, cpu_load, event_type) VALUES (?, ?, ?)");
            $stmt->execute([
                $data['heapUsed'] ?? '0 MB',
                $data['cpuLoad'] ?? 0,
                $data['event'] ?? 'monitor'
            ]);

            // 2. OPTIMASI: Jalankan pembersihan hanya 1 dari 10 request (Probabilitas 10%)
            // Ini jauh lebih ringan untuk CPU InfinityFree daripada menghapus setiap detik
            if (rand(1, 10) === 1) {
                $pdo->exec("DELETE FROM system_logs WHERE id <= 
                           (SELECT id FROM (SELECT id FROM system_logs ORDER BY id DESC LIMIT 1 OFFSET 100) as tmp)");
            }

            echo json_encode(["success" => true, "message" => "Log saved and database optimized"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
} elseif ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM system_logs ORDER BY id DESC LIMIT 50");
        $logs = $stmt->fetchAll();
        echo json_encode($logs);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
?>