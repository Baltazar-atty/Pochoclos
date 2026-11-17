<?php
require_once 'conexion.php';

$ventas = [];
$sql = "SELECT ROUND(latitud, 5) AS latitud,
               ROUND(longitud, 5) AS longitud,
               SUM(cantidad) AS unidades
        FROM ventas
        WHERE latitud IS NOT NULL
          AND longitud IS NOT NULL
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
        html, body, #mapa { width: 100%; height: 100%; margin: 0; }
        body { font-family: Arial, sans-serif; }
        .mensaje { padding: 25px; text-align: center; color: #64748b; }
    </style>
</head>
<body>
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
