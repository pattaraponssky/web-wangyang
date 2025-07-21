<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); 
// ฟังก์ชั่นสำหรับแยกค่าจาก string ที่คั่นด้วย '|'
function extractValue($valueString, $index = 0) {
    $values = explode('|', $valueString);
    return isset($values[$index]) ? (float)$values[$index] : 0;
}

// ฟังก์ชั่นเรียก API พร้อมส่งวันที่ (แปลงเป็น พ.ศ.)
function fetchDailyData($date) {
    $thaiYear = $date->format('Y') + 543;
    $formattedDate = $date->format('d/m/') . $thaiYear;

    $url = "https://hyd-app-db.rid.go.th/webservice/getDailyWaterLevelListReportAD.ashx?option=2";
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

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    $response = curl_exec($ch);
    curl_close($ch);

    if (!$response) return [];

    $decoded = json_decode($response, true);
    return isset($decoded['rows']) ? $decoded['rows'] : [];
}

// รับวันที่จาก query หรือใช้วันนี้
$inputDate = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$currentDate = new DateTime($inputDate);

// เตรียมเก็บชื่อวันที่และข้อมูล
$dateLabels = [];
$allData = [];

for ($i = 0; $i < 8; $i++) {
    $dateStr = $currentDate->format('d/m/Y');
    $dateLabels[] = $dateStr;
    $rows = fetchDailyData($currentDate);

    foreach ($rows as $row) {
        $code = $row['stationcode'];

        if (!isset($allData[$code])) {
            $allData[$code] = [
                'stationcode' => $code,
                'stationname' => $row['stationname'] ?? null,
                'basinname' => $row['basinname'],
                'amphurname' => $row['amphurname'],
                'provincename' => $row['provincename'],
                'MaxRainfallPerDay' => isset($row['MaxRainfallPerDay']) ? (float)$row['MaxRainfallPerDay'] : 0,
                'weekaverage' => isset($row['weekaverage']) ? extractValue($row['weekaverage'], 1) : 0,
                'Cumulative3D' => isset($row['Cumulative3D']) ? extractValue($row['Cumulative3D'], 2) : 0,
            ];
        }

        // ดึงค่าฝนจาก waterlevelvalueQ1 (ใหม่สุดของวัน)
        $rainVal = isset($row['waterlevelvalueQ1']) ? extractValue($row['waterlevelvalueQ1'], 1) : 0;
        $allData[$code][$dateStr] = $rainVal;
    }

    $currentDate->sub(new DateInterval('P1D')); // ถอยวัน
}

// จัดเรียงข้อมูลใส่ array ใหม่
$output = [];
$index = 1;
foreach ($allData as $row) {
    $row['ลำดับ'] = $index++;
    foreach ($dateLabels as $dateLabel) {
        if (!isset($row[$dateLabel])) {
            $row[$dateLabel] = 0;
        }
    }
    $output[] = $row;
}

// ส่งออก JSON
echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
