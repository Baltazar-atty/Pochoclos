<?php
session_start();
require_once 'conexion.php'; // Tu archivo PDO de conexión

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

$email = filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Completa todos los campos']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, nombre, apellido, password, rol, carrito_id FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

if ($usuario && password_verify($password, $usuario['password'])) {
    // Iniciar sesión
    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['nombre'] = $usuario['nombre'];
    $_SESSION['rol'] = $usuario['rol'];
    $_SESSION['carrito_id'] = $usuario['carrito_id'];

    echo json_encode([
        'success' => true,
        'rol' => $usuario['rol'],
        'nombre' => $usuario['nombre'],
        'carrito_id' => $usuario['carrito_id']
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas']);
}