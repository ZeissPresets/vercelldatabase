<?php
// Sesuaikan dengan detail dari panel hosting InfinityFree Anda
$host = 'sql105.infinityfree.com';
$dbname = 'if0_42209756_logs';
$username = 'if0_42209756';
$password = 'Zenn1221';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>