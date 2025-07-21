<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// ตรวจสอบ method สำหรับ Preflight Request (ถ้าคุณจัดการ CORS ด้วย .htaccess แล้ว อาจไม่ต้องมีใน PHP)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- ฟังก์ชันดึงข้อมูลจาก API (ปรับปรุงให้แข็งแกร่งขึ้น) ---
function fetchData($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FAILONERROR, true); // ให้ cURL คืนค่า false ถ้ามี HTTP error (4xx/5xx)
    curl_setopt($ch, CURLOPT_TIMEOUT, 15); // ตั้ง Timeout 15 วินาที
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); // ตั้ง Connection Timeout 5 วินาที

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);

    curl_close($ch);

    if ($response === false || $httpCode >= 400) {
        error_log("CURL Error: Failed to fetch data from $url. HTTP Code: $httpCode, Error: " . $curlError);
        return null; // คืนค่า null หากเกิดข้อผิดพลาดในการเชื่อมต่อ/HTTP
    }

    $decoded = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON Decode Error: Failed to decode JSON from $url. Error: " . json_last_error_msg() . " Raw response: " . substr($response, 0, 200)); // แสดง raw response บางส่วน
        return null; // คืนค่า null หาก JSON ไม่ถูกต้อง
    }
    return $decoded;
}

// --- การจัดการวันที่ ---
// ใช้เวลาปัจจุบันในโซนเวลาของไทย
date_default_timezone_set('Asia/Bangkok'); 

$today_dt_obj = new DateTime(); // วันที่ปัจจุบันของเซิร์ฟเวอร์
$today_dt_obj->setTime(0, 0, 0); // ตั้งเวลาเป็น 00:00:00 (เพื่อให้ตรงกับ 00:00Z ใน API ใหม่)

// === RAIN: 7 วันย้อนหลังถึงล่วงหน้า 6 วัน (14 วัน) ===
// ใช้สำหรับวนลูปสร้าง output file และเป็น key สำหรับดึงข้อมูลจาก API ใหม่
$dates_rain_output = []; // เก็บ DateTime objects
$dates_rain_output_keys = []; // เก็บ key ในรูปแบบ "YYYY-MM-DD" สำหรับค้นหาใน API data
for ($i = -7; $i <= 6; $i++) {
    $dt = (clone $today_dt_obj)->modify("$i days");
    $dates_rain_output[] = $dt;
    $dates_rain_output_keys[] = $dt->format('Y-m-d'); // เช่น "2025-07-15"
}

// === FLOW: 7 วันย้อนหลังถึงวันนี้ (8 วัน) ===
$dates_flow_output = [];
for ($i = 7; $i >= 0; $i--) {
    $dt = (clone $today_dt_obj)->modify("-$i days");
    $dates_flow_output[] = $dt;
}

// --- โหลดข้อมูลจาก API ใหม่สำหรับ Subbasin Rain ---
$subbasin_rain_api_url = "http://localhost/wangyang/hec_api/filter_rain_grid_api.php";
$subbasin_rain_data = fetchData($subbasin_rain_api_url);
$subbasin_rain_data = is_array($subbasin_rain_data) ? $subbasin_rain_data : [];

// --- โหลดข้อมูลจาก Frontend (สำหรับ Flow และ Station-specific Rain ที่อาจจะยังมีอยู่) ---
$data = json_decode(file_get_contents('php://input'), true);
$input_from_frontend = $data['data'] ?? [];

// === แปลงข้อมูล input_from_frontend เป็น map [station_id => values[]] (สำหรับ Flow และ Rain อื่นๆ) ===
$stationMap_frontend = [];
foreach ($input_from_frontend as $row) {
    if (isset($row['station_id']) && isset($row['values']) && is_array($row['values'])) {
        $stationMap_frontend[$row['station_id']] = $row['values'];
    }
}

// === ค่าถ่วงน้ำหนักของ Subbasin (ยังใช้เหมือนเดิม) ===
$subbasin_ratios = [
  'SB-01' => ['5' => 0.7979, '10' => 0.2021], // สถานี 5, 10 น่าจะมาจาก Frontend หรือ API เก่า
  'SB-02' => ['5' => 0.7725, '14' => 0.2275], // สถานี 5, 14 น่าจะมาจาก Frontend หรือ API เก่า
  'SB-03' => ['5' => 0.5710, 'WY.02' => 0.4290],
  'SB-04' => ['WY.01' => 0.1585, 'WY.02' => 0.8415],
  'SB-05' => ['16' => 0.2931, '5' => 0.0250, 'WY.01' => 0.0874, 'WY.02' => 0.5945],
  'SB-06' => ['WY.01' => 0.5962, 'WY.02' => 0.4038],
  'SB-07' => ['WY.01' => 1.000],
];

// === คำนวณ SB จากข้อมูลที่ดึงจาก filter_rain_grid_api.php ===
$sb_daily = [];
foreach ($subbasin_ratios as $sb => $ratios) {
    $sb_daily[$sb] = [];
    foreach ($dates_rain_output as $dt_idx => $dt_obj_for_output) {
        $date_key_for_api = $dt_obj_for_output->format('Y-m-d'); // เช่น "2025-07-15"
        $value = 0.0;

        if (isset($subbasin_rain_data[$sb]['values']["00:00Z {$date_key_for_api}"])) {
            $value = (float)($subbasin_rain_data[$sb]['values']["00:00Z {$date_key_for_api}"]);
        } else {
            foreach ($ratios as $station_id => $ratio) {
                    $station_values = $stationMap_frontend[$station_id] ?? [];
                    // ตรวจสอบ index ให้ตรงกับ $dates_rain_output
                    $val = isset($station_values[$dt_idx]) ? $station_values[$dt_idx] : 0;
                    $value += (float)$val * $ratio;
            }
        }
        $sb_daily[$sb][] = number_format($value, 9, '.', '');
    }
}


// === FLOW (ยังคงดึงจาก Frontend input เหมือนเดิม) ===
$flow_stations = ['E.91', 'E.87'];
$flow_daily = [];

foreach ($flow_stations as $station) {
    $values = $stationMap_frontend[$station] ?? [];
    $flow_daily[$station] = []; // Initialize for current station
    for ($i = 0; $i < 8; $i++) { // 8 วันสำหรับ FLOW
        $flow_daily[$station][] = isset($values[$i]) ? number_format((float)$values[$i], 9, '.', '') : "0.000000000";
    }
}

// === สร้างไฟล์ input-hms.txt ===
$fileName = "C:\wangyang\hms_wangyang\input-hms\input-hms.txt";
$file_dir = dirname($fileName);
if (!is_dir($file_dir)) {
    mkdir($file_dir, 0777, true); // สร้างโฟลเดอร์ถ้ายังไม่มี
}

$file = @fopen($fileName, "w"); // ใช้ @ เพื่อซ่อน warning ถ้าเปิดไฟล์ไม่ได้

if ($file === false) {
    error_log("Failed to open file for writing: " . $fileName);
    echo json_encode(["success" => false, "message" => "❌ สร้างไฟล์ input-hms.txt ล้มเหลว: ไม่สามารถเปิดไฟล์ได้", "file" => $fileName], JSON_UNESCAPED_UNICODE);
    exit();
}

// === เขียน RAIN ===
$firstDateRain = $dates_rain_output[0]->format("dMY"); // ใช้ dates_rain_output
$lastDateRain = $dates_rain_output[count($dates_rain_output) - 1]->format("dMY");

foreach ($sb_daily as $sb => $values) {
  fwrite($file, "//$sb/PRECIP-INC/$firstDateRain/1Day/GAGE/\n");
  fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$firstDateRain 23:59:59   Tag:Tag        Prec:9\n");
  fwrite($file, "Start: $firstDateRain at 0700 hours;   End: $lastDateRain at 0700 hours;  Number: 14\n");
  fwrite($file, "Units: MM    Type: PER-CUM\n");

  foreach ($dates_rain_output as $i => $dt) {
    $dateHMS = $dt->format("dMY");
    fwrite($file, "$dateHMS, 0700;\t{$values[$i]}\n");
  }

  fwrite($file, "\tEND DATA\n");
}

// === เขียน FLOW ===
$firstDateFlow = $dates_flow_output[0]->format("dMY"); // ใช้ dates_flow_output
$lastDateFlow = $dates_flow_output[count($dates_flow_output) - 1]->format("dMY");

foreach ($flow_daily as $station => $values) {
  fwrite($file, "//$station/FLOW/$firstDateFlow/1Day/GAGE/\n");
  fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$firstDateFlow 23:59:59 Tag:Tag Prec:9\n");
  fwrite($file, "Start: $firstDateFlow at 0700 hours; End: $lastDateFlow at 0700 hours; Number: 8\n");
  fwrite($file, "Units: M3/S Type: PER-AVER\n");

  foreach ($dates_flow_output as $i => $dt) {
    $dateHMS = $dt->format("dMY");
    fwrite($file, "$dateHMS, 0700;\t{$values[$i]}\n");
  }

  fwrite($file, "\tEND DATA\n");
}

fwrite($file, "\tEND FILE\n");
fclose($file);

echo json_encode(["success" => true, "message" => "✅ สร้างไฟล์ input_hms.txt สำเร็จ!", "file" => $fileName], JSON_UNESCAPED_UNICODE);
?>