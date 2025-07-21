<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- ฟังก์ชันดึงข้อมูลจาก API (ปรับปรุงให้แข็งแกร่งขึ้น) ---
function fetchData($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FAILONERROR, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // เพิ่ม Timeout เผื่อ API ช้า
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // เพิ่ม Connection Timeout

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);

    curl_close($ch);

    if ($response === false) {
        error_log("CURL Error: Failed to fetch data from $url. Error: " . $curlError);
        return null;
    }
    
    // ตรวจสอบ HTTP Code อีกครั้ง หาก curl_exec ไม่คืนค่า false แต่ได้ HTTP error
    if ($httpCode >= 400) {
        error_log("CURL HTTP Error: Failed to fetch data from $url. HTTP Code: $httpCode. Response: " . substr($response, 0, 200));
        return null;
    }

    $decoded = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON Decode Error: Failed to decode JSON from $url. Error: " . json_last_error_msg() . " Raw response: " . substr($response, 0, 500));
        return null;
    }
    return $decoded;
}

// --- ฟังก์ชันแปลงปี พ.ศ. เป็น ค.ศ. สำหรับ DateTime::createFromFormat ---
function parseBEToCEDateTime($dateStringBE, $formatBE) {
    // แยกปีออกมา แล้วแปลงเป็น ค.ศ.
    // ตัวอย่าง: "2568-07-14 09:00:00" -> แยก 2568
    preg_match('/^(\d{4})/', $dateStringBE, $matches);
    if (isset($matches[1]) && (int)$matches[1] >= 2500) { // ตรวจสอบว่าเป็นปี พ.ศ. ที่น่าจะเป็นจริง
        $year_be = (int)$matches[1];
        $year_ce = $year_be - 543;
        $dateStringCE = $year_ce . substr($dateStringBE, 4); // แทนที่ปี พ.ศ. ด้วยปี ค.ศ.
        return DateTime::createFromFormat($formatBE, $dateStringCE);
    }
    // ถ้าปีไม่ใช่ พ.ศ. หรือรูปแบบไม่ตรง ให้ลองสร้างโดยตรง
    return DateTime::createFromFormat($formatBE, $dateStringBE);
}

// --- การจัดการวันที่ (ปรับปรุงส่วนนี้) ---
date_default_timezone_set('Asia/Bangkok'); 

// กำหนด "วันนี้" เวลา 07:00:00 น.
$today_07am_ce = new DateTime('today 07:00:00'); // e.g., 2025-07-15 07:00:00

if (!$today_07am_ce) {
    error_log("Fatal Error: Failed to create today's DateTime object at 07:00:00.");
    echo json_encode(["success" => false, "message" => "Internal server error: Date initialization failed."]);
    exit();
}

// === วันที่สำหรับแสดงผลและคำนวณข้อมูล (ย้อนหลัง 7 วัน ไม่รวมวันปัจจุบัน) ===
// เริ่มตั้งแต่วันที่ 7 วันที่แล้ว (เทียบกับวันนี้) ไปจนถึงเมื่อวาน
$display_and_data_start_date_ce = (clone $today_07am_ce)->modify('-7 days'); // e.g., 2025-07-08 07:00:00
$display_and_data_end_date_ce = (clone $today_07am_ce)->modify('-1 day');   // e.g., 2025-07-14 07:00:00

$dates_display = [];
$current_loop_date = clone $display_and_data_start_date_ce;
while ($current_loop_date <= $display_and_data_end_date_ce) {
    // แปลงปี ค.ศ. เป็น พ.ศ. สำหรับการแสดงผล (DD/MM/YYYY_BE)
    $year_be_display = (int)$current_loop_date->format('Y') + 543;
    $dates_display[] = $current_loop_date->format('d/m/') . $year_be_display; 
    $current_loop_date->modify('+1 day');
}
// $dates_display ตอนนี้จะมี 7 วันย้อนหลังไม่รวมวันนี้, เรียงจากเก่าไปใหม่
// เช่น [08/07/2568, 09/07/2568, ..., 14/07/2568]

// === วันที่สำหรับ Query API WY (รูปแบบ YYYY-MM-DD HH:MM:SS พ.ศ.) ===
// ช่วงเวลาสำหรับ Query API WY จะเป็นวันที่แสดงผลทั้งหมด
$from_query_ce = clone $display_and_data_start_date_ce;
$to_query_ce = clone $display_and_data_end_date_ce;

// แปลงปี ค.ศ. เป็น พ.ศ. สำหรับ URL Query Parameter
$from_year_be = (int)$from_query_ce->format('Y') + 543;
$to_year_be = (int)$to_query_ce->format('Y') + 543;

// สร้างจาก/ถึง string ในรูปแบบ YYYY-MM-DD HH:MM:SS แต่ใช้ปี พ.ศ.
$fromStr_be = $from_year_be . $from_query_ce->format('-m-d H:i:s');
$toStr_be = $to_year_be . $to_query_ce->format('-m-d H:i:s');

// --- โหลดข้อมูลจาก API api_rain_hydro3.php ---
$rain_data = fetchData("http://localhost/wangyang/API/api_rain_hydro3.php");
$rain_data = is_array($rain_data) ? $rain_data : [];

// --- โหลดข้อมูลจาก API 192.168.99.202:3000/api/history/grouped ---
$wy_api_url = "http://192.168.99.202:3000/api/history/grouped?from=" . urlencode($fromStr_be) . "&to=" . urlencode($toStr_be);
$wy_data_raw = fetchData($wy_api_url); 
$wy_data_raw = is_array($wy_data_raw) ? $wy_data_raw : [];

// --- สัดส่วน Subbasin (ยังคงใช้เหมือนเดิม) ---
$subbasin_ratios = [
    'SB-01' => ['5' => 0.7979, '10' => 0.2021],
    'SB-02' => ['5' => 0.7725, '14' => 0.2275],
    'SB-03' => ['5' => 0.5710, 'WY.02' => 0.4290],
    'SB-04' => ['WY.01' => 0.1585, 'WY.02' => 0.8415],
    'SB-05' => ['16' => 0.2931, '5' => 0.0250, 'WY.01' => 0.0874, 'WY.02' => 0.5945],
    'SB-06' => ['WY.01' => 0.5962, 'WY.02' => 0.4038],
    'SB-07' => ['WY.01' => 1.000],
];

// --- รวม rainfall รายวันของ WY.xx จากรายชั่วโมง ---
$daily_wy_rain = []; // [WY.xx][Y-m-d_CE] => sum
foreach ($wy_data_raw as $station_code => $records) {
    if (!is_string($station_code) || !is_array($records)) {
        continue;
    }

    foreach ($records as $rec) {
        $datetime_str_be = $rec['datetime'] ?? ''; 
        if (empty($datetime_str_be)) {
            continue;
        }

        // ใช้ parseBEToCEDateTime เพื่อจัดการการแปลงปี พ.ศ.
        $dt = parseBEToCEDateTime($datetime_str_be, 'Y-m-d H:i:s');
        
        if ($dt) {
            // วันที่สำหรับรวมผลฝนรายวัน (เป็น Y-m-d ในรูปแบบ ค.ศ.)
            $date_for_sum_ce = $dt->format('Y-m-d'); 
            
            $rain_val = $rec['rainfall'] ?? 0;
            $rain = 0.0;

            // ตรวจสอบรูปแบบของ $rain_val: อาจเป็น string (เช่น "45.00") หรือ array ([0])
            if (is_numeric($rain_val)) {
                $rain = floatval($rain_val);
            } elseif (is_array($rain_val) && isset($rain_val[0]) && is_numeric($rain_val[0])) {
                $rain = floatval($rain_val[0]);
            }
            // ถ้าไม่ใช่ทั้งสองรูปแบบ, $rain จะยังคงเป็น 0.0

            if (!isset($daily_wy_rain[$station_code][$date_for_sum_ce])) {
                $daily_wy_rain[$station_code][$date_for_sum_ce] = 0.0;
            }
            $daily_wy_rain[$station_code][$date_for_sum_ce] += $rain; // รวมค่าฝนรายชั่วโมง
        } else {
            error_log("Warning: Failed to parse datetime '{$datetime_str_be}' from WY API for daily rain summation.");
        }
    }
}

// --- สร้างแผนที่วันที่ d/m/Y (แสดงผล พ.ศ.) ไปยัง Y-m-d (สำหรับเข้าถึงข้อมูล ค.ศ.) ---
$date_map_display_to_ce = [];
foreach ($dates_display as $date_str_display) {
    // แยกปี พ.ศ. เพื่อแปลงเป็น ค.ศ. ก่อนสร้าง DateTime Object
    $parts = explode('/', $date_str_display);
    if (count($parts) === 3) {
        $day = $parts[0];
        $month = $parts[1];
        $year_be = (int)$parts[2];
        $year_ce = $year_be - 543;
        $date_ce_str = "$day/$month/$year_ce"; // เช่น 15/07/2025

        $dt_obj = DateTime::createFromFormat('d/m/Y', $date_ce_str);
        if ($dt_obj) {
            $date_map_display_to_ce[$date_str_display] = $dt_obj->format('Y-m-d');
        } else {
             error_log("Warning: Failed to create DateTime object from display date: {$date_ce_str}");
        }
    }
}

// --- คำนวณค่า Subbasin รายวัน ---
$sb_daily_values = [];

foreach ($subbasin_ratios as $sb => $ratios) {
    $sb_daily_values[$sb] = [];
    foreach ($dates_display as $date_display) { // ลูปผ่าน $dates_display ที่เป็น d/m/Y (พ.ศ.)
        $sb_value = 0.0;
        // ดึงวันที่ในรูปแบบ ค.ศ. (Y-m-d) ที่ใช้เป็น key ใน $daily_wy_rain
        $date_ce_for_lookup = $date_map_display_to_ce[$date_display] ?? null; 

        foreach ($ratios as $station_id => $ratio) {
            if (strpos($station_id, 'WY.') === 0) {
                // ดึงค่าฝนที่รวมรายวันแล้วจาก $daily_wy_rain
                $rain = ($date_ce_for_lookup && isset($daily_wy_rain[$station_id][$date_ce_for_lookup])) ? $daily_wy_rain[$station_id][$date_ce_for_lookup] : 0.0;
                $sb_value += $rain * $ratio;
            } else {
                foreach ($rain_data as $station) {
                    if (isset($station['station_id']) && $station['station_id'] == $station_id) {
                        $day_offset = array_search($date_display, $dates_display); // หา index ของวันที่ใน dates_display
                       
                        $days_ago_from_newest_in_period = 0; 
                        if ($day_offset !== false) {
                            // $dates_display ถูกสร้างแบบเรียงจากเก่าไปใหม่ (index 0 คือเก่าสุด, index 6 คือใหม่สุด)
                            // rain_0_days_ago คือวันที่ใหม่สุดในชุด 7 วัน (เมื่อวาน)
                            // rain_6_days_ago คือวันที่เก่าสุดในชุด 7 วัน (วันนี้ - 7 วัน)
                            $days_ago_from_newest_in_period = (count($dates_display) - 1) - $day_offset; 
                        }
                        
                        $rain_key = "rain_" . $days_ago_from_newest_in_period . "_days_ago"; 
                        
                        $rain_value = isset($station[$rain_key]) ? floatval($station[$rain_key]) : 0.0;
                        $sb_value += $rain_value * $ratio;
                        break; // พบสถานีแล้ว ออกจากลูป station
                    }
                }
            }
        }
        $sb_daily_values[$sb][$date_display] = round($sb_value, 2);
    }
}

// --- ส่งออก JSON ---
echo json_encode([
    "dates_for_display" => $dates_display,
    "api_query_from" => $fromStr_be,
    "api_query_to" => $toStr_be,
    "rainfall_data_from_hydro3" => $rain_data, 
    "wy_api_raw_data_hourly_original" => $wy_data_raw, 
    "wy_api_raw_data_hourly_summed" => $daily_wy_rain, 
    "sb_daily_values" => $sb_daily_values
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

?>