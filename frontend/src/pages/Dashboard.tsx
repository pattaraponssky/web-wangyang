import React, { useEffect, useState } from "react";
import { Typography, Box, Grid } from "@mui/material";
import LongdoMap from "../components/Dashboard/MapComponent";
import DashboardCards from "../components/Dashboard/DashboardCards";
import LongProfileChart from "../components/Dashboard/LongProfileChart";
import WaterForecastChart from "../components/Dashboard/WaterForecastChart";
import FloodWarningTable from "../components/Dashboard/WarningTable";

import WaterGateTable from "../components/Dashboard/WaterGateTable";
import WaterLevelChart from "../components/Dashboard/WaterLevel";
import FloatingMenu from "../components/Dashboard/selectMenu";
import Papa from "papaparse";
import { API_URL, Path_File } from "../utility";
import ImageComponent from "../components/Dashboard/ImageComponent";


interface WaterLevelData {
  time: string;
  station: string;
  elevation: number;
}

interface waterData {
  CrossSection: number;
  Date: string | null;
  WaterLevel: number;
}

const stationMapping: Record<string, number> = {
  "E.91": 184715,
  "E.1": 151870,
  "E.8A": 112911,
  "WY": 62093,
  "E.66A": 51452,
  "E.87": 3636,
};

const Dashboard: React.FC = () => {
  const mapKey = 'e75fee377b3d393b7a32576ce2b0229d';
  const [maxElevations, setMaxElevations] = useState<Record<string, number>>({});
  const [data, setData] = useState<WaterLevelData[]>([]);
  const [waterData, setWaterData] = useState<waterData[]>([]);// for LongProfileChart
  const [displayDate, setDisplayDate] = useState<string>("");

  // สถานะสำหรับ delay การแสดงผล
  const [showForecast, setShowForecast] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWaterLevel, setShowWaterLevel] = useState(false);
  const [showGate, setShowGate] = useState(false);

  // States สำหรับข้อมูล API ต่างๆ
  const [rainData, setRainData] = useState(null);
  const [flowData, setFlowData] = useState(null);
  const [eleData, setEleData] = useState(null);
  const [wyData, setWyData] = useState(null); // <-- เพิ่ม state สำหรับ wyData

  const now = new Date();
  const year = now.getFullYear(); // เช่น 2025
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // --- New functions for managing the alert ---
  const showForecastAlert = () => {
    const alertElement = document.getElementById('forecast-alert');
    if (alertElement) {
        alertElement.style.display = 'block';
    }
  };

  const hideForecastAlert = () => {
    const alertElement = document.getElementById('forecast-alert');
    if (alertElement) {
        alertElement.style.display = 'none';
    }
  };
  
    useEffect(() => {
    const closeButton = document.getElementById('close-forecast-alert');
    if (closeButton) {
      closeButton.addEventListener('click', hideForecastAlert);
    }

    // Cleanup function: remove the event listener when the component unmounts
    return () => {
      if (closeButton) {
        closeButton.removeEventListener('click', hideForecastAlert);
      }
    };
  }, []);

  useEffect(() => {
    const safeFetch = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
      } catch (error) {
        console.warn(`❌ Failed to fetch ${url}:`, error);
        return null; // ❗️ ถ้า error ให้ return null
      }
    };

    const loadAllApiData = async () => {
      const [rain, flow, ele, wy] = await Promise.all([
        safeFetch(`${API_URL}API/api_rain_hydro3.php`),
        safeFetch(`${API_URL}API/api_flow_hydro3.php`),
        safeFetch(`${API_URL}API/api_elevation_hydro3.php`),
        safeFetch(`${API_URL}API/api_station_daily.php`),
      ]);

      setRainData(rain ?? []); // ❗️ fallback เป็น array เปล่า
      setFlowData(flow ?? []);
      setEleData(ele ?? []);
      setWyData(wy ?? []);
    };

    loadAllApiData();
  }, []);


useEffect(() => {
    fetch(`${Path_File}ras-output/output_ras.csv`)
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const rawData: any[] = result.data;
            if (!rawData.length) {
              showForecastAlert(); // Show alert if no data at all
              return;
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // --- Define 7 AM on current day for filtering ---
            const sevenAmToday = new Date();
            sevenAmToday.setHours(7, 0, 0, 0); // Set to 7:00:00 of today
            // --- End 7 AM definition ---

            // แปลงข้อมูล CSV ระดับน้ำเป็นอ็อบเจ็กต์
            const parsedData: WaterLevelData[] = rawData.map((row) => {
              const rawTime = row["Date"]?.trim();
              const crossSection = Number(row["Cross Section"]?.trim());
              const elevation = parseFloat(row["Water_Elevation"]?.trim());
              const station = Object.keys(stationMapping).find((key) => stationMapping[key] === crossSection) || "";

              let time = "";
              if (rawTime) {
                const [datePart, timePart] = rawTime.split(" ");
                const [day, month, year] = datePart.split("/").map(Number);
                const isoDateStr = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                time = `${isoDateStr}T${timePart}`;
              }

              return { time, station, elevation };
            })
            // Filter data to start from 7 AM of today
            .filter(item => {
              return item.station && item.time && new Date(item.time) >= sevenAmToday;
            }).filter(item => item.station && item.time);

            let parsedWaterData = rawData.slice(1).map((row: any) => {
              const rawDate = row["Date"]?.trim();
              const crossSection = row['Cross Section'].trim();
              const elevation = parseFloat(row["Water_Elevation"]?.trim());
              let formattedDate = null;

              if (rawDate) {
                const [day, month, yearAndTime] = rawDate.split("/");
                const [year, time] = yearAndTime.split(" ");
                formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${time}`;
              }

              return {
                CrossSection: parseInt(crossSection),
                Date: formattedDate,
                WaterLevel: elevation,
              };
            })
            // Filter parsedWaterData to start from 7 AM of today as well
            .filter((item: any) => {
              return item.Date && new Date(item.Date) >= sevenAmToday;
            });

            // ข้อมูล maxElevations
            const stationMaxMap: Record<string, number> = {};
            // If parsedData is empty after 7 AM filter, latestTime will be problematic.
            // Ensure parsedData has elements before finding latest time.
            const latestTime = parsedData.length > 0 ? new Date(Math.max(...parsedData.map((d) => new Date(d.time).getTime()))) : new Date(); // Fallback to current date
            const sevenDaysAgo = new Date(latestTime);
            sevenDaysAgo.setDate(latestTime.getDate() - 6); // corrected to 7 days ago

            Object.keys(stationMapping).forEach((station) => {
              // Ensure filtering for maxElevation also respects the 7 AM start for consistency
              const stationData = parsedData.filter(
                (d) => d.station === station && new Date(d.time) >= sevenAmToday
              );
              const maxElevation = Math.max(...stationData.map((d) => d.elevation));
              if (!isNaN(maxElevation)) {
                stationMaxMap[station] = maxElevation;
              }
            });

            // --- Logic for displayDate and alert ---
            // The latestValid should be from the data *after* 7 AM filter
            const latestValid = parsedData[parsedData.length - 1]; 
            let calculatedDisplayDate = "";

            if (latestValid) {
              const latestDateFromCSV = new Date(latestValid.time);
              // Set the display date to 7 days *before* the latest valid date in CSV
              latestDateFromCSV.setDate(latestDateFromCSV.getDate() - 6); 

              calculatedDisplayDate = latestDateFromCSV.toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            } else {
              // If no valid data at all (after 7 AM filter), the display date should reflect that there's an issue
              calculatedDisplayDate = "ไม่พบข้อมูล"; 
            }

            // Get current date formatted for comparison
            const currentDateForComparison = new Date();
            const formattedCurrentDate = currentDateForComparison.toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            if (calculatedDisplayDate !== formattedCurrentDate) {
                showForecastAlert();
            } else {
                hideForecastAlert();
            }
            
            setDisplayDate(calculatedDisplayDate); // Set the calculated display date
            // --- End Logic for displayDate and alert ---

            // Set state for each required data
            setMaxElevations(stationMaxMap);
            setData(parsedData); // This seems to be for another table/chart, if not used, can remove.
            setWaterData(parsedWaterData); // ตรวจสอบข้อมูลก่อนการตั้ง state
          },
        });
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
        showForecastAlert(); // Show alert also on fetch/parse error
      });
  }, []);

  useEffect(() => {
    // Only show components when all necessary data is loaded
    if (rainData && flowData && eleData && wyData && data.length > 0 && waterData.length > 0) {
      const timers = [
        setTimeout(() => setShowForecast(true), 1000),
        setTimeout(() => setShowProfile(true), 1000),
        setTimeout(() => setShowWaterLevel(true), 1000),
        setTimeout(() => setShowGate(true), 2000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [rainData, flowData, eleData, wyData, data, waterData]); // Add all data dependencies

  const JsonPaths = [
    `${Path_File}data/River.geojson`,
    `${Path_File}data/ProjectArea.geojson`,
    `${Path_File}data/DamStation.geojson`,
    `${Path_File}data/HydroStation.geojson`,
    `${Path_File}data/RainStation.geojson`,
    `${Path_File}data/ProjectStation.geojson`,
  ];

  const BoxStyle = {
    margin: "auto",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: 3,
    marginBottom: "20px",
  };

  const imageBaseUrl = `http://middlechi-omp.rid.go.th/main/wp-content/uploads/${year}/${month}`;

  return (
    <div style={{ fontFamily: "Prompt" }}>
     <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt", color: "#28378B" }}>
        สรุปสถานการณ์น้ำประจำวันที่ <span style={{ color: "#64b5f6" }}>{displayDate}</span>
      </Typography>

      <Box sx={{ padding: "20px", maxWidth: "100%", margin: "auto", backgroundColor: "white", borderRadius: "10px", boxShadow: 3, marginBottom: "20px" }} id="map">
        <Typography variant="h6" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt", color: "#28378B" }}>
          แผนที่ตำแหน่งสถานีที่สำคัญพื้นที่ศึกษาโครงการวังยาง
        </Typography>
        <LongdoMap
          id="longdo-map"
          mapKey={mapKey}
          JsonPaths={JsonPaths}
          rainData={rainData ?? []}
          flowData={flowData ?? []}
          eleData={eleData ?? []}
          wyData={wyData ?? []}
        />
      </Box>

      <Box sx={{ marginBlock: "20px" }}>
        <DashboardCards />
      </Box>

      <Box sx={{ ...BoxStyle, padding: "20px" }} id="forecast-chart">
        {showForecast && <WaterForecastChart />}
      </Box>

      <Box sx={{ ...BoxStyle }} id="flood-warning">
        <FloodWarningTable maxLevels={maxElevations} />
      </Box>

      <Box sx={BoxStyle} id="profile-chart">
        {showProfile && <LongProfileChart waterData={waterData} />}
      </Box>

      <Box id="water-level" sx={{ ...BoxStyle }}>
        {showWaterLevel && <WaterLevelChart data={data}/>}
      </Box>

      <Box sx={{ ...BoxStyle, paddingBottom: "20px" }} id="water-gate">
        {showGate && <WaterGateTable />}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6} sm={12}>
          <Box sx={BoxStyle} id="flood-map">
            <ImageComponent src="./images/map_flood.png" alt="" title={"แผนที่น้ำท่วมพื้นที่วังยาง"} />
          </Box>
        </Grid>
        <Grid item xs={12} md={6} sm={12}>
          <Box sx={BoxStyle} id="diagrams-map">
            <ImageComponent
              src={`${imageBaseUrl}/4.%E0%B8%9C%E0%B8%B1%E0%B8%87%E0%B8%99%E0%B9%89%E0%B8%B3.jpg`}
              fallbackSrc="./images/ผังน้ำชี.jpg"
              alt="แผนผังลุ่มแม่น้ำชี"
              title={"แผนผังลุ่มแม่น้ำชี"}
            />
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
      <Grid item xs={12} md={6} sm={12}>
        <Box sx={BoxStyle} id="report">
          <ImageComponent
            src={`${imageBaseUrl}/3.3.1.jpg`}
            fallbackSrc="./images/สรุปเขื่อนวังยาง.jpg"
            height="100%"
            width="100%"
            alt=""
            title="รายงานระดับน้ำเขื่อนวังยาง"
          />
        </Box>
      </Grid>
      <Grid item xs={12} md={6} sm={12}>
        <Box sx={BoxStyle} id="report-chart">
          <ImageComponent
            src={`${imageBaseUrl}/3.3-%E0%B8%81%E0%B8%A3%E0%B8%B2%E0%B8%9F%E0%B9%80%E0%B8%82%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%99%E0%B8%A7%E0%B8%B1%E0%B8%87%E0%B8%A2%E0%B8%B2%E0%B8%87_001.jpg`}
            fallbackSrc="./images/กราฟเขื่อนวังยาง.jpg"
            height="100%"
            width="100%"
            alt=""
            title="รายงานกราฟแสดงระดับน้ำเขื่อนวังยาง"
          />
        </Box>
      </Grid>
    </Grid>

      <FloatingMenu />
    </div>
  );
};

export default Dashboard;