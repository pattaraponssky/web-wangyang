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
?>
