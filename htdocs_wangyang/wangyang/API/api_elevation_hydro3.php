<?php
// ป้องกัน error ที่รั่วออกมาก่อนส่ง header
ob_start();

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// รับวันที่จาก query หรือใช้วันนี้
$inputDate = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

// แปลงวันที่เป็น พ.ศ.
$currentDate = new DateTime($inputDate);
$thaiYear = $currentDate->format('Y') + 543;
$formattedDate = $currentDate->format('d/m/') . $thaiYear;

// เตรียม POST ไป API
$url = "https://hyd-app-db.rid.go.th/webservice/getDailyWaterLevelListReportMSL.ashx?option=2";
$data = [
    "option" => 2,
    "DW[UtokID]" => 3,
    "DW[TimeCurrent]" => $formattedDate,
    "_search" => "false",
    "nd" => time() * 1000,
    "rows" => 1000,
    "page" => 1,
    "sidx" => "indexcount",
    "sord" => "asc"
];

// เรียก API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
$response = curl_exec($ch);
curl_close($ch);

// ตรวจสอบการดึงข้อมูล
if (!$response) {
    http_response_code(500);
    echo json_encode(['error' => 'Error fetching data from the API']);
    exit;
}

// แปลง JSON
$dataArray = json_decode($response, true);
$rows = isset($dataArray['rows']) ? $dataArray['rows'] : [];

// เตรียมวันที่ย้อนหลัง 7 วัน
$dateRange = [];
$tempDate = clone $currentDate;
for ($i = 8; $i >= 0; $i--) {
    $dateRange[$i] = $tempDate->format('d/m/Y');
    $tempDate->sub(new DateInterval('P1D'));
}
$dateRange = array_values($dateRange);

// ฟังก์ชันแยกค่าจาก string ที่มี | ป้องกัน null
function extractValue($valueString, $index = 0) {
    if (!is_string($valueString)) return 0;
    $values = explode('|', $valueString);
    return isset($values[$index]) ? (float)$values[$index] : 0;
}

// เตรียมข้อมูลผลลัพธ์
$processedData = [];

foreach ($rows as $index => $row) {
    $newRow = [
        'ลำดับ' => $index + 1,
        'stationcode' => $row['stationcode'] ?? '',
        'stationname' => $row['stationname'] ?? '',
        'basinname' => $row['basinname'] ?? '',
        'amphurname' => $row['amphurname'] ?? '',
        'provincename' => $row['provincename'] ?? '',
        'MaxRainfallPerDay' => isset($row['MaxRainfallPerDay']) ? (float)$row['MaxRainfallPerDay'] : 0,
    ];

    // ใส่ RF1 ถึง RF7
    for ($i = 1; $i <= 7; $i++) {
        $rfKey = "waterlevelvalueQ" . $i;
        $newRow[$dateRange[$i - 1]] = extractValue($row[$rfKey] ?? null, 0);
    }

    // ใส่ average และ Cumulative อย่างปลอดภัย
    $newRow['weekaverage'] = extractValue($row['weekaverage'] ?? null, 0);
    $newRow['Cumulative3D'] = extractValue($row['Cumulative3D'] ?? null, 0);

    $processedData[] = $newRow;
}

// ส่งข้อมูล
header('Content-Type: application/json');
echo json_encode($processedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
ob_end_flush();
