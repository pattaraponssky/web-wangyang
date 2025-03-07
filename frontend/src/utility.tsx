export const formatThaiDate = (time: string): string => {
    const date = new Date(time);
  
    const year = date.getFullYear();
    const monthNamesThai = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
  
    const month = monthNamesThai[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
  
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
  
    // รูปแบบ "เวลา วัน เดือน ปี"
    return `${hours}:${minutes} ${day} ${month} ${year}`;
  };
  