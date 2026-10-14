<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

error_reporting(0);
ini_set('display_errors', '0');

require_once 'conexion.php';

if (!isset($con) || !$con) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión con la base de datos MySQL.']);
    exit;
}

mysqli_set_charset($con, 'utf8mb4');
$metodo = $_SERVER['REQUEST_METHOD'];

// 1. GET: OBTENER RESEÑAS
if ($metodo === 'GET') {
    $sql = "SELECT id, nombre_cliente, comentario, puntuacion, fecha FROM resenas ORDER BY id DESC";
    $resultado = $con->query($sql);

    if (!$resultado) {
        echo json_encode(['success' => false, 'message' => 'Error al consultar las reseñas.']);
        exit;
    }

    $resenas = $resultado->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'resenas' => $resenas], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. POST: GUARDAR NUEVA RESEÑA
if ($metodo === 'POST') {
    $datos = json_decode(file_get_contents('php://input'), true);

    $nombre     = trim($datos['nombre'] ?? '');
    $apellido   = trim($datos['apellido'] ?? '');
    $comentario = trim($datos['comentario'] ?? '');
    $puntuacion = filter_var($datos['puntuacion'] ?? 5, FILTER_VALIDATE_INT);

    if (empty($nombre) || empty($apellido) || empty($comentario)) {
        echo json_encode(['success' => false, 'message' => 'Completá todos los campos obligatorios.']);
        exit;
    }

    if (!$puntuacion || $puntuacion < 1 || $puntuacion > 5) {
        $puntuacion = 5;
    }

    $nombreCompleto = $nombre . ' ' . $apellido;

    $sql = "INSERT INTO resenas (nombre_cliente, comentario, puntuacion, estado) VALUES (?, ?, ?, 'aprobada')";
    $stmt = $con->prepare($sql);

    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta: ' . $con->error]);
        exit;
    }

    $stmt->bind_param('ssi', $nombreCompleto, $comentario, $puntuacion);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => '¡Tu opinión se guardó correctamente!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar en BD: ' . $stmt->error]);
    }

    $stmt->close();
    exit;
}
?>