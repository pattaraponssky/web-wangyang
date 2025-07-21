<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$apiUrl1 = "http://localhost/wangyang/hec_api/input_hms.php";
$apiUrl2 = "http://localhost/wangyang/hec_api/filter_rain_grid_api.php";
$apiUrl3 = "http://localhost/wangyang/API/api_flow_hydro3_8day.php";

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

$data1 = fetchApiData($apiUrl1);
$data2 = fetchApiData($apiUrl2);
$data3 = fetchApiData($apiUrl3);

$stations = ['E.91', 'E.87'];
$flowData = [];

foreach ($stations as $stationCode) {
    foreach ($data3 as $station) {
        if ($station["stationcode"] === $stationCode) {
            foreach ($station as $date => $value) {
                // ข้าม key ที่ไม่ใช่วันที่ (เช่น stationcode, basinname ฯลฯ)
                if (!preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $date)) {
                    continue;
                }
                
                if (!isset($flowData[$stationCode][$date])) {
                    $flowData[$stationCode][$date] = [];
                }
                $flowData[$stationCode][$date][] = $value;
            }
        }
    }
}

$fileName = "C:\wangyang\hms_wangyang\input-hms\input-hms.txt";

$startDate = new DateTime();
$startDate->modify("-7 days");
$endDate = clone $startDate;
$endDate->modify("+13 days");

$currentDateFormatted = $startDate->format("dMY");

$variables = ['SB-01', 'SB-02', 'SB-03', 'SB-04', 'SB-05', 'SB-06', 'SB-07'];

$file = fopen($fileName, "w");

foreach ($variables as $var) {
    fwrite($file, "//$var/PRECIP-INC/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted  23:59:59   Tag:Tag        Prec:9\n");
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours;   End: " . $endDate->format("dMY") . " at 0700 hours;  Number: 15\n");
    fwrite($file, "Units: MM    Type: PER-CUM\n");

    $currentDate = clone $startDate;
    while ($currentDate <= $endDate) {
        $formattedDate = $currentDate->format("d/m/Y");
        $dateString = $currentDate->format("dMY");
        $dateKey = $currentDate->format("Y-m-d");

        $value1 = isset($data1['sb_daily_values'][$var][$formattedDate]) ? $data1['sb_daily_values'][$var][$formattedDate] : "0";
        $value2 = isset($data2[$var]['values']["00:00Z $dateKey"]) ? $data2[$var]['values']["00:00Z $dateKey"] : "0";

        $finalValue = ($value1 !== "0") ? $value1 : $value2;
        if ($finalValue !== "0" && is_numeric($finalValue)) {
            $finalValue = number_format((float)$finalValue, 9, '.', '');
        }

        fwrite($file, "{$dateString}, 0700;\t$finalValue\n");
        $currentDate->modify("+1 day");
    }

    fwrite($file, "\tEND DATA\n");
}

foreach ($stations as $station) {
    fwrite($file, "//$station/FLOW/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted 23:59:59 Tag:Tag Prec:9\n");
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours; End: " . $endDate->format("dMY") . " at 0700 hours; Number: 8\n");
    fwrite($file, "Units: M3/S Type: PER-AVER\n");

    $today = new DateTime();
    $currentDate = clone $startDate;
    while ($currentDate <= $today) {
        $dateString = $currentDate->format("dMY");
        $formattedDate = $currentDate->format("d/m/Y");

        if (isset($flowData[$station][$formattedDate])) {
            $averageValue = array_sum($flowData[$station][$formattedDate]) / count($flowData[$station][$formattedDate]);
            $valueFlow = number_format((float)$averageValue, 9, '.', '');
        } else {
            $valueFlow = "0";
        }

        fwrite($file, "{$dateString}, 0700;\t$valueFlow\n");
        $currentDate->modify("+1 day");
    }

    fwrite($file, "\tEND DATA\n");
}

fwrite($file, "\tEND FILE\n");
fclose($file);

echo "✅ สร้างไฟล์ $fileName (วังยาง) สำเร็จ!!";
?>
