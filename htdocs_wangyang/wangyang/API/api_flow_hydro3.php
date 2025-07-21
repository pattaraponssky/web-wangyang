<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); 
$inputDate = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

// แปลงวันที่เป็นแบบ Buddhist Era (BE)
$currentDate = new DateTime($inputDate);
$thaiYear = $currentDate->format('Y') + 543;
$formattedDate = $currentDate->format('d/m/') . $thaiYear;

// URL สำหรับเรียก API
$url = "https://hyd-app-db.rid.go.th/webservice/getDailyWaterLevelListReportAD.ashx?option=2";

// เตรียมข้อมูลสำหรับ POST request
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

// ส่งข้อมูลไปยัง API ด้วย cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
$response = curl_exec($ch);
curl_close($ch);

// ตรวจสอบข้อผิดพลาดจากการรับข้อมูล
if (!$response) {
    die('Error fetching data from the API');
}

// แปลงข้อมูล JSON ที่ได้รับ
$dataArray = json_decode($response, true);

// ตรวจสอบว่า rows มีข้อมูลหรือไม่
$rows = isset($dataArray['rows']) ? $dataArray['rows'] : [];

$dateRange = [];

for ($i = 0; $i < 7; $i++) {
    $dateRange[] = $currentDate->format('d/m/Y');
    $currentDate->sub(new DateInterval('P1D')); // ถอยวันถัดไป
}


// เตรียมข้อมูล rows ใหม่
$processedData = [];

// ฟังก์ชั่นสำหรับแยกค่าจาก string ที่คั่นด้วย '|'
function extractValue($valueString, $index = 0) {
    $values = explode('|', $valueString);
    return isset($values[$index]) ? (float)$values[$index] : 0;
}

// ประมวลผลข้อมูลจาก rows
foreach ($rows as $index => $row) {
    $newRow = [
        'ลำดับ' => $index + 1, 
        'stationcode' => $row['stationcode'], 
        'stationname' => isset($row['stationname']) ? $row['stationname'] : null, 
        'basinname' => $row['basinname'], 
        'amphurname' => $row['amphurname'], 
        'provincename' => $row['provincename'], 
        'MaxRainfallPerDay' => isset($row['MaxRainfallPerDay']) ? (float)$row['MaxRainfallPerDay'] : 0,
    ];
    
    // ใส่ข้อมูล RF1 ถึง RF7 (จากเก่าสุดไปใหม่สุด) 
    for ($i = 0; $i < 7; $i++) {
        $rfKey = "waterlevelvalueQ" . ($i + 1); // Q1 (ใหม่สุด) ถึง Q7 (เก่าสุด)
        $newRow[$dateRange[$i]] = isset($row[$rfKey]) ? extractValue($row[$rfKey], 1) : 0;
    }
    
    
    // ตรวจสอบว่ามี weekaverage หรือไม่
    $newRow['weekaverage'] = isset($row['weekaverage']) ? extractValue($row['weekaverage'], 1) : 0;
    
    // ตรวจสอบว่ามี Cumulative3D หรือไม่
    $newRow['Cumulative3D'] = isset($row['Cumulative3D']) ? extractValue($row['Cumulative3D'], 2) : 0;
    
    $processedData[] = $newRow;
    
}

// แสดงข้อมูลใหม่โดยไม่ใส่ "rows"
header('Content-Type: application/json');

// ส่งข้อมูลเป็น JSON response
echo json_encode($processedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
