<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

error_reporting(0);
ini_set('display_errors', '0');

require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

// 1. OBTENER VENTAS Y PRODUCTOS (GET)
if ($metodo === 'GET') {
    $resProductos = $con->query("SELECT id, tipo, subtipo, precio FROM productos ORDER BY id ASC");
    $productos = [];
    if ($resProductos) {
        $productos = $resProductos->fetch_all(MYSQLI_ASSOC);
    }

    echo json_encode([
        'success' => true,
        'productos' => $productos
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. REGISTRAR NUEVA VENTA (POST)
if ($metodo === 'POST') {
    if (($_SESSION['rol'] ?? null) !== 'empleado' || empty($_SESSION['usuario_id'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Iniciá sesión como vendedor para registrar una venta.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $producto_id = isset($input['producto_id']) ? intval($input['producto_id']) : 0;
    $cantidad    = isset($input['cantidad']) ? intval($input['cantidad']) : 1;
    $latitud     = isset($input['latitud']) ? filter_var($input['latitud'], FILTER_VALIDATE_FLOAT) : null;
    $longitud    = isset($input['longitud']) ? filter_var($input['longitud'], FILTER_VALIDATE_FLOAT) : null;
    $carrito_id  = (int)($_SESSION['carrito_id'] ?? 0);

    if ($producto_id <= 0 || $cantidad <= 0 || $carrito_id <= 0 ||
        ($latitud === false) || ($longitud === false) ||
        (($latitud === null) !== ($longitud === null)) ||
        ($latitud !== null && ($latitud < -90 || $latitud > 90 || $longitud < -180 || $longitud > 180))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Producto, cantidad, carrito o ubicación inválida.']);
        exit;
    }

    $con->begin_transaction();
    $stmtStock = $con->prepare("UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?");
    if (!$stmtStock) {
        $con->rollback();
        error_log('Error al preparar descuento de stock: ' . $con->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
        exit;
    }
    $stmtStock->bind_param("iii", $cantidad, $producto_id, $cantidad);
    if (!$stmtStock->execute()) {
        $con->rollback();
        error_log('Error al descontar stock: ' . $stmtStock->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
        exit;
    }
    $stockActualizado = $stmtStock->affected_rows === 1;
    $stmtStock->close();

    if (!$stockActualizado) {
        $con->rollback();
        $consultaStock = $con->prepare("SELECT stock FROM productos WHERE id = ?");
        if (!$consultaStock) {
            error_log('Error al consultar stock disponible: ' . $con->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'No se pudo verificar el stock.']);
            exit;
        }
        $consultaStock->bind_param("i", $producto_id);
        if (!$consultaStock->execute()) {
            error_log('Error al consultar stock disponible: ' . $consultaStock->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'No se pudo verificar el stock.']);
            exit;
        }
        $resultadoStock = $consultaStock->get_result()->fetch_assoc();
        $consultaStock->close();

        if (!$resultadoStock) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'El producto no existe.']);
        } else {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'Stock insuficiente. Disponibles: ' . (int)$resultadoStock['stock'] . '.'
            ]);
        }
        exit;
    }

    if ($latitud === null) {
        $stmt = $con->prepare("INSERT INTO ventas (carrito_id, producto_id, cantidad, latitud, longitud, fecha_venta) VALUES (?, ?, ?, NULL, NULL, NOW())");
        if (!$stmt) {
            $con->rollback();
            error_log('Error al preparar venta: ' . $con->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
            exit;
        }
        $stmt->bind_param("iii", $carrito_id, $producto_id, $cantidad);
    } else {
        $stmt = $con->prepare("INSERT INTO ventas (carrito_id, producto_id, cantidad, latitud, longitud, fecha_venta) VALUES (?, ?, ?, ?, ?, NOW())");
        if (!$stmt) {
            $con->rollback();
            error_log('Error al preparar venta: ' . $con->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
            exit;
        }
        $stmt->bind_param("iiidd", $carrito_id, $producto_id, $cantidad, $latitud, $longitud);
    }

    if ($stmt->execute() && $con->commit()) {
        echo json_encode(['success' => true, 'message' => '✅ Venta registrada con éxito.']);
    } else {
        $con->rollback();
        error_log('Error al guardar venta: ' . $stmt->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
    }
    $stmt->close();
    exit;
}
?>