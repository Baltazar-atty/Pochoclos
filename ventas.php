<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

error_reporting(0);
ini_set('display_errors', '0');

require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

// 1. OBTENER VENTAS Y PRODUCTOS (GET)
if ($metodo === 'GET') {
    $totalVendidas = 50; // Valor demostrativo para mostrar 50% en la barra

    if (isset($con) && $con) {
        $resTotal = $con->query("SELECT SUM(cantidad) AS total FROM ventas");
        if ($resTotal && $row = $resTotal->fetch_assoc()) {
            if (!empty($row['total']) && (int)$row['total'] > 0) {
                $totalVendidas = (int)$row['total'];
            }
        }

        $resProductos = $con->query("SELECT id, tipo, subtipo, precio FROM productos ORDER BY id ASC");
        $productos = [];
        if ($resProductos) {
            $productos = $resProductos->fetch_all(MYSQLI_ASSOC);
        }
    }

    echo json_encode([
        'success' => true,
        'total_vendidas' => $totalVendidas,
        'productos' => $productos ?? []
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. REGISTRAR NUEVA VENTA (POST)
if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $producto_id = isset($input['producto_id']) ? intval($input['producto_id']) : 0;
    $cantidad    = isset($input['cantidad']) ? intval($input['cantidad']) : 1;
    $latitud     = isset($input['latitud']) ? floatval($input['latitud']) : null;
    $longitud    = isset($input['longitud']) ? floatval($input['longitud']) : null;
    $carrito_id  = $_SESSION['carrito_id'] ?? 1;

    if ($producto_id <= 0 || $cantidad <= 0) {
        echo json_encode(['success' => false, 'message' => 'Producto o cantidad inválida.']);
        exit;
    }

    $stmt = $con->prepare("INSERT INTO ventas (carrito_id, producto_id, cantidad, latitud, longitud, fecha_venta) VALUES (?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("iiidd", $carrito_id, $producto_id, $cantidad, $latitud, $longitud);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => '✅ Venta registrada con éxito.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar venta: ' . $con->error]);
    }
    $stmt->close();
    exit;
}
?>