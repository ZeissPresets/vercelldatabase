<?php
// Sesuaikan dengan detail dari panel hosting InfinityFree Anda
$host = 'sqlXXX.infinityfree.com'; // Ganti XXX dengan server Anda
$dbname = 'if0_xxxx_database';
$username = 'if0_xxxx';
$password = 'YourPassword';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>