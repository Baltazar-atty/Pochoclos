<?php
session_start();

if (($_SESSION['rol'] ?? null) !== 'admin') {
    http_response_code(403);
    exit('Acceso restringido.');
}

require_once 'conexion.php';

$periodos = ['hoy', '3', '7', 'todas'];
$periodo = $_GET['periodo'] ?? '7';
if (!in_array($periodo, $periodos, true)) {
    $periodo = '7';
}

$filtroFecha = match ($periodo) {
    'hoy' => ' AND DATE(fecha_venta) = CURDATE()',
    '3' => ' AND fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 2 DAY)',
    '7' => ' AND fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)',
    default => ''
};

$ventas = [];
$sql = "SELECT ROUND(latitud, 5) AS latitud,
               ROUND(longitud, 5) AS longitud,
               SUM(cantidad) AS unidades
        FROM ventas
        WHERE latitud IS NOT NULL
          AND longitud IS NOT NULL
          AND NOT (latitud = -36.53000000 AND longitud = -56.69000000)
          $filtroFecha
        GROUP BY ROUND(latitud, 5), ROUND(longitud, 5)";
$resultado = $con->query($sql);

if ($resultado) {
    while ($fila = $resultado->fetch_assoc()) {
        $ventas[] = [
            'lat' => (float) $fila['latitud'],
            'lng' => (float) $fila['longitud'],
            'cantidad' => (int) $fila['unidades']
        ];
    }
}

$con->close();

$centro = count($ventas) > 0
    ? [$ventas[0]['lat'], $ventas[0]['lng']]
    : [-36.5417, -56.6880];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapa de calor</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <style>
        html, body { width: 100%; min-height: 100%; margin: 0; }
        body { font-family: Arial, sans-serif; display: flex; flex-direction: column; }
        .filtros { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px; background: #fff; }
        .filtros label { color: #475569; font-size: 0.9rem; font-weight: 600; }
        .filtros select { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; font: inherit; }
        #mapa { width: 100%; height: calc(100vh - 48px); min-height: 300px; }
        .mensaje { padding: 25px; text-align: center; color: #64748b; }
    </style>
</head>
<body>
    <form class="filtros" method="get">
        <label for="filtro-periodo">Mostrar ventas:</label>
        <select id="filtro-periodo" name="periodo" onchange="this.form.submit()">
            <option value="hoy" <?= $periodo === 'hoy' ? 'selected' : '' ?>>Hoy</option>
            <option value="3" <?= $periodo === '3' ? 'selected' : '' ?>>Últimos 3 días</option>
            <option value="7" <?= $periodo === '7' ? 'selected' : '' ?>>Últimos 7 días</option>
            <option value="todas" <?= $periodo === 'todas' ? 'selected' : '' ?>>Todas</option>
        </select>
    </form>
    <div id="mapa"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
    <script>
        const ventas = <?= json_encode($ventas, JSON_UNESCAPED_UNICODE) ?>;
        const mapa = L.map('mapa').setView(<?= json_encode($centro) ?>, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapa);

        const puntos = ventas.map(v => [v.lat, v.lng, v.cantidad]);

        if (puntos.length > 0) {
            L.heatLayer(puntos, {
                radius: 38,
                blur: 26,
                maxZoom: 18,
                max: Math.max(...ventas.map(v => v.cantidad)),
                gradient: {
                    0.2: '#22c55e',
                    0.5: '#facc15',
                    1.0: '#ef4444'
                }
            }).addTo(mapa);

            const limites = L.latLngBounds(puntos.map(p => [p[0], p[1]]));
            mapa.fitBounds(limites, { padding: [35, 35], maxZoom: 16 });

            ventas.forEach(v => {
                L.circleMarker([v.lat, v.lng], {
                    radius: 5,
                    color: '#7f1d1d',
                    fillColor: '#ffffff',
                    fillOpacity: 0.9
                }).bindPopup('<strong>Unidades: ' + v.cantidad + '</strong>').addTo(mapa);
            });
        } else {
            document.getElementById('mapa').innerHTML =
                '<div class="mensaje">Todavía no hay ventas con ubicación GPS.</div>';
        }

        setTimeout(() => mapa.invalidateSize(), 200);
    </script>
</body>
</html>
