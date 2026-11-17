
<?php
session_start();
require_once 'conexion.php';

// Solo permite acceder al administrador
if (
    !isset($_SESSION['usuario_id']) ||
    ($_SESSION['rol'] ?? '') !== 'admin'
) {
    header('Location: index.html');
    exit;
}

// Obtener ventas con ubicación GPS
$sql = "SELECT
            ROUND(latitud, 5) AS latitud,
            ROUND(longitud, 5) AS longitud,
            SUM(cantidad) AS unidades,
            COUNT(*) AS operaciones
        FROM ventas
        WHERE latitud IS NOT NULL
        AND longitud IS NOT NULL
        GROUP BY ROUND(latitud, 5), ROUND(longitud, 5)";

$resultado = $con->query($sql);

$ventas = [];
$totalUnidades = 0;
$totalOperaciones = 0;

if ($resultado) {
    while ($fila = $resultado->fetch_assoc()) {

        $unidades = (int)$fila['unidades'];

        $ventas[] = [
            'lat' => (float)$fila['latitud'],
            'lng' => (float)$fila['longitud'],
            'cantidad' => $unidades,
            'operaciones' => (int)$fila['operaciones']
        ];

        $totalUnidades += $unidades;
        $totalOperaciones += (int)$fila['operaciones'];
    }
}

// Intensidad máxima
$maximo = 1;

foreach ($ventas as $venta) {
    $maximo = max($maximo, $venta['cantidad']);
}

// Centro inicial del mapa
$centro = count($ventas) > 0
    ? [$ventas[0]['lat'], $ventas[0]['lng']]
    : [-36.5417, -56.6880];

?>

<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Punto de calor - Pochoclos</title>

<link rel="stylesheet"
href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">

<style>

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #f3f4f6;
    color: #172033;
}

header {
    background: #202938;
    color: white;
    padding: 22px;
    text-align: center;
}

header h1 {
    margin: 0 0 8px;
}

.contenedor {
    width: 94%;
    max-width: 1400px;
    margin: 25px auto;
}

.estadisticas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.tarjeta {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.tarjeta small {
    color: #64748b;
}

.numero {
    font-size: 28px;
    font-weight: bold;
    margin-top: 8px;
}

.mapa-contenedor {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

#mapa {
    width: 100%;
    height: 650px;
    border-radius: 10px;
}

.leyenda {
    margin-top: 18px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.color {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    margin-right: 5px;
}

.verde { background: #22c55e; }
.amarillo { background: #facc15; }
.rojo { background: #ef4444; }

.boton {
    display: inline-block;
    background: #e11d48;
    color: white;
    padding: 11px 18px;
    border-radius: 8px;
    text-decoration: none;
    margin-bottom: 15px;
}

@media(max-width:600px) {
    #mapa {
        height: 500px;
    }
}

</style>

</head>

<body>

<header>

    <h1>🔥 Mapa de calor de ventas</h1>

    <p>
        Zonas donde se realizaron más ventas de pochoclos
    </p>

</header>

<div class="contenedor">

    <div class="estadisticas">

        <div class="tarjeta">
            <small>Unidades vendidas con GPS</small>
            <div class="numero">
                <?= number_format($totalUnidades, 0, ',', '.') ?>
            </div>
        </div>

        <div class="tarjeta">
            <small>Operaciones registradas</small>
            <div class="numero">
                <?= number_format($totalOperaciones, 0, ',', '.') ?>
            </div>
        </div>

        <div class="tarjeta">
            <small>Zonas registradas</small>
            <div class="numero">
                <?= count($ventas) ?>
            </div>
        </div>

    </div>

    <div class="mapa-contenedor">

        <a href="index.html" class="boton">
            ← Volver al panel
        </a>

        <h2>Distribución geográfica de ventas</h2>

        <p>
            Cada venta suma intensidad en el lugar donde fue realizada.
        </p>

        <div id="mapa"></div>

        <div class="leyenda">

            <span>
                <i class="color verde"></i>
                Baja concentración
            </span>

            <span>
                <i class="color amarillo"></i>
                Concentración media
            </span>

            <span>
                <i class="color rojo"></i>
                Alta concentración
            </span>

        </div>

    </div>

</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>

<script>

// Ventas obtenidas desde PHP
const ventas = <?= json_encode($ventas) ?>;

const maximo = <?= (int)$maximo ?>;

// Crear mapa
const mapa = L.map('mapa').setView(
    <?= json_encode($centro) ?>,
    15
);

// OpenStreetMap
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }
).addTo(mapa);

// Convertir ventas a puntos de calor
const puntos = ventas.map(venta => [
    venta.lat,
    venta.lng,
    venta.cantidad
]);

// Crear mapa de calor
if (puntos.length > 0) {

    L.heatLayer(puntos, {

        radius: 38,
        blur: 26,
        maxZoom: 18,
        max: maximo,

        gradient: {
            0.15: '#22c55e',
            0.45: '#a3e635',
            0.70: '#facc15',
            1.00: '#ef4444'
        }

    }).addTo(mapa);

    // Ajustar mapa a las ventas
    const limites = L.latLngBounds(
        puntos.map(p => [p[0], p[1]])
    );

    mapa.fitBounds(limites, {
        padding: [35, 35],
        maxZoom: 16
    });

    // Mostrar información al hacer clic
    ventas.forEach(venta => {

        L.circleMarker(
            [venta.lat, venta.lng],
            {
                radius: 5,
                color: '#7f1d1d',
                fillColor: '#ffffff',
                fillOpacity: 0.8
            }
        )
        .bindPopup(
            '<strong>Unidades vendidas: ' +
            venta.cantidad +
            '</strong><br>Operaciones: ' +
            venta.operaciones
        )
        .addTo(mapa);

    });

} else {

    document.getElementById('mapa').innerHTML =
        'Todavía no hay ventas con ubicación GPS.';

}

</script>

</body>
</html>
