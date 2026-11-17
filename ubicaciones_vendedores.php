<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

define('JSON_API_REQUEST', true);
require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    if (!$con->query("DELETE FROM ubicaciones_vendedores WHERE actualizada_en < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 MINUTE)")) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudieron limpiar las ubicaciones vencidas.']);
        exit;
    }

    $resultadoCarritos = $con->query(
        "SELECT id, nombre, ROUND(ubicacion_lat, 2) AS latitud, ROUND(ubicacion_lng, 2) AS longitud
         FROM carritos
         WHERE estado <> 'offline'
         ORDER BY id ASC"
    );
    if (!$resultadoCarritos) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudieron consultar las ubicaciones de los carritos.']);
        exit;
    }

    $carritos = [];
    while ($fila = $resultadoCarritos->fetch_assoc()) {
        $carritos[] = [
            'nombre' => $fila['nombre'],
            'latitud' => (float)$fila['latitud'],
            'longitud' => (float)$fila['longitud']
        ];
    }

    $sql = "SELECT ROUND(latitud, 2) AS latitud, ROUND(longitud, 2) AS longitud,
                   DATE_FORMAT(MAX(actualizada_en), '%Y-%m-%dT%H:%i:%sZ') AS actualizada_en
            FROM ubicaciones_vendedores
            GROUP BY ROUND(latitud, 2), ROUND(longitud, 2)";
    $resultado = $con->query($sql);

    if (!$resultado) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudieron consultar las ubicaciones.']);
        exit;
    }

    $zonas = [];
    while ($fila = $resultado->fetch_assoc()) {
        $zonas[] = [
            'latitud' => (float)$fila['latitud'],
            'longitud' => (float)$fila['longitud'],
            'actualizada_en' => $fila['actualizada_en']
        ];
    }

    echo json_encode([
        'success' => true,
        'carritos' => $carritos,
        'zonas' => $zonas
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($metodo !== 'POST' || ($_SESSION['rol'] ?? null) !== 'empleado' || empty($_SESSION['usuario_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Se requiere una sesión de vendedor activa.']);
    exit;
}

$entrada = json_decode(file_get_contents('php://input'), true);
$accion = $entrada['accion'] ?? '';
$usuarioId = (int)$_SESSION['usuario_id'];

if ($accion === 'detener') {
    $stmt = $con->prepare("DELETE FROM ubicaciones_vendedores WHERE usuario_id = ?");
    $stmt->bind_param('i', $usuarioId);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo detener el seguimiento.']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

$latitud = filter_var($entrada['latitud'] ?? null, FILTER_VALIDATE_FLOAT);
$longitud = filter_var($entrada['longitud'] ?? null, FILTER_VALIDATE_FLOAT);
if ($accion !== 'actualizar' || $latitud === false || $longitud === false ||
    $latitud < -90 || $latitud > 90 || $longitud < -180 || $longitud > 180) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La ubicación recibida no es válida.']);
    exit;
}

$stmt = $con->prepare(
    "INSERT INTO ubicaciones_vendedores (usuario_id, latitud, longitud, actualizada_en)
     VALUES (?, ?, ?, UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE latitud = VALUES(latitud), longitud = VALUES(longitud), actualizada_en = UTC_TIMESTAMP()"
);
if (!$stmt) {
    error_log('No se pudo preparar la actualización de ubicación: ' . $con->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No está disponible la tabla de ubicaciones. Importá ubicaciones_vendedores.sql en la base pochoclos_db.']);
    exit;
}

$stmt->bind_param('idd', $usuarioId, $latitud, $longitud);

if (!$stmt->execute()) {
    error_log('No se pudo guardar la ubicación del vendedor: ' . $stmt->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo guardar la ubicación. Revisá el error del servidor.']);
    exit;
}

echo json_encode(['success' => true]);
?>
