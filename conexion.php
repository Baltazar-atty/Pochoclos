<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pochoclos_db";

$con = mysqli_connect($host, $user, $pass, $db);

if (!$con) {
    echo "ERROR_CONEXION: " . mysqli_connect_error();
    exit;
}

mysqli_set_charset($con, "utf8mb4");
?>