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

export const API_URL = "http://localhost/code-xampp/wangyang/";

