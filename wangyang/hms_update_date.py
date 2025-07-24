from datetime import datetime, timedelta

# --- Automatic Date and Time Settings ---
today = datetime.today()
# Start Date for flow data (7 days before today)
start_date_flow = (today - timedelta(days=7)).strftime("%d %B %Y")
# End Date for flow data (today)
end_date_flow = today.strftime("%d %B %Y")

# Start Date for precipitation data (7 days before today)
start_date_precip = (today - timedelta(days=7)).strftime("%d %B %Y")
# End Date for precipitation data (6 days ahead of today)
end_date_precip = (today + timedelta(days=6)).strftime("%d %B %Y")

# All times are 07:00
gage_time = "07:00"

# --- File Paths ---
forecast_file = r"C:\wangyang\hms_wangyang\Wangyang\forecast\Forecast_1.forecast"
gage_file = r"C:\wangyang\hms_wangyang\Wangyang\Wangyang.gage" # New file to modify

# --- Update Forecast_1.forecast (existing logic) ---
try:
    with open(forecast_file, "r") as file:
        lines = file.readlines()

    new_lines_forecast = []
    for line in lines:
        if line.strip().startswith("Start Date:"):
            new_lines_forecast.append(f"     Start Date: {start_date_flow}\n")
        elif line.strip().startswith("Start Time:"):
            new_lines_forecast.append(f"     Start Time: {gage_time}\n")
        elif line.strip().startswith("Forecast Date:"):
            new_lines_forecast.append(f"     Forecast Date: {end_date_flow}\n") # Forecast date is typically 'today'
        elif line.strip().startswith("Forecast Time:"):
            new_lines_forecast.append(f"     Forecast Time: {gage_time}\n")
        elif line.strip().startswith("End Date:"):
            new_lines_forecast.append(f"     End Date: {end_date_precip}\n") # End date extends to forecast
        elif line.strip().startswith("End Time:"):
            new_lines_forecast.append(f"     End Time: {gage_time}\n") # Using gage_time for consistency
        else:
            new_lines_forecast.append(line)

    with open(forecast_file, "w") as file:
        file.writelines(new_lines_forecast)
    print(f"Updated forecast file '{forecast_file}' successfully!")

except FileNotFoundError:
    print(f"Error: File '{forecast_file}' not found.")
except Exception as e:
    print(f"An error occurred while updating '{forecast_file}': {e}")


# --- Update Wangyang.gage (new logic) ---
try:
    with open(gage_file, "r") as file:
        lines = file.readlines()

    new_lines_gage = []
    in_gage_block = False
    gage_type = None # To distinguish Flow from Precipitation

    for line in lines:
        stripped_line = line.strip()

        if stripped_line.startswith("Gage:"):
            in_gage_block = True
            gage_type = None # Reset type for new gage
            new_lines_gage.append(line)
        elif in_gage_block and stripped_line.startswith("Gage Type:"):
            if "Flow" in line:
                gage_type = "Flow"
            elif "Precipitation" in line:
                gage_type = "Precipitation"
            new_lines_gage.append(line)
        elif in_gage_block and stripped_line.startswith("Start Time:"):
            if gage_type == "Flow":
                new_lines_gage.append(f"       Start Time: {start_date_flow}, {gage_time}\n")
            elif gage_type == "Precipitation":
                new_lines_gage.append(f"       Start Time: {start_date_precip}, {gage_time}\n")
            else: # If type is not explicitly found, default to precipitation range (safer for general 'gage')
                new_lines_gage.append(f"       Start Time: {start_date_precip}, {gage_time}\n")
        elif in_gage_block and stripped_line.startswith("End Time:"):
            if gage_type == "Flow":
                new_lines_gage.append(f"       End Time: {end_date_flow}, {gage_time}\n")
            elif gage_type == "Precipitation":
                new_lines_gage.append(f"       End Time: {end_date_precip}, {gage_time}\n")
            else: # Default to precipitation range
                new_lines_gage.append(f"       End Time: {end_date_precip}, {gage_time}\n")
        elif stripped_line == "End:":
            in_gage_block = False # Exit gage block
            gage_type = None # Clear gage type
            new_lines_gage.append(line)
        else:
            new_lines_gage.append(line)

    with open(gage_file, "w") as file:
        file.writelines(new_lines_gage)
    print(f"Updated gage file '{gage_file}' successfully!")

except FileNotFoundError:
    print(f"Error: File '{gage_file}' not found. Please ensure the path is correct.")
except Exception as e:
    print(f"An error occurred while updating '{gage_file}': {e}")