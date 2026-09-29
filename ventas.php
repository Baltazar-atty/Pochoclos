<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

error_reporting(0);
ini_set('display_errors', 0);

require_once 'conexion.php';

$input = json_decode(file_get_contents('php://input'), true);

$producto_id = isset($input['producto_id']) ? intval($input['producto_id']) : 0;
$cantidad    = isset($input['cantidad']) ? intval($input['cantidad']) : 0;

if ($producto_id <= 0 || $cantidad <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Seleccioná un producto y una cantidad válida.'
    ]);
    exit;
}

// Obtener carrito asignado desde la sesión o usar el #1 por defecto
$carrito_id = $_SESSION['carrito_id'] ?? 1;

// 1. Obtener datos del producto
$stmtProd = $con->prepare("SELECT tipo, subtipo, precio FROM productos WHERE id = ?");
$stmtProd->bind_param("i", $producto_id);
$stmtProd->execute();
$resProd = $stmtProd->get_result();

if ($producto = $resProd->fetch_assoc()) {
    
    // 2. Insertar la venta
    $stmtVenta = $con->prepare("INSERT INTO ventas (carrito_id, producto_id, cantidad, fecha_venta) VALUES (?, ?, ?, NOW())");
    $stmtVenta->bind_param("iii", $carrito_id, $producto_id, $cantidad);

    if ($stmtVenta->execute()) {

        // Actualizar métricas de promo
        $con->query("UPDATE configuracion_promo SET ventas_hoy = ventas_hoy + $cantidad, total_ventas_historicas = total_ventas_historicas + $cantidad WHERE id = 1");

        $nombreProducto = ucfirst($producto['tipo']);
        if (!empty($producto['subtipo'])) {
            $nombreProducto .= ' (' . $producto['subtipo'] . ')';
        }

        echo json_encode([
            'success'    => true,
            'message'    => 'Venta registrada con éxito.',
            'producto'   => $nombreProducto,
            'cantidad'   => $cantidad,
            'carrito_id' => $carrito_id
        ]);

    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al guardar la venta: ' . $con->error
        ]);
    }

    $stmtVenta->close();

} else {
    echo json_encode([
        'success' => false,
        'message' => 'El producto seleccionado no existe.'
    ]);
}

$stmtProd->close();
?>