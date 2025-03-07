from hec.heclib.dss import HecDss
from datetime import datetime, timedelta

file = R"D:\sti_wangyang\RAS_WangYang\Wangyang.dss"
dssfile = HecDss.open(file)

# Define the paths
paths = [
    "/Chi River_US Reach 1/184715/FLOW/01Apr2010/1Hour/Un Cari/",
    "/Chi River_US Reach 1/151870/FLOW/01Apr2010/1Hour/Un Cari/",
    "/Chi River_US Reach 1/112911/FLOW/01Apr2010/1Hour/Un Cari/",
    "/Chi River_US Reach 1/51452/FLOW/01Apr2010/1Hour/Un Cari/",
    "/lampao Reach 1/37154/FLOW/01Apr2010/1Hour/Un Cari/"
]

# Open the file for writing export
with open(R'D:\sti_wangyang\ras-output\ras-output.csv', 'w') as file:
    file.write("DateTime,E.91,E.1,E.8A,E.66A,E.87\n")
    
    # Fetch data for each path
    flows = [dssfile.get(path) for path in paths]
    
    # Assuming all times are the same across paths
    times = flows[0].getTimes()
    
    # Get the number of values from the first flow object
    num_values = flows[0].numberValues
 
    # Loop through and write the data for all paths
    for i in range(num_values):
        t = times.element(i)
        date_str = t.date(-13)
        
        # Convert date_str to DD/MM/YYYY format
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        date_str = date_obj.strftime("%d/%m/%Y")
        
        time_str = t.time()
        
        # Check if the time is 24:00 and adjust
        if time_str == "24:00":
            time_str = "00:00"
            # Increment the date by one day
            date_obj += timedelta(days=1)
            date_str = date_obj.strftime("%d/%m/%Y")
        
        row = [date_str + " " + time_str]  # DateTime column
        
        # Add the values for each sink
        for flow in flows:
            row.append(str(flow.values[i]))
        
        file.write(",".join(row) + "\n")
