<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "pochoclos_db";

$con = new mysqli($host, $user, $pass, $db);

if ($con->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
echo "Conexión exitosa";

?> 