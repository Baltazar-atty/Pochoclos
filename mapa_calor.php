<?php

include("conexion.php");

$ventas = [];

$sql = "SELECT latitud, longitud, cantidad 
        FROM ventas 
        WHERE latitud IS NOT NULL 
        AND longitud IS NOT NULL";

$resultado = $conexion->query($sql);

if ($resultado) {

    while ($fila = $resultado->fetch_assoc()) {

        $ventas[] = [
            "lat" => (float)$fila["latitud"],
            "lng" => (float)$fila["longitud"],
            "cantidad" => (int)$fila["cantidad"]
        ];

    }

}

$conexion->close();

?>

<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Mapa de calor - Ventas</title>

    <!-- Leaflet -->
    <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />

    <style>

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #f4f4f4;
        }

        .header {
            background: #222;
            color: white;
            padding: 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
        }

        .contenedor {
            width: 95%;
            max-width: 1400px;
            margin: 20px auto;
        }

        .panel {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .panel h2 {
            margin-top: 0;
        }

        #mapa {
            width: 100%;
            height: 650px;
            border-radius: 10px;
            overflow: hidden;
        }

        .leyenda {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }

        .nivel {
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 5px;
        }

        .circulo {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 5px;
        }

        .bajo {
            background: #00ff00;
        }

        .medio {
            background: #ffff00;
        }

        .alto {
            background: #ff0000;
        }

    </style>

</head>

<body>

    <div class="header">

        <h1>Mapa de calor de ventas</h1>

        <p>
            Zonas donde se realizaron más ventas de pochoclos
        </p>

    </div>

    <div class="contenedor">

        <div class="panel">

            <h2>Mapa de ventas en la playa</h2>

            <p>
                Las zonas más intensas representan una mayor cantidad
                de ventas.
            </p>

            <div id="mapa"></div>

            <div class="leyenda">

                <strong>Intensidad de ventas:</strong>

                <div class="nivel">
                    <span class="circulo bajo"></span>
                    Baja
                </div>

                <div class="nivel">
                    <span class="circulo medio"></span>
                    Media
                </div>

                <div class="nivel">
                    <span class="circulo alto"></span>
                    Alta
                </div>

            </div>

        </div>

    </div>

    <!-- Leaflet -->
    <script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
    </script>

    <!-- Plugin Heatmap -->
    <script
        src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js">
    </script>

    <script>

        // Ventas obtenidas desde PHP
        const ventas = <?php echo json_encode($ventas); ?>;

        /*
         * Convertimos las ventas al formato
         * que necesita el mapa de calor.
         */

        const puntos = ventas.map(function(venta) {

            return [
                venta.lat,
                venta.lng,
                venta.cantidad
            ];

        });

        /*
         * Coordenadas iniciales.
         *
         * Estas coordenadas son solamente un ejemplo.
         * Después podemos poner las coordenadas exactas
         * de la playa donde trabajen los vendedores.
         */

        const mapa = L.map('mapa').setView(
            [-36.5417, -56.6880],
            15
        );

        /*
         * Mapa de OpenStreetMap
         */

        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '&copy; OpenStreetMap contributors'
            }
        ).addTo(mapa);

        /*
         * Crear mapa de calor.
         */

        if (puntos.length > 0) {

            L.heatLayer(puntos, {

                radius: 35,

                blur: 25,

                maxZoom: 17,

                max: 10,

                gradient: {
                    0.2: 'blue',
                    0.4: 'cyan',
                    0.6: 'lime',
                    0.8: 'yellow',
                    1.0: 'red'
                }

            }).addTo(mapa);

        } else {

            alert("Todavía no hay ventas con ubicación registrada.");

        }

    </script>

</body>

</html>