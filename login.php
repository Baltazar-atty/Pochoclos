<?php

session_start();

header('Content-Type: application/json; charset=utf-8');

require_once 'conexion.php';


$data = json_decode(
    file_get_contents("php://input"),
    true
);


$email = filter_var(
    $data['email'] ?? '',
    FILTER_SANITIZE_EMAIL
);

$password = $data['password'] ?? '';


if (empty($email) || empty($password)) {

    echo json_encode([
        'success' => false,
        'message' => 'Completa todos los campos'
    ]);

    exit;
}


$stmt = $con->prepare(
    "SELECT
        id,
        email,
        nombre,
        apellido,
        password,
        rol,
        carrito_id
     FROM usuarios
     WHERE email = ?"
);


if (!$stmt) {

    echo json_encode([
        'success' => false,
        'message' => 'Error en la consulta SQL: ' . $con->error
    ]);

    exit;
}


$stmt->bind_param(
    "s",
    $email
);

$stmt->execute();

$resultado = $stmt->get_result();


if ($usuario = $resultado->fetch_assoc()) {


    if (
        password_verify(
            $password,
            $usuario['password']
        )
    ) {


        // Guardar datos en sesión
        $_SESSION['usuario_id'] =
            $usuario['id'];

        $_SESSION['nombre'] =
            $usuario['nombre'];

        $_SESSION['rol'] =
            $usuario['rol'];

        $_SESSION['carrito_id'] =
            $usuario['carrito_id'];


        echo json_encode([

            'success' => true,

            'rol' =>
                $usuario['rol'],

            'nombre' =>
                $usuario['nombre'],

            'carrito_id' =>
                $usuario['carrito_id']

        ]);


    } else {

        echo json_encode([
            'success' => false,
            'message' => 'Contraseña incorrecta'
        ]);

    }


} else {

    echo json_encode([
        'success' => false,
        'message' => 'Usuario no encontrado'
    ]);

}

$stmt->close();

?>