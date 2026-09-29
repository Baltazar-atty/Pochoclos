<?php

session_start();
header('Content-Type: application/json');

require_once 'conexion.php';

// Verificar que haya un usuario logueado
if (!isset($_SESSION['usuario_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'No hay un usuario logueado.'
    ]);
    exit;
}

// Verificar que el empleado tenga un carrito asignado
if (empty($_SESSION['carrito_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'El usuario no tiene un carrito asignado.'
    ]);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'POST') {

    $data = json_decode(file_get_contents("php://input"), true);

    $producto_id = filter_var(
        $data['producto_id'] ?? null,
        FILTER_VALIDATE_INT
    );

    $cantidad = filter_var(
        $data['cantidad'] ?? 1,
        FILTER_VALIDATE_INT
    );

    $carrito_id = $_SESSION['carrito_id'];

    // Validar datos
    if (!$producto_id || !$cantidad || $cantidad <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Datos de venta inválidos.'
        ]);
        exit;
    }

    // Verificar que el producto exista
    $check = $con->prepare(
        "SELECT id FROM productos WHERE id = ?"
    );

    $check->bind_param("i", $producto_id);
    $check->execute();

    $resultado = $check->get_result();

    if (!$resultado->fetch_assoc()) {
        echo json_encode([
            'success' => false,
            'message' => 'El producto no existe.'
        ]);
        exit;
    }

    // Registrar venta
    $stmt = $con->prepare(
        "INSERT INTO ventas (carrito_id, producto_id, cantidad)
         VALUES (?, ?, ?)"
    );

    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al preparar la consulta: ' . $con->error
        ]);
        exit;
    }

    $stmt->bind_param(
        "iii",
        $carrito_id,
        $producto_id,
        $cantidad
    );

    if ($stmt->execute()) {

        echo json_encode([
            'success' => true,
            'message' => '¡Venta registrada correctamente!'
        ]);

    } else {

        echo json_encode([
            'success' => false,
            'message' => 'Error al registrar la venta: ' . $stmt->error
        ]);
    }

    exit;
}

echo json_encode([
    'success' => false,
    'message' => 'Método no permitido.'
]);