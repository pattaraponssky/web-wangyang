<?php
header('Content-Type: application/json');

// ฟังก์ชันดึงข้อมูลจาก API
function fetchData($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

// กำหนดวันย้อนหลัง 7 วัน (ไม่รวมวันปัจจุบัน)
$today = new DateTime();
$dates = [];
$today->modify('-1 day'); // ลดวันปัจจุบันออก
for ($i = 0; $i < 7; $i++) {
    $dates[] = $today->format('d/m/Y');
    $today->modify('-1 day');
}
$dates = array_reverse($dates);

// URL ของ API ใหม่
$api_url = "http://localhost/code-xampp/API/api_rain_hydro3.php";
$data = fetchData($api_url);

// อัตราส่วนของแต่ละ subbasin
$subbasin_ratios = [
    'E.16A' => ['10' => 0.107, '5' => 0.893],
    'E.22B' => ['10' => 0.101, '5' => 0.156, '13' => 0.645, '14' => 0.098],
    'E.66A' => ['5' => 0.781, '6' => 0.219],
    'E.75' => ['5' => 0.058, '16' => 0.463, '14' => 0.479],
    'E.87' => ['5' => 0.445, '6' => 0.118, '16' => 0.437],
    'E.9' => ['10' => 0.970, '5' => 0.004, '13' => 0.025],
    'E.91' => ['5' => 0.987, '14' => 0.013],
    // เพิ่ม subbasin อื่น ๆ ตามต้องการ
];

// คำนวณค่า SB รายวัน
$sb_daily_values = [];
foreach ($subbasin_ratios as $sb => $ratios) {
    $sb_daily_values[$sb] = [];
    foreach ($dates as $index => $date) {
        $sb_value = 0;
        foreach ($ratios as $station_id => $ratio) {
            foreach ($data as $station) {
                if ($station['station_id'] == $station_id) {
                    $rain_key = "rain_" . (7 - $index) . "_days_ago";
                    $rain_value = isset($station[$rain_key]) ? $station[$rain_key] : 0;
                    $sb_value += $rain_value * $ratio;
                }
            }
        }
        $sb_daily_values[$sb][$date] = round($sb_value, 2);
    }
}

// ส่งออก JSON
$result = [
    // "rainfall_data" => $data,
    "sb_daily_values" => $sb_daily_values
];

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
