<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
$batFile = 'C:\\wangyang\\send_gate_open.bat';

exec("start /B \"\" \"$batFile\"", $output, $return_var);

// ตรวจสอบผลลัพธ์
if ($return_var === 0) {
    echo "BAT file ran successfully.";
} else {
    echo "Error running BAT file.";
}
?>
