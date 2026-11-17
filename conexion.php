<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pochoclos_db";

$con = mysqli_connect($host, $user, $pass, $db);

if (!$con) {
    if (defined('JSON_API_REQUEST') && JSON_API_REQUEST) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error de conexión con la base de datos: ' . mysqli_connect_error()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo "ERROR_CONEXION: " . mysqli_connect_error();
    exit;
}

mysqli_set_charset($con, "utf8mb4");
?>