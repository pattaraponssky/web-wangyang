<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
// ฟังก์ชันสำหรับสร้าง URL ตามวันที่และเวลา
function generateFileUrl($date) {
    return "https://hpc.tmd.go.th/static/csv/" . $date->format('YmdH') . "/p24h.d01." . $date->format('YmdH') . ".csv";
}

// ฟังก์ชันตรวจสอบว่าไฟล์สามารถดาวน์โหลดได้หรือไม่ โดยใช้ cURL
function downloadFileUsingCurl($url, $filename) {
    $ch = curl_init($url);
    
    // กำหนดตัวเลือกให้ cURL
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $file_content = curl_exec($ch);
    
    // ตรวจสอบว่าเกิดข้อผิดพลาดหรือไม่
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($http_code == 404) {
        echo "ไม่พบไฟล์: " . $url . "<br>";
        curl_close($ch);
        return false;
    }

    if ($file_content === false) {
        echo "ไม่สามารถดาวน์โหลดไฟล์ได้!";
        curl_close($ch);
        return false;
    }
    
    // บันทึกข้อมูลลงในไฟล์
    file_put_contents($filename, $file_content);
    curl_close($ch);
    return true;
}

$folder = "./rain_grid"; 
if (!is_writable($folder)) {
    echo "โฟลเดอร์ไม่มีสิทธิ์ในการเขียน";
} else {
    echo "สามารถเขียนไฟล์ลงในโฟลเดอร์ได้";
}


// ตรวจสอบว่าโฟลเดอร์มีอยู่แล้วหรือไม่ ถ้าไม่มีให้สร้าง
if (!is_dir($folder)) {
    mkdir($folder, 0777, true);
}

// สร้าง DateTime object สำหรับวันและเวลาเริ่มต้น
$today = new DateTime();
$today->setTime(18, 0);

$urls_to_try = [];
$urls_to_try[] = generateFileUrl($today);

$try_times = ['18', '12', '06', '00'];
foreach ($try_times as $time) {
    $yesterday = (clone $today)->modify('-1 day');
    $yesterday->setTime($time, 0);
    $urls_to_try[] = generateFileUrl($yesterday);
}

// ลองดาวน์โหลดไฟล์
$downloaded = false;
foreach ($urls_to_try as $url) {
    $filename = $folder . "/" . basename($url); // ใช้พาธจากตัวแปร $folder
    if (downloadFileUsingCurl($url, $filename)) {
        echo "ดาวน์โหลดไฟล์สำเร็จ: " . $filename;
        $downloaded = true;
        break;
    }
}

if (!$downloaded) {
    echo "ไม่สามารถดาวน์โหลดไฟล์ได้!";
}


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

$fileName = "C:\sti_wangyang\hms_wangyang\input-hms\input-hms.txt";

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

$batFile = 'C:\\sti_wangyang\\hms_wangyang\\input-hms\\input-hms.bat';

exec("start /B \"\" \"$batFile\"", $output, $return_var);

// ตรวจสอบผลลัพธ์
if ($return_var === 0) {
    echo "BAT file ran successfully.";
} else {
    echo "Error running BAT file.";
}

?>
