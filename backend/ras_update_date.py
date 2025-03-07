import re

# 📂 กำหนดพาธไฟล์ .p01 ของแผนปัจจุบัน
p01_file = r"D:\sti_wangyang\RAS_WangYang\Wangyang.p01"

# 🕒 กำหนดวันที่ที่ต้องการเปลี่ยน
start_date = "01AUG2011,00.00"
end_date = "06AUG2011,00.00"

# อ่านไฟล์ .p01
with open(p01_file, "r", encoding="utf-8") as file:
    lines = file.readlines()

# ค้นหาและแก้ไขค่า Simulation Datea
for i, line in enumerate(lines):
    if line.startswith("Simulation Date="):
        lines[i] = f"Simulation Date={start_date},{end_date}\n"
        print(f"✅ Updated Simulation Date to: {start_date} - {end_date}")

# เขียนไฟล์ .p01 กลับไป
with open(p01_file, "w", encoding="utf-8") as file:
    file.writelines(lines)

print("✅ Successfully updated .p01 file.")
