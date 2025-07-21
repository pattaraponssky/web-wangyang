import pandas as pd
import json
from datetime import datetime, date

# === Config ===
csv_input_path = r"/Users/dan/เขื่อนวังยาง/wangyang/output-ras/gate_output.csv"
json_output_path = r"/Users/dan/เขื่อนวังยาง/wangyang/output-ras/gate_open.json"
csv_output_path = r"/Users/dan/เขื่อนวังยาง/wangyang/output-ras/gate_open.csv"
station_code = "WY.02"
station_name = "ปตร.วังยาง"
gate_open_value = 6

# === Load CSV ===
df = pd.read_csv(csv_input_path)
df.columns = df.columns.str.strip()
df["DateTime"] = pd.to_datetime(df["DateTime"], format="%d/%m/%Y %H:%M")

# === Filter data from current date onwards ===
current_date = datetime.now().date() # Get today's date (e.g., 2025-07-21)
# Create a datetime object for the beginning of the current day
filter_start_datetime = datetime(current_date.year, current_date.month, current_date.day, 0, 0)

df = df[df["DateTime"] >= filter_start_datetime].copy()

# Check if there's any data left after filtering
if df.empty:
    print("⚠️ ไม่มีข้อมูลตั้งแต่วันที่ปัจจุบันเป็นต้นไป ไม่สามารถทำการคำนวณได้")
    # Save empty JSON and CSV files if no data, or skip saving
    with open(json_output_path, "w", encoding="utf-8") as f:
        json.dump([], f, indent=2, ensure_ascii=False)
    pd.DataFrame().to_csv(csv_output_path, index=False, encoding="utf-8-sig")
    exit() # Exit the script if no data

# Reset index after filtering to ensure iloc works correctly
df.reset_index(drop=True, inplace=True)


# === Initialize ===
merged_data = []
current_block_start_index = 0

while current_block_start_index < len(df):
    start_time = df.iloc[current_block_start_index]["DateTime"]
    current_values_for_block = []
    current_block_end_index = current_block_start_index

    # Initialize first_time for the 3-hour rule for the current sequence
    first_time_in_sequence = df.iloc[current_block_start_index]["DateTime"]

    while current_block_end_index < len(df):
        current_time = df.iloc[current_block_end_index]["DateTime"]
        current_ht = df.iloc[current_block_end_index]["gate_open"]

        # Calculate duration from the *start* of the current block
        duration_from_block_start = (current_time - start_time).total_seconds() / 3600

        # Calculate time difference from the *first entry* in the current aggregation sequence (for 3-hour rule)
        time_diff_from_sequence_start = (current_time - first_time_in_sequence).total_seconds() / 3600

        # If it's the very first point of the block, add it and continue
        if current_block_end_index == current_block_start_index:
            current_values_for_block.append(current_ht)
            current_block_end_index += 1
            continue

        prev_ht = df.iloc[current_block_end_index - 1]["gate_open"]
        diff = abs(current_ht - prev_ht)

        # Conditions to *stop* expanding the current block:
        # 1. The next point would make the block exceed 24 hours.
        # 2. The gate_open value changes significantly AND we're past the initial 3 hours.
        
        # Check if adding the current point exceeds 24 hours for the block
        if duration_from_block_start > 24:
            break # Stop expanding this block, process the previous segment

        # Check the diff condition after the initial 3 hours
        if time_diff_from_sequence_start > 3 and diff >= 0.5:
            break # Stop expanding this block, process the previous segment
        
        current_values_for_block.append(current_ht)
        current_block_end_index += 1

    # Now, process the block that was just defined (from current_block_start_index to current_block_end_index - 1)
    # Ensure there's data to process if the loop broke immediately
    if not current_values_for_block: # This check is important for edge cases if the last point itself causes a break
        current_block_start_index = current_block_end_index # Advance to prevent infinite loop
        continue

    end_time = df.iloc[current_block_end_index - 1]["DateTime"]
    avg_ht = round(sum(current_values_for_block) / len(current_values_for_block), 1)
    duration_hours = (end_time - start_time).total_seconds() / 3600

    final_hour_value = round(duration_hours, 2)

    merged_data.append({
        "station_code": station_code,
        "station_name": station_name,
        "dt_begin": start_time.strftime("%Y-%m-%d %H:%M"),
        "dt_end": end_time.strftime("%Y-%m-%d %H:%M"),
        "hour": final_hour_value,
        "gate_open": gate_open_value,
        "gate1_ht": avg_ht,
        "gate2_ht": avg_ht,
        "gate3_ht": avg_ht,
        "gate4_ht": avg_ht,
        "gate5_ht": avg_ht,
        "gate6_ht": avg_ht,
    })

    # Set the start of the next block
    current_block_start_index = current_block_end_index


# === Save JSON
with open(json_output_path, "w", encoding="utf-8") as f:
    json.dump(merged_data, f, indent=2, ensure_ascii=False)

# === Save CSV
df_output = pd.DataFrame(merged_data)
df_output.to_csv(csv_output_path, index=False, encoding="utf-8-sig")

print("✅ บันทึกไฟล์ gate_open.json และ gate_open.csv เรียบร้อยแล้ว")