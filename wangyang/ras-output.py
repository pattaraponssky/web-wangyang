import win32com.client
import csv
from datetime import datetime

# === เชื่อมต่อกับ HEC-RAS ===
hec = win32com.client.Dispatch("RAS630.HECRASController")  # สำหรับ HEC-RAS 6.3

# === ระบุพาธไฟล์โครงการ HEC-RAS และไฟล์ CSV ===
project_file = r"C:\wangyang\RAS_Wangyang1D\Wangyang1D.prj"
csv_file = r"C:\xampp\htdocs\website\ras-output\output_ras.csv"

# === เปิดโครงการ HEC-RAS ===
hec.Project_Open(project_file)

# ตรวจสอบว่าเปิดโครงการสำเร็จหรือไม่
current_project = hec.Project_Current()
if not current_project:
    print("ไม่สามารถเปิดไฟล์โครงการ HEC-RAS ได้ ตรวจสอบพาธไฟล์ .prj")
    exit()

print(f"เปิดโครงการสำเร็จ: {current_project}")

# === กำหนดจำนวนแม่น้ำที่ต้องการดึงข้อมูล ===
rivers = [2, 1]  # แม่น้ำ 1 และ แม่น้ำ 2

# === เตรียมโครงสร้างเก็บข้อมูล ===
data = [["Date", "Cross Section",  "Water_Elevation"]]  # เฉพาะค่าระดับน้ำ
profiles = hec.Output_GetProfiles(1)[1]
profiles = list(profiles)
print(len(profiles))

for round_index in range(len(profiles)-1):
    profile_index = 1 + round_index
    # profile_index = 24 + (round_index * 24)
    # === วนลูปดึงข้อมูลจากทั้งแม่น้ำ 1 และ 2 ===
    for river in rivers:
        nodes_info = hec.Output_GetNodes(river, 1)  # ใช้ Reach ที่ 1
        num_river, num_reach, num_stations = nodes_info[:3]
        nodes = list(hec.Geometry_GetNodes(river, 1)[3])
        print(f"แม่น้ำ {river} มีจำนวนจุดตัดขวาง: {num_stations}")

        if num_stations == 0:
            print(f"แม่น้ำ {river} ไม่มีจุดตัดขวาง ตรวจสอบไฟล์ .prj")
            continue
        
        for i in range(num_stations):
            # ดึงข้อมูลระดับน้ำ (Water Surface Elevation) สำหรับ Profile_index และ Time Step ที่กำหนด
            water_elevation = hec.Output_NodeOutput(river, 1, i + 1, None, profile_index, 2)[0]
            
            # แปลงรูปแบบวันที่เป็น DD/MM/YYYY HH:MM
            try:
                profile_datetime = datetime.strptime(profiles[profile_index], "%d%b%Y %H%M")
                formatted_datetime = profile_datetime.strftime("%d/%m/%Y %H:%M")
            except ValueError:
                formatted_datetime = profiles[profile_index]  # ใช้ค่าดั้งเดิมถ้าแปลงไม่ได้
            
            print(f"📍{profile_index} แม่น้ำ {river}, CrossSection {nodes[i]} Date {formatted_datetime}: water_elevation={water_elevation}")
            data.append([formatted_datetime,nodes[i], water_elevation])  # บันทึกข้อมูล

# === ปิดโครงการ ===
hec.Project_Close()

# === บันทึกข้อมูลลงไฟล์ CSV ===
with open(csv_file, mode="w", newline="") as file:
    writer = csv.writer(file)
    writer.writerows(data)

print(f"บันทึกค่าระดับน้ำลงไฟล์ CSV เรียบร้อย: {csv_file}")

