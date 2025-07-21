from hms.model import Project
from hms import Hms

# Open and run HEC-HMS
myProject = Project.open("C:\wangyang\hms_wangyang\Wangyang\Wangyang.hms")

# Run Forecast
myProject.computeForecast("Forecast_1")

# Close the project
myProject.close()

# Shut down HMS Engine
Hms.shutdownEngine()

print("Forecast completed successfully!")
