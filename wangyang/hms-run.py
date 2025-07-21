from datetime import datetime, timedelta
from hms.model import Project
from hms import Hms

# Set automatic dates
today = datetime.today()
start_date = (today - timedelta(days=7)).strftime("%d %B %Y")  # 7 days before
forecast_date = today.strftime("%d %B %Y")  # Current date
end_date = (today + timedelta(days=6)).strftime("%d %B %Y")  # 6 days ahead

start_time = "07:00"
forecast_time = "07:00"
end_time = "06:00"

# Modify the .forecast file
forecast_file = r"C:\sti_wangyang\hms_wangyang\Wangyang\forecast\Forecast_1.forecast"

# Read the file
with open(forecast_file, "r") as file:
    lines = file.readlines()

# Update date and time values
new_lines = []
for line in lines:
    if line.startswith("     Start Date:"):
        new_lines.append("     Start Date: {}\n".format(start_date))
    elif line.startswith("     Start Time:"):
        new_lines.append("     Start Time: {}\n".format(start_time))
    elif line.startswith("     Forecast Date:"):
        new_lines.append("     Forecast Date: {}\n".format(forecast_date))
    elif line.startswith("     Forecast Time:"):
        new_lines.append("     Forecast Time: {}\n".format(forecast_time))
    elif line.startswith("     End Date:"):
        new_lines.append("     End Date: {}\n".format(end_date))
    elif line.startswith("     End Time:"):
        new_lines.append("     End Time: {}\n".format(end_time))
    else:
        new_lines.append(line)

# Save the updated file
with open(forecast_file, "w") as file:
    file.writelines(new_lines)

print("Updated forecast time window successfully!")

# Open and run HEC-HMS
myProject = Project.open("C:\sti_wangyang\hms_wangyang\Wangyang\Wangyang.hms")

# Run Forecast
myProject.computeForecast("Forecast_1")

# Close the project
myProject.close()

# Shut down HMS Engine
Hms.shutdownEngine()

print("Forecast computation completed successfully!")
