<?php
date_default_timezone_set('Asia/Bangkok');

// === Config API URL ===
$baseUrl = 'http://192.168.99.202:3000/api/history/grouped';

// === วันที่ย้อนหลัง 7 วัน ===
$to = new DateTime();
$from = clone $to;
$from->modify('-7 days');

$fromStr = $from->format('Y-m-d 00:00:00');
$toStr = $to->format('Y-m-d 23:59:59');

// === ดึงข้อมูลจาก API ===
$url = "$baseUrl?from=" . urlencode($fromStr) . "&to=" . urlencode($toStr);
$response = file_get_contents($url);
$data = json_decode($response, true);

if (!$data || !is_array($data)) {
    die(json_encode(["error" => "ไม่สามารถโหลดข้อมูลจาก API ได้"]));
}

// === เตรียมข้อมูลรายวัน ===
$dailySummary = [];

foreach ($data as $stationCode => $records) {
    $dailyRainfall = [];
    $hourlyMap = [];

    foreach ($records as $entry) {
        // แปลง พ.ศ. → ค.ศ.
        $datetimeStr = $entry['datetime'];
        [$buddhistYear, $m, $dTime] = explode('-', $datetimeStr);
        $adYear = $buddhistYear - 543;
        $datetime = "$adYear-$m-$dTime";
        $date = substr($datetime, 0, 10);
        $hour = substr($datetime, 11, 5); // HH:MM

        // === รวมฝนรายวัน ===
        if (!isset($dailyRainfall[$date])) {
            $dailyRainfall[$date] = 0;
        }
        if (isset($entry['rainfall'])) {
            $dailyRainfall[$date] += $entry['rainfall'];
        }

        // === เก็บค่าชั่วโมงสุดท้ายของวันก่อน (23:00) ===
        $hourlyMap[$datetime] = $entry;
    }

    // สร้างข้อมูลรายวัน
    foreach ($dailyRainfall as $date => $rainTotal) {
        // หาวันก่อนหน้า
        $dateObj = new DateTime($date);
        $dateObj->modify('-1 day');
        $prevDate = $dateObj->format('Y-m-d');
        $prevDatetime = "$prevDate 23:00:00";

        $flow = null;
        $level = null;

        if (isset($hourlyMap[$prevDatetime])) {
            $prevData = $hourlyMap[$prevDatetime];
            $flow = $prevData['water_flow'] ?? null;
            $level = $prevData['water_level'] ?? ($prevData['upper_water'] ?? null);
        }

        $dailySummary[$stationCode][] = [
            'date' => $date,
            'rainfall_sum' => round($rainTotal, 2),
            'water_flow' => $flow,
            'water_level' => $level
        ];
    }
}

// === แสดงผล JSON ===
header('Content-Type: application/json');
echo json_encode($dailySummary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
