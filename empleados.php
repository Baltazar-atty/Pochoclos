<?php
session_start();
require_once 'conexion.php';

header('Content-Type: application/json');

// Validar que sea Admin
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

// 1. OBTENER LISTA DE EMPLEADOS
if ($metodo === 'GET') {
    $stmt = $pdo->query("
        SELECT u.id, u.nombre, u.apellido, u.email, c.nombre AS carrito_nombre 
        FROM usuarios u 
        LEFT JOIN carritos c ON u.carrito_id = c.id 
        WHERE u.rol = 'empleado'
    ");
    echo json_encode(['success' => true, 'empleados' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// 2. CREAR UN EMPLEADO NUEVO
if ($metodo === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $nombre = trim($data['nombre']);
    $apellido = trim($data['apellido']);
    $email = trim($data['email']);
    $password = password_hash($data['password'], PASSWORD_BCRYPT);
    $carrito_id = !empty($data['carrito_id']) ? $data['carrito_id'] : null;

    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, apellido, email, password, rol, carrito_id) VALUES (?, ?, ?, ?, 'empleado', ?)");
    if ($stmt->execute([$nombre, $apellido, $email, $password, $carrito_id])) {
        echo json_encode(['success' => true, 'message' => 'Empleado creado correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al crear el empleado']);
    }
}

// 3. ELIMINAR UN EMPLEADO
if ($metodo === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id_empleado = intval($data['id']);

    $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ? AND rol = 'empleado'");
    if ($stmt->execute([$id_empleado])) {
        echo json_encode(['success' => true, 'message' => 'Empleado eliminado']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar']);
    }
}