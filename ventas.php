<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

error_reporting(0);
ini_set('display_errors', '0');

require_once 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

// Reporte de ventas diario para administradores.
if ($metodo === 'GET' && ($_GET['accion'] ?? '') === 'reporte_admin') {
    if (($_SESSION['rol'] ?? null) !== 'admin' || empty($_SESSION['usuario_id'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso restringido.']);
        exit;
    }

    mysqli_report(MYSQLI_REPORT_OFF);
    $resultadoFecha = $con->query("SELECT CURDATE() AS fecha_hoy");
    if (!$resultadoFecha) {
        error_log('Error al obtener la fecha para el reporte de ventas: ' . $con->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo cargar el reporte de ventas.']);
        exit;
    }
    $fechaHoy = $resultadoFecha->fetch_assoc()['fecha_hoy'];
    $fechaComparacion = trim((string)($_GET['fecha_comparacion'] ?? ''));
    if ($fechaComparacion === '') {
        $fechaComparacion = (new DateTimeImmutable($fechaHoy))->modify('-1 day')->format('Y-m-d');
    }

    $fechaValidada = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaComparacion);
    if (!$fechaValidada || $fechaValidada->format('Y-m-d') !== $fechaComparacion || $fechaComparacion >= $fechaHoy) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Elegí una fecha válida anterior a hoy para comparar.']);
        exit;
    }

    $carritoId = null;
    $filtroCarrito = (string)($_GET['carrito_id'] ?? 'todos');
    if ($filtroCarrito !== 'todos') {
        $carritoId = filter_var($filtroCarrito, FILTER_VALIDATE_INT);
        if ($carritoId === false || $carritoId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El carrito seleccionado no es válido.']);
            exit;
        }
    }

    $resultadoCarritos = $con->query("SELECT id, nombre FROM carritos ORDER BY id ASC");
    if (!$resultadoCarritos) {
        error_log('Error al consultar carritos para el reporte de ventas: ' . $con->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudieron cargar los carritos.']);
        exit;
    }
    $carritos = $resultadoCarritos->fetch_all(MYSQLI_ASSOC);

    if ($carritoId !== null) {
        $carritoExiste = false;
        foreach ($carritos as $carrito) {
            if ((int)$carrito['id'] === $carritoId) {
                $carritoExiste = true;
                break;
            }
        }
        if (!$carritoExiste) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El carrito seleccionado no existe.']);
            exit;
        }
    }

    $sql = "SELECT v.id, v.carrito_id, COALESCE(c.nombre, CONCAT('Carrito #', v.carrito_id)) AS carrito_nombre,
                   COALESCE(p.tipo, 'Producto') AS tipo, p.subtipo, v.cantidad,
                   DATE_FORMAT(v.fecha_venta, '%H:%i') AS hora, DATE(v.fecha_venta) AS fecha
            FROM ventas v
            LEFT JOIN carritos c ON c.id = v.carrito_id
            LEFT JOIN productos p ON p.id = v.producto_id
            WHERE DATE(v.fecha_venta) IN (?, ?)";
    if ($carritoId !== null) {
        $sql .= " AND v.carrito_id = ?";
    }
    $sql .= " ORDER BY v.fecha_venta DESC, v.id DESC";

    $stmtVentas = $con->prepare($sql);
    if (!$stmtVentas) {
        error_log('Error al preparar el reporte de ventas: ' . $con->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo cargar el reporte de ventas.']);
        exit;
    }
    if ($carritoId === null) {
        $stmtVentas->bind_param('ss', $fechaHoy, $fechaComparacion);
    } else {
        $stmtVentas->bind_param('ssi', $fechaHoy, $fechaComparacion, $carritoId);
    }
    if (!$stmtVentas->execute()) {
        error_log('Error al consultar el reporte de ventas: ' . $stmtVentas->error);
        $stmtVentas->close();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo cargar el reporte de ventas.']);
        exit;
    }

    $ventasPorFecha = [
        $fechaHoy => ['ventas' => [], 'resumen' => ['registros' => 0, 'unidades' => 0]],
        $fechaComparacion => ['ventas' => [], 'resumen' => ['registros' => 0, 'unidades' => 0]]
    ];
    $resultadoVentas = $stmtVentas->get_result();
    while ($venta = $resultadoVentas->fetch_assoc()) {
        $fecha = $venta['fecha'];
        $cantidad = (int)$venta['cantidad'];
        $ventasPorFecha[$fecha]['ventas'][] = [
            'id' => (int)$venta['id'],
            'carrito_id' => (int)$venta['carrito_id'],
            'carrito_nombre' => $venta['carrito_nombre'],
            'tipo' => $venta['tipo'],
            'subtipo' => $venta['subtipo'],
            'cantidad' => $cantidad,
            'hora' => $venta['hora']
        ];
        $ventasPorFecha[$fecha]['resumen']['registros']++;
        $ventasPorFecha[$fecha]['resumen']['unidades'] += $cantidad;
    }
    $stmtVentas->close();

    echo json_encode([
        'success' => true,
        'fecha_hoy' => $fechaHoy,
        'fecha_comparacion' => $fechaComparacion,
        'carritos' => $carritos,
        'ventas_hoy' => $ventasPorFecha[$fechaHoy]['ventas'],
        'resumen_hoy' => $ventasPorFecha[$fechaHoy]['resumen'],
        'ventas_comparacion' => $ventasPorFecha[$fechaComparacion]['ventas'],
        'resumen_comparacion' => $ventasPorFecha[$fechaComparacion]['resumen']
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. OBTENER VENTAS Y PRODUCTOS (GET)
if ($metodo === 'GET') {
    $resProductos = $con->query("SELECT id, tipo, subtipo, precio FROM productos ORDER BY id ASC");
    $productos = [];
    if ($resProductos) {
        $productos = $resProductos->fetch_all(MYSQLI_ASSOC);
    }

    echo json_encode([
        'success' => true,
        'productos' => $productos
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. REGISTRAR NUEVA VENTA (POST)
if ($metodo === 'POST') {
    if (($_SESSION['rol'] ?? null) !== 'empleado' || empty($_SESSION['usuario_id'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Iniciá sesión como vendedor para registrar una venta.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $producto_id = isset($input['producto_id']) ? intval($input['producto_id']) : 0;
    $cantidad    = isset($input['cantidad']) ? intval($input['cantidad']) : 1;
    $latitud     = isset($input['latitud']) ? filter_var($input['latitud'], FILTER_VALIDATE_FLOAT) : null;
    $longitud    = isset($input['longitud']) ? filter_var($input['longitud'], FILTER_VALIDATE_FLOAT) : null;
    $carrito_id  = (int)($_SESSION['carrito_id'] ?? 0);

    if ($producto_id <= 0 || $cantidad <= 0 || $carrito_id <= 0 ||
        ($latitud === false) || ($longitud === false) ||
        (($latitud === null) !== ($longitud === null)) ||
        ($latitud !== null && ($latitud < -90 || $latitud > 90 || $longitud < -180 || $longitud > 180))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Producto, cantidad, carrito o ubicación inválida.']);
        exit;
    }

    $con->begin_transaction();
    $stmtStock = $con->prepare("UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?");
    if (!$stmtStock) {
        $con->rollback();
        error_log('Error al preparar descuento de stock: ' . $con->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
        exit;
    }
    $stmtStock->bind_param("iii", $cantidad, $producto_id, $cantidad);
    if (!$stmtStock->execute()) {
        $con->rollback();
        error_log('Error al descontar stock: ' . $stmtStock->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
        exit;
    }
    $stockActualizado = $stmtStock->affected_rows === 1;
    $stmtStock->close();

    if (!$stockActualizado) {
        $con->rollback();
        $consultaStock = $con->prepare("SELECT stock FROM productos WHERE id = ?");
        if (!$consultaStock) {
            error_log('Error al consultar stock disponible: ' . $con->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'No se pudo verificar el stock.']);
            exit;
        }
        $consultaStock->bind_param("i", $producto_id);
        if (!$consultaStock->execute()) {
            error_log('Error al consultar stock disponible: ' . $consultaStock->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'No se pudo verificar el stock.']);
            exit;
        }
        $resultadoStock = $consultaStock->get_result()->fetch_assoc();
        $consultaStock->close();

        if (!$resultadoStock) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'El producto no existe.']);
        } else {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'Stock insuficiente. Disponibles: ' . (int)$resultadoStock['stock'] . '.'
            ]);
        }
        exit;
    }

    if ($latitud === null) {
        $stmt = $con->prepare("INSERT INTO ventas (carrito_id, producto_id, cantidad, latitud, longitud, fecha_venta) VALUES (?, ?, ?, NULL, NULL, NOW())");
        if (!$stmt) {
            $con->rollback();
            error_log('Error al preparar venta: ' . $con->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
            exit;
        }
        $stmt->bind_param("iii", $carrito_id, $producto_id, $cantidad);
    } else {
        $stmt = $con->prepare("INSERT INTO ventas (carrito_id, producto_id, cantidad, latitud, longitud, fecha_venta) VALUES (?, ?, ?, ?, ?, NOW())");
        if (!$stmt) {
            $con->rollback();
            error_log('Error al preparar venta: ' . $con->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
            exit;
        }
        $stmt->bind_param("iiidd", $carrito_id, $producto_id, $cantidad, $latitud, $longitud);
    }

    if ($stmt->execute() && $con->commit()) {
        echo json_encode(['success' => true, 'message' => '✅ Venta registrada con éxito.']);
    } else {
        $con->rollback();
        error_log('Error al guardar venta: ' . $stmt->error);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo registrar la venta.']);
    }
    $stmt->close();
    exit;
}
?>