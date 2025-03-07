import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Select, MenuItem, CardContent, Typography, Box, Button } from "@mui/material";

interface WaterLevelData {
  time: string;
  station: string;
  elevation: number;
}

const stationMapping: Record<string, number> = {
  "E.91": 184715,
  "E.1": 151870,
  "E.8A": 112911,
  "E.66A": 51452,
  "E.87": 3636,
};

const WaterLevelChart: React.FC = () => {
  const [data, setData] = useState<WaterLevelData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedStation, setSelectedStation] = useState<string>("E.91");

  const csvFilePath = "./ras-output/output_profile.csv";

  useEffect(() => {
    fetch(csvFilePath)
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          complete: (result) => {
            const rawData: any[] = result.data;
  
            if (!rawData.length) {
              console.error("Empty CSV data");
              return;
            }
  
            const headers = Object.keys(rawData[0]);
            console.log("CSV Headers:", headers);
  
            const crossSectionIdx = headers.indexOf("Cross Section");
            const timeIdx = headers.indexOf("Profile");
            const elevationIdx = headers.indexOf("Water Surface Elevation");
  
            if (crossSectionIdx === -1 || timeIdx === -1 || elevationIdx === -1) {
              console.error("CSV format mismatch");
              return;
            }
  
            const parsedData: WaterLevelData[] = rawData.map((row) => {
              const crossSection = Number(row["Cross Section"]?.trim());
              const time = row["Profile"]?.trim();
              const elevation = parseFloat(row["Water Surface Elevation"]);
  
              const station = Object.keys(stationMapping).find(
                (key) => stationMapping[key] === crossSection
              ) || "";
  
              return { time, station, elevation };
            });
  
            const filteredData = parsedData.filter((item) => item.station && item.time);
  
            setData(filteredData);
            setSelectedIndex(0);
          },
          header: true,
          skipEmptyLines: true,
        });
      })
      .catch((error) => console.error("Error loading CSV:", error));
  }, [csvFilePath]);

  const formatDate = (time: string): string => {
    if (!time) return ""; // ตรวจสอบค่าที่ว่าง
  
    const [day, month, yearAndTime] = time.split('/'); // แยก วัน/เดือน/ปี+เวลา
    const [year, hours, minutes] = yearAndTime.split(/[:\s]/); // แยก ปี ชั่วโมง นาที
  
    const formattedDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`); // สร้าง Date object
    
    if (isNaN(formattedDate.getTime())) return "Invalid Date"; // ตรวจสอบว่า Date ถูกต้องไหม
  
    const yyyy = formattedDate.getFullYear();
    const MM = String(formattedDate.getMonth() + 1).padStart(2, '0'); // เดือนต้องเริ่มที่ 1
    const dd = String(formattedDate.getDate()).padStart(2, '0');
    const HH = String(formattedDate.getHours()).padStart(2, '0');
    const mm = String(formattedDate.getMinutes()).padStart(2, '0');
  
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}`; // คืนค่าผลลัพธ์ในรูปแบบ yyyy-MM-dd HH:mm
  };

  const selectedData = data.filter((item) => item.station === selectedStation)[selectedIndex] || { time: "", elevation: 0 };
  const timeList = data.filter((item) => item.station === selectedStation).map((item) => item.time);

  const stationBackgrounds: Record<string, string> = {
    "E.91": "./images/cross_section/E.91.png",
    "E.1": "./images/cross_section/E.1.png",
    "E.8A": "./images/cross_section/E.8A.png",
    "E.66A": "./images/cross_section/E.66A.png",
    "E.87": "./images/cross_section/E.87.png",
  };

  const backgroundImage = stationBackgrounds[selectedStation] || "./images/default.png";

  const stationWaterLevels: Record<
    string,
    { min: number; max: number; warning: number; critical: number }
  > = {
    "E.91": { min: 141, max: 155, warning: 140, critical: 150 },
    "E.1": { min: 136, max: 150, warning: 147, critical: 149 },
    "E.8A": { min: 131, max: 148, warning: 145, critical: 147 },
    "E.66A": { min: 132, max: 146, warning: 143, critical: 145 },
    "E.87": { min: 130, max: 144, warning: 141, critical: 143 },
  };

const getWaterLevelStatus = (station: string, elevation: number) => {
  const level = stationWaterLevels[station];
  if (!level) return { text: "ไม่มีข้อมูล", color: "gray" };

  if (elevation >= level.critical) return { text: "ระดับน้ำวิกฤต", color: "red" };
  if (elevation >= level.warning) return { text: "ระดับน้ำเฝ้าระวัง", color: "orange" };
  return { text: "ระดับน้ำปกติ", color: "green" };
};



  const waterLevelRange = stationWaterLevels[selectedStation];
  const waterLevelPosition = waterLevelRange
    ? ((selectedData.elevation - waterLevelRange.min) / (waterLevelRange.max - waterLevelRange.min)) * 100
    : 0;

  const handlePrevTime = () => {
    if (selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  };

  const handleNextTime = () => {
    if (selectedIndex < timeList.length - 1) setSelectedIndex(selectedIndex + 1);
  };


  return (
    <CardContent>
      <Typography variant="h6" sx={{ textAlign: "center", mb: 2, fontFamily: "Prompt", fontWeight: "bold",color:"#28378B" }}>
        ระดับน้ำรายชั่วโมง สถานี {selectedStation}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 1, mb: 2 }}>
        
        <Button variant="contained" onClick={handlePrevTime} disabled={selectedIndex === 0} sx={{ fontFamily: "Prompt", minHeight: "40px", fontSize: { xs: "0.8rem", sm: "1rem" } }}>
          ⬅️ ย้อนหลัง
        </Button>

        <Select value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)} sx={{  fontSize: { xs: "0.8rem", sm: "1rem" } }}>
          {Object.keys(stationMapping).map((station) => (
            <MenuItem key={station} value={station}>
              {station}
            </MenuItem>
          ))}
        </Select>

        <Select value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))} sx={{  fontSize: { xs: "0.8rem", sm: "1rem" } }}>
          {timeList.map((time, index) => (
            <MenuItem key={time} value={index}>
              {formatDate(time)}
            </MenuItem>
          ))}
        </Select>

        <Button variant="contained" onClick={handleNextTime} disabled={selectedIndex >= timeList.length - 1} sx={{ fontFamily: "Prompt", minHeight: "40px", fontSize: { xs: "0.8rem", sm: "1rem" } }}>
          ถัดไป ➡️
        </Button>

      </Box>

      <Box sx={{ position: "relative", width: "100%", aspectRatio: "20/8" , height: {
            xs: "auto",  // สำหรับขนาดจอเล็ก
            sm: "auto",  // สำหรับขนาดจอปานกลาง
            md: "auto",  // สำหรับขนาดจอใหญ่
          },}}>
        <img src={backgroundImage} alt={`Station ${selectedStation}`} style={{ width: "100%", height: "auto", objectFit: "cover"}} />

        <Box
          sx={{
            position: "absolute",
            bottom: `${waterLevelPosition}%`,
            left: 0,
            width: "100%",
            height: 5,
            backgroundColor: "blue",
            opacity: 0.8,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            bottom: `${waterLevelPosition + 5}%`,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "white",
            padding: "6px 8px",
            borderRadius: "8px",
            boxShadow: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" fontWeight="bold">
            {selectedData.elevation.toFixed(2)} ม.
          </Typography>
          <Box
            sx={{
              textAlign: "center",
              p: 2,
              borderRadius: 2,
              backgroundColor: getWaterLevelStatus(selectedStation, selectedData.elevation).color,
              color: "white",
              fontWeight: "bold",
            }}
          >
          {getWaterLevelStatus(selectedStation, selectedData.elevation).text}
        </Box>
        </Box>
        <Box
            sx={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "10px solid black", // สามเหลี่ยมชี้ลง
              margin: "-15px auto 0", // ปรับระยะห่างให้เหมาะสม
            }}
          />
        </Box>
     
    </CardContent>
  );
};

export default WaterLevelChart;
