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
    $totalVendidas = 0;

    if (isset($con) && $con) {
        $resTotal = $con->query("SELECT COALESCE(SUM(cantidad), 0) AS total FROM ventas WHERE DATE(fecha_venta) = CURDATE()");
        if ($resTotal && $row = $resTotal->fetch_assoc()) {
            $totalVendidas = (int)$row['total'];
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

// 2. REGISTRAR UNA VENTA CON UNO O VARIOS PRODUCTOS (POST)
if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $items = $input['items'] ?? [];
    $latitud = isset($input['latitud']) ? (float)$input['latitud'] : null;
    $longitud = isset($input['longitud']) ? (float)$input['longitud'] : null;
    $carrito_id = (int)($_SESSION['carrito_id'] ?? 1);

    if (!is_array($items) || count($items) === 0) {
        echo json_encode(['success' => false, 'message' => 'Seleccioná al menos un producto.']);
        exit;
    }

    // Validar todos los productos antes de guardar cualquier línea de la venta.
    $productosValidados = [];
    $stmtProducto = $con->prepare("SELECT id FROM productos WHERE id = ?");
    foreach ($items as $item) {
        $producto_id = isset($item['producto_id']) ? (int)$item['producto_id'] : 0;
        $cantidad = isset($item['cantidad']) ? (int)$item['cantidad'] : 0;

        if ($producto_id <= 0 || $cantidad <= 0) {
            echo json_encode(['success' => false, 'message' => 'Hay un producto o una cantidad inválida.']);
            $stmtProducto->close();
            exit;
        }

        $stmtProducto->bind_param("i", $producto_id);
        $stmtProducto->execute();
        $resultadoProducto = $stmtProducto->get_result();

        if (!$resultadoProducto || $resultadoProducto->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Uno de los productos seleccionados no existe.']);
            $stmtProducto->close();
            exit;
        }

        $productosValidados[] = [
            'producto_id' => $producto_id,
            'cantidad' => $cantidad
        ];
    }
    $stmtProducto->close();

    // Guardar todas las líneas juntas: si una falla, se revierte la operación completa.
    $con->begin_transaction();

    try {
        $stmtVenta = $con->prepare(
            "INSERT INTO ventas (carrito_id, producto_id, cantidad, latitud, longitud, fecha_venta)
             VALUES (?, ?, ?, ?, ?, NOW())"
        );

        foreach ($productosValidados as $itemValidado) {
            $producto_id = $itemValidado['producto_id'];
            $cantidad = $itemValidado['cantidad'];
            $stmtVenta->bind_param("iiidd", $carrito_id, $producto_id, $cantidad, $latitud, $longitud);

            if (!$stmtVenta->execute()) {
                throw new Exception('No se pudo guardar uno de los productos.');
            }
        }

        $stmtVenta->close();
        $con->commit();

        echo json_encode([
            'success' => true,
            'message' => '✅ Venta registrada con ' . count($productosValidados) . ' producto(s).'
        ], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        $con->rollback();
        echo json_encode([
            'success' => false,
            'message' => 'No se pudo registrar la venta completa. No se guardaron cambios.'
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}
?>