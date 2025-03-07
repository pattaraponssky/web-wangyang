<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
// ตั้งค่า URL ของ API
$apiUrl1 = "http://localhost/code-xampp/sukhothai/input_hms.php"; // API แรก
$apiUrl2 = "http://localhost/code-xampp/sukhothai/filter_rain_grid_api.php"; // API ที่สอง
$apiUrl3 = "http://localhost/code-xampp/API/api_flow_hydro2.php"; // API ที่สาม (Y.14A)

// ฟังก์ชันดึงข้อมูลจาก API
function fetchApiData($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        die("❌ ไม่สามารถดึงข้อมูลจาก API: $url (HTTP Code: $httpCode)");
    }

    return json_decode($response, true);
}

// ดึงข้อมูลจาก API ทั้งสาม
$data1 = fetchApiData($apiUrl1);
$data2 = fetchApiData($apiUrl2);
$data3 = fetchApiData($apiUrl3);

// ค้นหาข้อมูลของสถานี "Y.14A"
$y14aData = null;
foreach ($data3 as $station) {
    if ($station["stationcode"] === "Y.14A") {
        $y14aData = $station;
        break;
    }
}

if (!$y14aData) {
    die("❌ ไม่พบข้อมูลของสถานี Y.14A ใน API ที่สาม");
}

// ตั้งค่าชื่อไฟล์
$fileName = "input_hms.txt";

// กำหนดวันเริ่มต้นและวันสิ้นสุด
$startDate = new DateTime();
$startDate->modify("-7 days");
$endDate = clone $startDate;
$endDate->modify("+13 days");

// วันที่ปัจจุบันสำหรับ Header
$currentDateFormatted = $startDate->format("dMY");

// เปิดไฟล์เพื่อเขียนข้อมูล
$file = fopen($fileName, "w");

// วนลูปสร้างข้อมูลสำหรับ SB-1 ถึง SB-15
for ($sb = 1; $sb <= 15; $sb++) {
    $sbKey = "SB-$sb";

    fwrite($file, "//$sbKey/PRECIP-INC/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted  23:59:59   Tag:Tag        Prec:9\n");
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours;   End: " . $endDate->format("dMY") . " at 0700 hours;  Number: 15\n");
    fwrite($file, "Units: MM    Type: PER-CUM\n");

    $currentDate = clone $startDate;
    while ($currentDate <= $endDate) {
        $formattedDate = $currentDate->format("d/m/Y");
        $dateString = $currentDate->format("dMY");
        $dateKey = $currentDate->format("Y-m-d");

        $value1 = isset($data1['sb_daily_values'][$sbKey][$formattedDate]) ? $data1['sb_daily_values'][$sbKey][$formattedDate] : "0";
        $value2 = isset($data2[$sbKey]['values']["00:00Z $dateKey"]) ? $data2[$sbKey]['values']["00:00Z $dateKey"] : "0";

        $finalValue = ($value1 !== "0") ? $value1 : $value2;
        if ($finalValue !== "0" && is_numeric($finalValue)) {
            $finalValue = number_format((float)$finalValue, 9, '.', '');
        }

        fwrite($file, "{$dateString}, 0700;\t$finalValue\n");

        $currentDate->modify("+1 day");
    }

    fwrite($file, "\tEND DATA\n");
}

// ✅ เพิ่มข้อมูลของ Y.14A ต่อจาก SB-15
fwrite($file, "//Y.14A/FLOW/$currentDateFormatted/1Day/GAGE/\n");
fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted  23:59:59   Tag:Tag        Prec:9\n");
fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours;   End: " . $endDate->format("dMY") . " at 0700 hours;  Number: 8\n");
fwrite($file, "Units: M3/S    Type: PER-AVER\n");

$today = new DateTime();

$currentDate = clone $startDate;
while ($currentDate <= $today) {
    $dateString = $currentDate->format("dMY");
    $formattedDate = $currentDate->format("d/m/Y");

    // ดึงค่าฝนของ Y.14A จาก API ที่สาม
    $valueY14A = isset($y14aData[$formattedDate]) ? $y14aData[$formattedDate] : "0";
    
    if ($valueY14A !== "0" && is_numeric($valueY14A)) {
        $valueY14A = number_format((float)$valueY14A, 9, '.', '');
    }

    fwrite($file, "{$dateString}, 0700;\t$valueY14A\n");

    $currentDate->modify("+1 day");
}

// ปิดท้ายไฟล์
fwrite($file, "\tEND DATA\n");
fwrite($file, "\tEND FILE\n");
fclose($file);

echo "✅ สร้างไฟล์ $fileName สำเร็จ! (รวมข้อมูล Y.14A แล้ว)";
?>
