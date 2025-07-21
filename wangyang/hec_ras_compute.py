import win32com.client
import os
import time

#  ตั้งค่าพาธของโปรเจกต์ HEC-RAS
RAS_PROJECT = r"C:\wangyang\RAS_Wangyang1D\Wangyang1D.prj"
RAS_PROJECT = os.path.abspath(RAS_PROJECT)
print(f"Using project file: {RAS_PROJECT}")

#  ลองเชื่อมต่อกับ HEC-RAS หลายเวอร์ชัน
RAS_VERSIONS = ["RAS630.HECRASController"]
ras = None

#  กำหนด path ของไฟล์ DSS
dss_file = r"C:\wangyang\RAS_Wangyang1D\Wangyang1D.dss"

# 🔍 ตรวจสอบว่าไฟล์มีอยู่หรือไม่
if os.path.exists(dss_file):
    try:
        os.remove(dss_file)
        print(f"Deleted DSS file: {dss_file}")
    except Exception as e:
        print(f"Failed to delete DSS file: {e}")
else:
    print(f"DSS file not found: {dss_file}")


for version in RAS_VERSIONS:
    try:
        ras = win32com.client.Dispatch(version)
        print(f"Connected to HEC-RAS using {version}")
        break
    except Exception as e:
        print(f"Failed to connect using {version}: {e}")
        continue

if ras is None:
    print("Failed to connect to any HEC-RAS version.")
    exit()

#  เปิด HEC-RAS และโปรเจกต์
try:
    ras.ShowRas()
    time.sleep(2)  # ให้ HEC-RAS มีเวลาเปิด GUI
    ras.Project_Open(RAS_PROJECT)

    if not ras.Project_Current():
        print("No project is currently open!")
        exit()
    else:
        print(f"Project '{ras.Project_Current()}' is open.")

    #  ดึงรายชื่อแผนทั้งหมด
    plans_info = ras.Plan_Names()
    if isinstance(plans_info, tuple) and len(plans_info) > 1:
        plans = plans_info[1]  # รายชื่อแผน
    else:
        print("Error: Unexpected plan structure received.")
        exit()

    print(f"Available Plans: {plans}")

    #  ตั้งค่าแผนปัจจุบันเป็นตัวแรก (หากยังไม่มี)
    if not ras.PlanOutput_IsCurrent():
        ras.Plan_SetCurrent(plans[0])
    print(f"Current plan set to: {plans[0]}")

    #  ตรวจสอบไฟล์ที่ใช้ในแผนปัจจุบัน
    geom_file = ras.CurrentGeomFile()
    flow_file = ras.CurrentUnSteadyFile()
    plan_file = ras.CurrentPlanFile()
    print(f" Geometry File: {geom_file}")
    print(f" Unsteady Flow File: {flow_file}")
    print(f" Plan File: {plan_file}")

    #  รัน Compute Unsteady Flow Analysis ด้วยคำสั่ง RC.Compute_CurrentPlan(None, None, True)
    print(f" Running Unsteady Flow Analysis for Plan: {plans[0]} ...")
    success, code, message, _ = ras.Compute_CurrentPlan(None, None, True)

    print(f" Computation Result: {success}, Code: {code}, Message: {message}")

    if success:
        print("Unsteady Flow Analysis completed successfully.")
    else:
        print(f" Error while running Unsteady Flow Analysis: {message}")

    #  ปิด HEC-RAS
    ras.QuitRas()
    print("HEC-RAS closed successfully.")

except Exception as e:
    print(f" Error while running Unsteady Flow Analysis: {e}")
    exit()
