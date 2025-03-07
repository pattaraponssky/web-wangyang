<?php
// กำหนดที่อยู่ของไฟล์ .bat
$batFile = "C:\\path\\to\\your\\file.bat"; // ให้ใส่พาธของไฟล์ .bat ที่คุณต้องการรัน

// ตรวจสอบว่าไฟล์ .bat มีอยู่จริงหรือไม่
if (file_exists($batFile)) {
    // รันคำสั่ง .bat ด้วย shell_exec
    $output = shell_exec($batFile);
    echo json_encode(['error' => false, 'message' => 'Success: ' . $output]);
} else {
    // หากไฟล์ไม่พบ
    echo json_encode(['error' => true, 'message' => 'Error: .bat file not found']);
}
?>
