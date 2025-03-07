import win32com.client
import os
import time
import re

# 📂 กำหนดพาธไฟล์ .p01 ของแผนปัจจุบัน
p01_file = r"D:\sti_hms_sukhothai\HEC-Ras RID4\RID4.p01"

# 🕒 กำหนดวันที่ที่ต้องการเปลี่ยน
start_date = "01AUG2011,00.00"
end_date = "08AUG2011,00.00"

# อ่านไฟล์ .p01
with open(p01_file, "r", encoding="utf-8") as file:
    lines = file.readlines()

# ค้นหาและแก้ไขค่า Simulation Date
for i, line in enumerate(lines):
    if line.startswith("Simulation Date="):
        lines[i] = f"Simulation Date={start_date},{end_date}\n"
        print(f"✅ Updated Simulation Date to: {start_date} - {end_date}")

# เขียนไฟล์ .p01 กลับไป
with open(p01_file, "w", encoding="utf-8") as file:
    file.writelines(lines)

print("✅ Successfully updated .p01 file.")


# 📂 ตั้งค่าพาธของโปรเจกต์ HEC-RAS
RAS_PROJECT = r"D:\sti_hms_sukhothai\HEC-Ras RID4\RID4.prj"
RAS_PROJECT = os.path.abspath(RAS_PROJECT)
print(f"📂 Using project file: {RAS_PROJECT}")

# 📂 ลองเชื่อมต่อกับ HEC-RAS หลายเวอร์ชัน
RAS_VERSIONS = ["RAS630.HECRASController"]
ras = None

for version in RAS_VERSIONS:
    try:
        ras = win32com.client.Dispatch(version)
        print(f"✅ Connected to HEC-RAS using {version}")
        break
    except Exception as e:
        print(f"❌ Failed to connect using {version}: {e}")
        continue

if ras is None:
    print("❌ Failed to connect to any HEC-RAS version.")
    exit()

# 📂 เปิด HEC-RAS และโปรเจกต์
try:
    ras.ShowRas()
    time.sleep(2)  # ให้ HEC-RAS มีเวลาเปิด GUI
    ras.Project_Open(RAS_PROJECT)

    if not ras.Project_Current():
        print("❌ No project is currently open!")
        exit()
    else:
        print(f"✅ Project '{ras.Project_Current()}' is open.")

    # 📂 ดึงรายชื่อแผนทั้งหมด
    plans_info = ras.Plan_Names()
    if isinstance(plans_info, tuple) and len(plans_info) > 1:
        plans = plans_info[1]  # รายชื่อแผน
    else:
        print("❌ Error: Unexpected plan structure received.")
        exit()

    print(f"✅ Available Plans: {plans}")

    # 📂 ตั้งค่าแผนปัจจุบันเป็นตัวแรก (หากยังไม่มี)
    if not ras.PlanOutput_IsCurrent():
        ras.Plan_SetCurrent(plans[0])
    print(f"✅ Current plan set to: {plans[0]}")

    # 📂 ตรวจสอบไฟล์ที่ใช้ในแผนปัจจุบัน
    geom_file = ras.CurrentGeomFile()
    flow_file = ras.CurrentUnSteadyFile()
    plan_file = ras.CurrentPlanFile()
    print(f"📂 Geometry File: {geom_file}")
    print(f"📂 Unsteady Flow File: {flow_file}")
    print(f"📂 Plan File: {plan_file}")

    # 📂 รัน Compute Unsteady Flow Analysis ด้วยคำสั่ง RC.Compute_CurrentPlan(None, None, True)
    print(f"🚀 Running Unsteady Flow Analysis for Plan: {plans[0]} ...")
    success, code, message, _ = ras.Compute_CurrentPlan(None, None, True)

    print(f"🔍 Computation Result: {success}, Code: {code}, Message: {message}")

    if success:
        print("✅ Unsteady Flow Analysis completed successfully.")
    else:
        print(f"❌ Error while running Unsteady Flow Analysis: {message}")

    # 📂 ปิด HEC-RAS
    ras.QuitRas()
    print("✅ HEC-RAS closed successfully.")

except Exception as e:
    print(f"❌ Error while running Unsteady Flow Analysis: {e}")
    exit()
