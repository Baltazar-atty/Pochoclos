<?php
session_start();
require_once 'conexion.php';

header('Content-Type: application/json');

$metodo = $_SERVER['REQUEST_METHOD'];

// 1. OBTENER LISTA DE PRODUCTOS
if ($metodo === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, tipo, subtipo, precio FROM productos");
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'productos' => $productos]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error al consultar productos']);
    }
    exit;
}

// 2. REGISTRAR VENTA
if ($metodo === 'POST') {
    if (!isset($_SESSION['rol']) || ($_SESSION['rol'] !== 'empleado' && $_SESSION['rol'] !== 'admin')) {
        echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $producto_id = intval($data['producto_id'] ?? 0);
    $cantidad = intval($data['cantidad'] ?? 1);
    $carrito_id = $_SESSION['carrito_id'] ?? 1;

    if ($producto_id <= 0 || $cantidad <= 0) {
        echo json_encode(['success' => false, 'message' => 'Datos de venta no válidos']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO ventas (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)");
        if ($stmt->execute([$carrito_id, $producto_id, $cantidad])) {
            echo json_encode(['success' => true, 'message' => '¡Venta registrada con éxito!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No se pudo guardar la venta']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error en el servidor al registrar venta']);
    }
    exit;
}
?>