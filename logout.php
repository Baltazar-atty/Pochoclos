<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

if (($_SESSION['rol'] ?? null) === 'empleado' && !empty($_SESSION['usuario_id'])) {
    require_once 'conexion.php';
    $stmt = $con->prepare("DELETE FROM ubicaciones_vendedores WHERE usuario_id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo limpiar la ubicación del vendedor.']);
        exit;
    }

    $usuarioId = (int)$_SESSION['usuario_id'];
    $stmt->bind_param('i', $usuarioId);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo limpiar la ubicación del vendedor.']);
        exit;
    }
}

$_SESSION = [];
$params = session_get_cookie_params();
setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
session_destroy();

echo json_encode(['success' => true]);
?>
