<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// รายชื่อคำสั่งที่ต้องการรันตามลำดับ
$commands = [
    '"C:\\sti_wangyang\\hms_update_date.bat"',
    'python "C:\\sti_wangyang\\hec_ras_compute.py"',
    '"C:\\sti_wangyang\\ras-output-flow.bat"',
    '"C:\\sti_wangyang\\ras-output-gate.bat"',
    '"C:\\sti_wangyang\\ras-output.bat"',
];

// บันทึกผลลัพธ์
$results = [];

foreach ($commands as $cmd) {
    $output = [];
    $return_var = 0;

    // ใช้ exec แบบไม่ start /B เพื่อรอให้ทำงานเสร็จก่อน
    exec($cmd, $output, $return_var);

    if ($return_var === 0) {
        $results[] = "✅ สำเร็จ: $cmd";
    } else {
        $results[] = "❌ ล้มเหลว: $cmd (exit code $return_var)";
        break; // หยุดถ้ามีคำสั่งล้มเหลว
    }
}

// ส่งออกผลลัพธ์ในรูป JSON
echo json_encode([
    "success" => !in_array(false, array_map(fn($r) => str_starts_with($r, '❌'), $results)),
    "messages" => $results
]);
