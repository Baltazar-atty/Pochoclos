<?php
header('Content-Type: application/json');

require_once 'conexion.php';

// 1. Obtener la lista de carritos desde la BD
$carritos = [];
$res_carritos = $con->query("SELECT id, nombre, ubicacion FROM carritos ORDER BY id ASC");
if ($res_carritos) {
    while ($row = $res_carritos->fetch_assoc()) {
        $carritos[] = $row;
    }
}

// 2. Parámetro de filtrado por carrito
$carrito_id = isset($_GET['carrito_id']) && $_GET['carrito_id'] !== 'todos' ? intval($_GET['carrito_id']) : null;

// Días de la semana en español
$dias_semana = [
    'Sunday'    => 'Domingo',
    'Monday'    => 'Lunes',
    'Tuesday'   => 'Martes',
    'Wednesday' => 'Miércoles',
    'Thursday'  => 'Jueves',
    'Friday'    => 'Viernes',
    'Saturday'  => 'Sábado'
];

$fechas_5_dias = [];
for ($i = 4; $i >= 0; $i--) {
    $fecha_str = date('Y-m-d', strtotime("-$i days"));
    $nombre_dia_ing = date('l', strtotime($fecha_str));
    $etiqueta = ($i === 0) ? 'Hoy 🔥' : ($dias_semana[$nombre_dia_ing] ?? $nombre_dia_ing);
    
    $fechas_5_dias[$fecha_str] = [
        'fecha' => $fecha_str,
        'etiqueta' => $etiqueta,
        'total' => 0,
        'es_hoy' => ($i === 0)
    ];
}

// 3. Consultar las ventas de los últimos 5 días
if ($carrito_id) {
    $sql = "SELECT DATE(fecha_venta) as fecha, SUM(cantidad) as total_vendido 
            FROM ventas 
            WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 4 DAY) AND carrito_id = ? 
            GROUP BY DATE(fecha_venta)";
    $stmt = $con->prepare($sql);
    $stmt->bind_param("i", $carrito_id);
    $stmt->execute();
    $resultado = $stmt->get_result();
} else {
    $sql = "SELECT DATE(fecha_venta) as fecha, SUM(cantidad) as total_vendido 
            FROM ventas 
            WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 4 DAY) 
            GROUP BY DATE(fecha_venta)";
    $resultado = $con->query($sql);
}

if ($resultado) {
    while ($fila = $resultado->fetch_assoc()) {
        $fecha_bd = $fila['fecha'];
        if (isset($fechas_5_dias[$fecha_bd])) {
            $fechas_5_dias[$fecha_bd]['total'] = intval($fila['total_vendido']);
        }
    }
}

$estadisticas = array_values($fechas_5_dias);

// Calcular la escala máxima para el gráfico
$max_ventas = 0;
foreach ($estadisticas as $est) {
    if ($est['total'] > $max_ventas) {
        $max_ventas = $est['total'];
    }
}

echo json_encode([
    'success' => true,
    'carritos' => $carritos,
    'max_ventas' => $max_ventas > 0 ? $max_ventas : 1,
    'datos' => $estadisticas
]);
?>