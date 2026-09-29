<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

// Desactivar impresión de errores HTML para no romper el JSON
error_reporting(0);
ini_set('display_errors', 0);

require_once 'conexion.php';

// Leer datos JSON entrantes
$data = json_decode(file_get_contents("php://input"), true);

$email    = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($email) || empty($password)) {
    echo json_encode([
        'success' => false,
        'message' => 'Completa todos los campos.'
    ]);
    exit;
}

// Consulta preparada en MySQLi
$stmt = $con->prepare("SELECT id, email, nombre, apellido, password, rol, carrito_id FROM usuarios WHERE email = ?");

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Error en la consulta SQL: ' . $con->error
    ]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();
$resultado = $stmt->get_result();

if ($usuario = $resultado->fetch_assoc()) {

    // Verificar contraseña encriptada
    if (password_verify($password, $usuario['password'])) {

        // Guardar variables de sesión clave
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['nombre']     = $usuario['nombre'];
        $_SESSION['rol']        = $usuario['rol'];
        $_SESSION['carrito_id'] = $usuario['carrito_id'];

        echo json_encode([
            'success'    => true,
            'rol'        => $usuario['rol'],
            'nombre'     => $usuario['nombre'],
            'carrito_id' => $usuario['carrito_id']
        ]);

    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Credenciales incorrectas.'
        ]);
    }

} else {
    echo json_encode([
        'success' => false,
        'message' => 'Credenciales incorrectas.'
    ]);
}

$stmt->close();
?>