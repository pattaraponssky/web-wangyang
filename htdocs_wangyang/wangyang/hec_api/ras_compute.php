<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
// run_hec_ras.php
$command = "python C:\\sti_wangyang\\hec_ras_compute.py";
exec($command . " 2>&1", $output, $return_var);

if ($return_var === 0) {
    echo json_encode(["success" => true, "message" => "✅ Run HEC-RAS completed", "output" => $output]);
} else {
    echo json_encode(["success" => false, "message" => "❌ Run failed", "output" => $output]);
}
?>
