<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

// URL ของไฟล์ HTML
$url = "http://hydro-3.rid.go.th/admintranfer/getdownload/tableraindaily.files/sheet001.htm";

// ดึงข้อมูล HTML
$html = file_get_contents($url);

// โหลด HTML เข้า DOMDocument
$dom = new DOMDocument();
libxml_use_internal_errors(true); // ปิด error เนื่องจาก HTML อาจมีข้อผิดพลาด
$dom->loadHTML($html);
libxml_clear_errors();

// ใช้ XPath เพื่อค้นหาตาราง
$xpath = new DOMXPath($dom);
$rows = $xpath->query("//table/tr");

$data = [];
$index = 0;

// ฟังก์ชันเพื่อดึงค่าแต่ละคอลัมน์อย่างปลอดภัย
function getColValue($cols, $index, $isFloat = false) {
    if ($cols->item($index)) {
        $value = trim($cols->item($index)->textContent);
        return $isFloat ? floatval($value) : $value;
    }
    return $isFloat ? 0.0 : ""; // หรือเปลี่ยนเป็น null ได้ถ้าต้องการ
}

foreach ($rows as $row) {
    $index++; // เพิ่มค่าลำดับแถว

    if ($index <= 11) {
        continue; // ข้ามแถวที่ 1 - 11
    }

    $cols = $row instanceof DOMElement ? $row->getElementsByTagName("td") : null;

    if ($cols && $cols->length > 0) {
        $entry = [
            "station_id" => intval(getColValue($cols, 1)),
            "station_code" => getColValue($cols, 2),
            "river" => getColValue($cols, 3),
            "location" => getColValue($cols, 4),
            "district" => getColValue($cols, 5),
            "province" => getColValue($cols, 6),
            "rainfall_max" => getColValue($cols, 7, true),
            "rain_7_days_ago" => getColValue($cols, 8, true),
            "rain_6_days_ago" => getColValue($cols, 9, true),
            "rain_5_days_ago" => getColValue($cols, 10, true),
            "rain_4_days_ago" => getColValue($cols, 11, true),
            "rain_3_days_ago" => getColValue($cols, 12, true),
            "rain_2_days_ago" => getColValue($cols, 13, true),
            "rain_1_day_ago" => getColValue($cols, 14, true),
            "weekly_total" => getColValue($cols, 15, true)
        ];
        $data[] = $entry;
    }
}

// แปลงเป็น JSON และแสดงผล
echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
