<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$command = "python C:\\wangyang\\hms_update_date.py";
exec($command . " 2>&1", $output, $return_var);

if ($return_var === 0) {
    echo json_encode(["success" => true, "message" => "✅ Run hms_update_date completed", "output" => $output]);
} else {
    echo json_encode(["success" => false, "message" => "❌ Run failed", "output" => $output]);
}
?>
