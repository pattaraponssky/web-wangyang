export const formatThaiDate = (time: string): string => {
  const date = new Date(time);

  const yearBE = date.getFullYear() + 543; // แปลงเป็น พ.ศ.

  // เดือนชื่อเต็ม
  // const monthNamesThai = [
  //   "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  //   "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  // ];

  const monthNamesThai = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  const month = monthNamesThai[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day} ${month} ${yearBE} - ${hours}:${minutes}`;
};

export const formatThaiDateForTableGate = (time: string): string => {
  
  // แปลงจาก "06/11/2024 07:00" (DD/MM/YYYY HH:mm) เป็น "2024-11-06T07:00:00"
  const [datePart, timePart] = time.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const formattedTime = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${timePart}:00`;

  const date = new Date(formattedTime);

  const yearBE = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
  const monthNamesThai = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  const monthThai = monthNamesThai[date.getMonth()]; // เปลี่ยนชื่อตัวแปรเพื่อป้องกันปัญหา
  const dayStr = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${dayStr} ${monthThai} ${yearBE} - ${hours}:${minutes}`;
};

export const API_URL = "http://localhost/wangyang_backend/";

