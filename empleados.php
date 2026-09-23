<?php
session_start();
header('Content-Type: application/json');

require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

// 1. OBTENER LISTA DE EMPLEADOS (GET)
if ($metodo === 'GET') {
    $sql = "SELECT id, nombre, apellido, email, carrito_id FROM usuarios WHERE rol = 'empleado' ORDER BY id DESC";
    $resultado = $con->query($sql);

    if ($resultado) {
        $empleados = $resultado->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'empleados' => $empleados]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al consultar empleados']);
    }
    exit;
}

// 2. CREAR NUEVO EMPLEADO (POST)
if ($metodo === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $nombre = filter_var($data['nombre'] ?? '', FILTER_SANITIZE_SPECIAL_CHARS);
    $apellido = filter_var($data['apellido'] ?? '', FILTER_SANITIZE_SPECIAL_CHARS);
    $email = filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $data['password'] ?? '';
    $carrito_id = filter_var($data['carrito_id'] ?? null, FILTER_VALIDATE_INT);

    if (empty($nombre) || empty($apellido) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
        exit;
    }

    // Verificar si el correo existe
    $check = $con->prepare("SELECT id FROM usuarios WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    if ($check->get_result()->fetch_assoc()) {
        echo json_encode(['success' => false, 'message' => 'El correo ya está registrado']);
        exit;
    }

    // Encriptar clave
    $passHash = password_hash($password, PASSWORD_BCRYPT);

    // Insertar
    $stmt = $con->prepare("INSERT INTO usuarios (nombre, apellido, email, password, rol, carrito_id) VALUES (?, ?, ?, ?, 'empleado', ?)");
    $stmt->bind_param("ssssi", $nombre, $apellido, $email, $passHash, $carrito_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Empleado registrado en la base de datos']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar el empleado']);
    }
    exit;
}

// 3. ELIMINAR EMPLEADO (DELETE)
if ($metodo === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);

    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        exit;
    }

    $stmt = $con->prepare("DELETE FROM usuarios WHERE id = ? AND rol = 'empleado'");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Empleado eliminado correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar el empleado']);
    }
    exit;
}
?>