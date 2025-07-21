import csv
import json
import requests

# กำหนด path ของ CSV
csv_path = "gate_open.csv"
url = "http://192.168.99.202:3000/api/datadss"

data_list = []

# อ่านไฟล์ CSV
with open(csv_path, mode='r', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        data_list.append({
            "dt_begin": row["dt_begin"],
            "dt_end": row["dt_end"],
            "hour": row["hour"],
            "gate_open": int(row["gate_open"]),
            "gate_ht": float(row["gate_ht"])
        })

# ส่ง POST request
response = requests.post(
    url,
    json=data_list,
    headers={"Content-Type": "application/json"}
)

# ตรวจสอบผลลัพธ์
if response.status_code == 200:
    print("ส่งข้อมูลสำเร็จ ✅")
    print("Response:", response.json())
else:
    print("ส่งข้อมูลไม่สำเร็จ ❌")
    print("Status:", response.status_code)
    print("Response:", response.text)
