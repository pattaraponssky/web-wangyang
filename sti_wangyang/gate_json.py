import pandas as pd
import json
from datetime import datetime

# === Config ===
csv_input_path = r"/Users/dan/เขื่อนวังยาง/sti_wangyang/output-ras/gate_output.csv"
json_output_path = r"/Users/dan/เขื่อนวังยาง/sti_wangyang/output-ras/gate_open.json"
csv_output_path = r"/Users/dan/เขื่อนวังยาง/sti_wangyang/output-ras/gate_open.csv"
station_code = "WY.02"
station_name = "ปตร.วังยาง"
gate_open_value = 6

# === Load CSV ===
df = pd.read_csv(csv_input_path)
df.columns = df.columns.str.strip()
df["DateTime"] = pd.to_datetime(df["DateTime"], format="%d/%m/%Y %H:%M")

# === Initialize ===
merged_data = []
start_index = 0
start_time = df.iloc[start_index]["DateTime"]
current_values = [df.iloc[start_index]["gate_open"]]
first_time = start_time

for i in range(1, len(df)):
    current_time = df.iloc[i]["DateTime"]
    current_ht = df.iloc[i]["gate_open"]
    prev_ht = df.iloc[i - 1]["gate_open"]
    time_diff_hrs = (current_time - first_time).total_seconds() / 3600
    diff = abs(current_ht - prev_ht)

    if time_diff_hrs <= 3:
        # ยังอยู่ใน 3 ชั่วโมงแรก → รวมกลุ่มตลอด
        current_values.append(current_ht)
    elif diff < 0.5:
        # ตั้งแต่ชั่วโมงที่ 4 ขึ้นไป → รวมเฉพาะถ้าต่างกัน < 0.5
        current_values.append(current_ht)
    else:
        # ถ้าต่างมากกว่า 0.5 → ปิดช่วงเดิม แล้วเริ่มใหม่
        end_time = current_time
        avg_ht = round(sum(current_values) / len(current_values), 1)

        merged_data.append({
            "station_code": station_code,
            "station_name": station_name,
            "dt_begin": start_time.strftime("%Y-%m-%d %H:%M"),
            "dt_end": end_time.strftime("%Y-%m-%d %H:%M"),
            "hour": start_time.strftime("%H:%M"),
            "gate_open": gate_open_value,
            "gate1_ht": avg_ht,
            "gate2_ht": avg_ht,
            "gate3_ht": avg_ht,
            "gate4_ht": avg_ht,
            "gate5_ht": avg_ht,
            "gate6_ht": avg_ht,
        })

        # เริ่มช่วงใหม่
        start_time = current_time
        current_values = [current_ht]
        first_time = current_time  # reset reference time for new block

# เพิ่มช่วงสุดท้าย
end_time = df.iloc[-1]["DateTime"]
avg_ht = round(sum(current_values) / len(current_values), 1)
merged_data.append({
    "station_code": station_code,
    "station_name": station_name,
    "dt_begin": start_time.strftime("%Y-%m-%d %H:%M"),
    "dt_end": end_time.strftime("%Y-%m-%d %H:%M"),
    "hour": start_time.strftime("%H:%M"),
    "gate_open": gate_open_value,
    "gate1_ht": avg_ht,
    "gate2_ht": avg_ht,
    "gate3_ht": avg_ht,
    "gate4_ht": avg_ht,
    "gate5_ht": avg_ht,
    "gate6_ht": avg_ht,
})

# === Save JSON
with open(json_output_path, "w", encoding="utf-8") as f:
    json.dump(merged_data, f, indent=2, ensure_ascii=False)

# === Save CSV
df_output = pd.DataFrame(merged_data)
df_output.to_csv(csv_output_path, index=False, encoding="utf-8-sig")

print("✅ บันทึกไฟล์ gate_open.json และ gate_open.csv เรียบร้อยแล้ว")
