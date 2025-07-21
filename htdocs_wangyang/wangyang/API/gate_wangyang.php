<?php
// ตั้งค่า Header ให้รองรับ JSON
header('Content-Type: application/json');

// โหลดข้อมูลจากไฟล์ JSON
$jsonFile = 'C:\xampp\htdocs\website\ras-output\gate_api.json';


if (!file_exists($jsonFile)) {
    http_response_code(404);
    echo json_encode(["error" => "ไม่พบไฟล์ข้อมูล"]);
    exit;
}

// อ่านและส่งออก JSON
$jsonData = file_get_contents($jsonFile);
echo $jsonData;
