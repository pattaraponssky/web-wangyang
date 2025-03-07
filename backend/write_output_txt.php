<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
// =======================
// 1. ดึงข้อมูลจาก API
// =======================
$api_url = "http://localhost/code-xampp/API/api_flow_hourly_sukhothai.php";
$response = file_get_contents($api_url);
if ($response === false) {
    die("ไม่สามารถดึงข้อมูลจาก API ได้");
}

$api_data = json_decode($response, true);
if ($api_data === null) {
    die("ไม่สามารถแปลงข้อมูล JSON จาก API ได้");
}

// ตรวจสอบว่ามี key "datetime" อยู่ในข้อมูล API
foreach ($api_data as &$row) {
    if (!isset($row["datetime"])) {
        die("API record ไม่มี key \"datetime\"");
    }
}
unset($row);

// =======================
// 2. อ่านข้อมูลจากไฟล์ CSV
// =======================
$csv_file = "output_hms.csv"; // เปลี่ยนเป็นชื่อไฟล์จริง
if (!file_exists($csv_file)) {
    die("ไม่พบไฟล์ CSV: $csv_file");
}

$csv_lines = file($csv_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if (empty($csv_lines)) {
    die("ไฟล์ CSV ว่างเปล่า");
}

// ใช้ str_getcsv โดยระบุ delimiter, enclosure และ escape
$csv_data = array_map(function($line) {
    return str_getcsv($line, ",", "\"", "\\");
}, $csv_lines);

$headers = array_shift($csv_data);
$csv_data = array_map(function($row) use ($headers) {
    return array_combine($headers, $row);
}, $csv_data);

// เปลี่ยนชื่อคอลัมน์ "Sink-1" เป็น "Y.14A" (ถ้ามี)
foreach ($csv_data as &$row) {
    if (isset($row["Sink-1"])) {
        $row["Y.14A"] = $row["Sink-1"];
        unset($row["Sink-1"]);
    }
}
unset($row);

// แปลงวันที่ใน CSV จาก "DateTime" (d/m/Y H:i) เป็น "datetime" (Y-m-d H:i:s)
foreach ($csv_data as &$row) {
    $dt = DateTime::createFromFormat("d/m/Y H:i", $row["DateTime"]);
    if ($dt === false) {
        die("ไม่สามารถแปลงวันที่ใน CSV ได้: " . $row["DateTime"]);
    }
    $row["datetime"] = $dt->format("Y-m-d H:i:s");
}
unset($row);

// =======================
// 3. รวมข้อมูลจาก API และ CSV
// =======================
$combined_data = array_merge($api_data, $csv_data);

// กรองเฉพาะ record ที่มี key "datetime"
$combined_data = array_filter($combined_data, function($rec) {
    return isset($rec["datetime"]);
});

// เรียงลำดับข้อมูลตามวันที่
usort($combined_data, function($a, $b) {
    return strtotime($a["datetime"]) - strtotime($b["datetime"]);
});

// ตรวจสอบว่ามีข้อมูลหรือไม่
if (empty($combined_data)) {
    die("ไม่พบข้อมูลที่จะรวม");
}

// คำนวณ header (Start, End, Number)
$start_datetime = DateTime::createFromFormat("Y-m-d H:i:s", $combined_data[0]["datetime"]);
$end_datetime   = DateTime::createFromFormat("Y-m-d H:i:s", end($combined_data)["datetime"]);
$start_str = $start_datetime ? $start_datetime->format("Y-m-d H:i:s") : "";
$end_str   = $end_datetime   ? $end_datetime->format("Y-m-d H:i:s") : "";
$number_of_points = count($combined_data);

// =======================
// 4. ฟังก์ชันสร้างไฟล์รวมทุกคอลัมน์
// =======================
function generate_single_file($columns, $combined_data, $start_str, $end_str, $number_of_points) {
    $output_lines = [];
    
    foreach ($columns as $col) {
        $output_lines[] = "//{$col}/Flow/07Feb2025/1Hour//";
        $output_lines[] = "RTD  Ver:  1   Prog:DssVue  LW:05SEP24  59:59:59   Tag:Tag        Prec:3";
        $output_lines[] = sprintf("Start:  at %s;   End:  at %s;  Number: %d", $start_str, $end_str, $number_of_points);
        $output_lines[] = "Units: M3/S    Type: INST-VAL";

        foreach ($combined_data as $row) {
            $dt_line = DateTime::createFromFormat("Y-m-d H:i:s", $row["datetime"]);
            $date_str = $dt_line ? $dt_line->format("dMY, Hi") : "";
            $value = isset($row[$col]) ? floatval($row[$col]) : 0.000;

            $output_lines[] = sprintf("%s;\t%.3f", $date_str, $value);
        }
        
        $output_lines[] =  "\tEND DATA";
    }
    $output_lines[] =  "\tEND FILE";
    // เขียนข้อมูลทั้งหมดลงไฟล์เดียว
    $output_file = "output_hms.txt";
    $fileHandle = fopen($output_file, 'w');
    if (!$fileHandle) {
        die("ไม่สามารถเปิดไฟล์สำหรับเขียน: $output_file");
    }

    foreach ($output_lines as $line) {
        fwrite($fileHandle, $line . "\n");
    }

    fclose($fileHandle);
    echo "ไฟล์ถูกบันทึกที่ $output_file\n";
}

// =======================
// 5. เรียกใช้ฟังก์ชันสร้างไฟล์รวม
// =======================
$columns = ["Y.14A", "SB-14", "SB-15"];
generate_single_file($columns, $combined_data, $start_str, $end_str, $number_of_points);
?>
