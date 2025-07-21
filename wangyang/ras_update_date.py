from datetime import datetime, timedelta
#กำหนดพาธไฟล์ .p01 ของแผนปัจจุบัน
p01_file = r"C:\wangyang\RAS_Wangyang1D\Wangyang1D.p03"

today = datetime.today()
start_date = (today - timedelta(days=7)).strftime("%d%b%Y,07.00").upper()  # 7 days before
end_date = (today + timedelta(days=6)).strftime("%d%b%Y,06.00").upper()  # 6 days ahead


print("Start date:", start_date)
print("End date:", end_date)

# กำหนดวันที่ที่ต้องการเปลี่ยน
# start_date = "02APR2025,00.00"
# end_date = "15APR2025,00.00"

# อ่านไฟล์ .p01
with open(p01_file, "r", encoding="utf-8") as file:
    lines = file.readlines()

# ค้นหาและแก้ไขค่า Simulation Date
for i, line in enumerate(lines):
    if line.startswith("Simulation Date="):
        lines[i] = f"Simulation Date={start_date},{end_date}\n"
        print(f"Updated Simulation Date to: {start_date} - {end_date}")

# เขียนไฟล์ .p01 กลับไป
with open(p01_file, "w", encoding="utf-8") as file:
    file.writelines(lines)

print("Successfully updated .p01 file.")