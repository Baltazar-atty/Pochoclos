<?php
<?php
session_start();
require_once 'conexion.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'No hay un usuario logueado.'
    ]);
    exit;
}

if (empty($_SESSION['carrito_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'El usuario no tiene un carrito asignado.'
    ]);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

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

if ($metodo === 'POST') {
    if (!isset($_SESSION['rol']) || ($_SESSION['rol'] !== 'empleado' && $_SESSION['rol'] !== 'admin')) {
        echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $producto_id = filter_var($data['producto_id'] ?? null, FILTER_VALIDATE_INT);
    $cantidad = filter_var($data['cantidad'] ?? 1, FILTER_VALIDATE_INT);
    $carrito_id = $_SESSION['carrito_id'];

    if (!$producto_id || !$cantidad || $cantidad <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Datos de venta inválidos.'
        ]);
        exit;
    }

    try {
        $check = $pdo->prepare("SELECT id FROM productos WHERE id = :id");
        $check->execute([':id' => $producto_id]);

        if (!$check->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'El producto no existe.'
            ]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO ventas (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)");
        if ($stmt->execute([$carrito_id, $producto_id, $cantidad])) {
            echo json_encode([
                'success' => true,
                'message' => '¡Venta registrada correctamente!'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al registrar la venta.'
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error en el servidor al registrar venta']);
    }
    exit;
}

echo json_encode([
    'success' => false,
    'message' => 'Método no permitido.'
]);
?>
