<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// ฟังก์ชันสำหรับรันคำสั่ง
function runCommand($command) {
    exec($command . " 2>&1", $output, $return_var);
    return [$return_var, $output];
}

$results = [];

// 1. รัน ras_update_date.py
[$return1, $output1] = runCommand("python C:\\wangyang\\ras_update_date.py");
$results[] = [
    "step" => "ras_update_date.py",
    "success" => $return1 === 0,
    "output" => $output1
];
if ($return1 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ras_update_date.py failed", "results" => $results]);
    exit;
}

// 2. รัน hec_ras_compute.py
[$return2, $output2] = runCommand("python C:\\wangyang\\hec_ras_compute.py");
$results[] = [
    "step" => "hec_ras_compute.py",
    "success" => $return2 === 0,
    "output" => $output2
];
if ($return2 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ hec_ras_compute.py failed", "results" => $results]);
    exit;
}

// 3. รัน ras-output-flow.bat
exec("cmd /C \"C:\\wangyang\\ras-output-flow.bat\"", $output3, $return3);
$results[] = [
    "step" => "ras-output-flow.bat",
    "success" => $return3 === 0,
    "output" => $output3
];
if ($return3 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ras-output-flow.bat failed", "results" => $results]);
    exit;
}

// 4. รัน ras-output-gate.bat
exec("cmd /C \"C:\\wangyang\\ras-output-gate.bat\"", $output4, $return4);
$results[] = [
    "step" => "ras-output-gate.bat",
    "success" => $return4 === 0,
    "output" => $output4
];
if ($return4 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ras-output-gate.bat failed", "results" => $results]);
    exit;
}

// 5. รัน ras-output.py
[$return5, $output5] = runCommand("python C:\\wangyang\\ras-output.py");
$results[] = [
    "step" => "ras-output.py",
    "success" => $return5 === 0,
    "output" => $output5
];
if ($return5 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ras-output.py failed", "results" => $results]);
    exit;
}

// ถ้าทุกอย่างผ่าน
http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "✅ All steps completed successfully",
    "results" => $results
]);
?>
