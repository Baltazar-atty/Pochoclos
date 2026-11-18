<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (($_SESSION['rol'] ?? null) !== 'admin' || empty($_SESSION['usuario_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso restringido.']);
    exit;
}

require_once 'conexion.php';
mysqli_report(MYSQLI_REPORT_OFF);

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $resultado = $con->query("SELECT id, tipo, subtipo, precio, stock FROM productos ORDER BY id ASC");
    if (!$resultado) {
        $codigoError = $con->errno;
        error_log('Error al consultar productos del inventario: ' . $con->error);
        http_response_code(500);
        $mensaje = $codigoError === 1054
            ? 'La base de datos no está actualizada. Ejecutá inventario_migracion.sql.'
            : 'No se pudieron consultar los productos del inventario.';
        echo json_encode(['success' => false, 'message' => $mensaje]);
        exit;
    }

    $resultadoInsumos = $con->query("SELECT id, nombre, unidad, imagen, stock FROM insumos ORDER BY id ASC");
    if (!$resultadoInsumos) {
        $codigoError = $con->errno;
        error_log('Error al consultar materias primas: ' . $con->error);
        http_response_code(500);
        $mensaje = $codigoError === 1146 || $codigoError === 1054
            ? 'Falta crear la tabla de materias primas. Ejecutá inventario_migracion.sql.'
            : 'No se pudieron consultar las materias primas.';
        echo json_encode(['success' => false, 'message' => $mensaje]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'productos' => $resultado->fetch_all(MYSQLI_ASSOC),
        'insumos' => $resultadoInsumos->fetch_all(MYSQLI_ASSOC)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $productoId = filter_var($input['producto_id'] ?? null, FILTER_VALIDATE_INT);
    $insumoId = filter_var($input['insumo_id'] ?? null, FILTER_VALIDATE_INT);
    $stock = filter_var($input['stock'] ?? null, FILTER_VALIDATE_INT);

    $actualizarInsumo = $insumoId !== false && $insumoId !== null && $insumoId > 0;
    if (($actualizarInsumo && ($productoId !== false && $productoId !== null)) ||
        (!$actualizarInsumo && ($productoId === false || $productoId === null || $productoId <= 0)) ||
        $stock === false || $stock === null || $stock < 0 || $stock > 2147483647) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El elemento y el stock deben ser válidos.']);
        exit;
    }

    $elementoId = $actualizarInsumo ? $insumoId : $productoId;
    $tabla = $actualizarInsumo ? 'insumos' : 'productos';
    $actualizar = $con->prepare("UPDATE $tabla SET stock = ? WHERE id = ?");
    if (!$actualizar) {
        error_log('Error al preparar actualización de inventario: ' . $con->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo actualizar el inventario.']);
        exit;
    }
    $actualizar->bind_param('ii', $stock, $elementoId);
    if (!$actualizar->execute()) {
        error_log('Error al actualizar inventario: ' . $actualizar->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo actualizar el inventario.']);
        exit;
    }
    $actualizar->close();

    $consulta = $actualizarInsumo
        ? $con->prepare("SELECT nombre, unidad FROM insumos WHERE id = ?")
        : $con->prepare("SELECT tipo, subtipo FROM productos WHERE id = ?");
    if (!$consulta) {
        error_log('Error al verificar producto de inventario: ' . $con->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo verificar el producto.']);
        exit;
    }
    $consulta->bind_param('i', $elementoId);
    if (!$consulta->execute()) {
        error_log('Error al verificar producto de inventario: ' . $consulta->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo verificar el producto.']);
        exit;
    }
    $producto = $consulta->get_result()->fetch_assoc();
    $consulta->close();

    if (!$producto) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'El producto no existe.']);
        exit;
    }

    $nombre = $actualizarInsumo
        ? $producto['nombre']
        : ($producto['tipo'] === 'maletin' ? 'Maletín ' . $producto['subtipo'] : $producto['tipo']);
    echo json_encode([
        'success' => true,
        'message' => 'Stock actualizado correctamente.',
        'producto' => $nombre,
        'unidad' => $actualizarInsumo ? $producto['unidad'] : 'unidades',
        'stock' => $stock
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
header('Allow: GET, POST');
echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
?>
