import React, { useEffect, useState } from "react";
import { Typography, Box, Grid } from "@mui/material";
import LongdoMap from "../components/Dashboard/MapComponent";
import DashboardCards from "../components/Dashboard/DashboardCards";
import LongProfileChart from "../components/Dashboard/LongProfileChart";
import WaterForecastChart from "../components/Dashboard/WaterForecastChart";
import FloodWarningTable from "../components/Dashboard/WarningTable";

import WaterGateTable from "../components/Dashboard/WaterGateTable";
import WaterLevelChart from '../components/Dashboard/WaterLevel';
import FloatingMenu from "../components/Dashboard/selectMenu";
import Papa from "papaparse";
import { API_URL, Path_File } from "../utility";
import ImageComponent from "../components/Dashboard/ImageComponent";
import WaterLevelForecastChart from "../components/Dashboard/WaterLevelForecastChart";


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

// Define the structure of the raw data parsed from output_ras.csv
interface RawOutputRasDataItem {
  "Date": string;
  "Cross Section": string;
  "Water_Elevation": string;
}

// Define the format ApexCharts expects for its series data (needed here now)
interface ApexChartSeriesData {
  name: string;
  data: [number, number][]; // [timestamp, value]
}

const stationMapping: Record<string, number> = {
  "E.91": 184803,
  "E.8A": 112911,
  "BTH": 79205,
  "WY": 62093,
  "E.66A": 51452,
  "E.87": 3636,
  "RE": 1158,
};

interface RawStaFlowDataItem {
  DateTime: string;
  'E.91': string;
  'E.1': string;
  'E.8A': string;
  'WY': string; // For 'เขื่อนวังยาง'
  'E.66A': string;
  'E.87': string;
  'RE': string; 
  'BTH': string; 
}

// นี่คือการดึง (Define) ข้อมูล mapping ที่หน้า Dashboard
const stationWaterLevelForecastMap: Record<string, number> = {
  "เขื่อนวังยาง": 62093,
  "เขื่อนร้อยเอ็ด": 1158,
};

const Dashboard: React.FC = () => {
  const mapKey = 'e75fee377b3d393b7a32576ce2b0229d';
  const [maxElevations, setMaxElevations] = useState<Record<string, number>>({});
  const [maxFlows, setMaxFlows] = useState<Record<string, number>>({});
  const [data, setData] = useState<WaterLevelData[]>([]);
  const [waterData, setWaterData] = useState<waterData[]>([]);// for LongProfileChart
  const [displayDate, setDisplayDate] = useState<string>("");
  const [forecastChartData, setForecastChartData] = useState<ApexChartSeriesData[] | null>(null); // New state for forecast chart data

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

   // Helper function to convert "dd/mm/yyyy HH:MM" to Unix timestamp (moved here)
   const convertToTimestamp = (dateTimeStr: string): number | null => {
    const trimmedStr = dateTimeStr?.trim();
    if (!trimmedStr) return null;

    const dateTimeParts = trimmedStr.split(' ');
    if (dateTimeParts.length !== 2) return null;
    const [datePart, timePart] = dateTimeParts;

    const dateSubParts = datePart.split('/');
    if (dateSubParts.length !== 3) return null;
    const [dayStr, monthStr, yearStr] = dateSubParts;

    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    // Use string format recognized by Date constructor for robustness (YYYY-MM-DDTHH:MM)
    const isoDateStr = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const dateObj = new Date(`${isoDateStr}T${timePart}`);

    if (isNaN(dateObj.getTime())) return null;

    return dateObj.getTime();
  };

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

      setRainData(rain ?? []); 
      setFlowData(flow ?? []);
      setEleData(ele ?? []);
      setWyData(wy ?? []);
    };

    loadAllApiData();
  }, []);

  // --- Combined useEffect for fetching and processing output_ras.csv ---
  useEffect(() => {
    const csvFilePath = `${Path_File}ras-output/output_ras.csv`;
    fetch(csvFilePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((csvData) => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          complete: (result) => {
            const rawData: RawOutputRasDataItem[] = result.data as RawOutputRasDataItem[];
            
            if (!rawData.length) {
                showForecastAlert(); // Show alert if no data at all
                setForecastChartData(null); // Set chart data to null on no data
                setMaxElevations({}); // Reset related states
                setData([]);
                setWaterData([]);
                setDisplayDate("ไม่พบข้อมูล");
                return;
            }
            const sevenDay = new Date();
            const sevenAmToday = new Date();
            sevenAmToday.setDate(sevenAmToday.getDate()); // Start 7 days ago at 7 AM
            sevenAmToday.setHours(7, 0, 0, 0);
            sevenDay.setDate(sevenDay.getDate() - 7); // Start 7 days ago at 7 AM
            sevenDay.setHours(7, 0, 0, 0);

            // --- Processing for WaterLevelForecastChart (forecastChartData) ---
            const processedForecastData: WaterLevelData[] = [];
            rawData.forEach((row) => {
                const rawTime = row["Date"];
                const crossSectionRaw = row["Cross Section"];
                const elevationRaw = row["Water_Elevation"];

                if (rawTime === undefined || crossSectionRaw === undefined || elevationRaw === undefined) {
                    console.warn('Skipping row in forecast data due to missing essential data:', row);
                    return;
                }

                const time = convertToTimestamp(rawTime);
                const crossSectionNum = Number(crossSectionRaw.trim());
                const elevation = parseFloat(elevationRaw.trim());

                const station = Object.keys(stationWaterLevelForecastMap).find((key) => stationWaterLevelForecastMap[key] === crossSectionNum) || "";

                if (
                    time !== null &&
                    station !== "" &&
                    !isNaN(elevation) &&
                    time >= sevenDay.getTime()
                ) {
                    processedForecastData.push({ time: new Date(time).toISOString(), station, elevation });
                } else {
                    // console.warn('Skipping invalid or out-of-range forecast data point:', { rawTime, crossSectionRaw, elevationRaw, time, station, elevation });
                }
            });

            const groupedForecastData: { [key: string]: [number, number][] } = {};
            processedForecastData.forEach(item => {
                const timestamp = new Date(item.time).getTime();
                if (!isNaN(timestamp)) {
                    if (!groupedForecastData[item.station]) {
                        groupedForecastData[item.station] = [];
                    }
                    groupedForecastData[item.station].push([timestamp, item.elevation]);
                }
            });

            const seriesForChart: ApexChartSeriesData[] = Object.keys(groupedForecastData).map(stationName => ({
                name: stationName,
                data: groupedForecastData[stationName].sort((a, b) => a[0] - b[0])
            })).filter(series => series.data.length > 0);

            setForecastChartData(seriesForChart);
            // --- End Processing for WaterLevelForecastChart ---


            // --- Processing for WaterLevelChart, LongProfileChart, maxElevations, displayDate ---
            const parsedDataForWaterLevel: WaterLevelData[] = rawData.map((row) => {
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
            .filter(item => item.station && item.time && new Date(item.time) >= sevenAmToday)
            .filter(item => item.station && item.time);

            let parsedWaterDataForLongProfile = rawData.slice(1).map((row: any) => {
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
            .filter((item: any) => item.Date && new Date(item.Date) >= sevenAmToday);

            const stationMaxMap: Record<string, number> = {};
            const latestTime = parsedDataForWaterLevel.length > 0 ? new Date(Math.max(...parsedDataForWaterLevel.map((d) => new Date(d.time).getTime()))) : new Date();
            const sevenDaysAgo = new Date(latestTime);
            sevenDaysAgo.setDate(latestTime.getDate() - 6);

            Object.keys(stationMapping).forEach((station) => {
                const stationData = parsedDataForWaterLevel.filter(
                    (d) => d.station === station && new Date(d.time) >= sevenAmToday
                );
                const maxElevation = Math.max(...stationData.map((d) => d.elevation));
                if (!isNaN(maxElevation)) {
                    stationMaxMap[station] = maxElevation;
                }
            });

            const latestValid = parsedDataForWaterLevel[parsedDataForWaterLevel.length - 1]; 
            let calculatedDisplayDate = "";

            if (latestValid) {
                const latestDateFromCSV = new Date(latestValid.time);
                latestDateFromCSV.setDate(latestDateFromCSV.getDate() - 6); 

                calculatedDisplayDate = latestDateFromCSV.toLocaleDateString("th-TH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            } else {
                calculatedDisplayDate = "ไม่พบข้อมูล"; 
            }

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
            
            setDisplayDate(calculatedDisplayDate);
            setMaxElevations(stationMaxMap);
            setData(parsedDataForWaterLevel);
            setWaterData(parsedWaterDataForLongProfile);
            // --- End Processing for other charts ---
          },
          error: (err: any) => {
            console.error('PapaParse error for output_ras.csv:', err);
            setForecastChartData(null);
            setMaxElevations({});
            setData([]);
            setWaterData([]);
            setDisplayDate("เกิดข้อผิดพลาดในการโหลดข้อมูล");
            showForecastAlert(); // Show alert on parse error as well
          }
        });
      })
      .catch((error) => {
        console.error('Error fetching output_ras.csv:', error);
        setForecastChartData(null);
        setMaxElevations({});
        setData([]);
        setWaterData([]);
        setDisplayDate("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        showForecastAlert(); // Show alert on fetch error as well
      });
  }, []); // Empty dependency array means this runs once on component mount

  useEffect(() => {
    const csvFilePath = `${Path_File}ras-output/sta_flow.csv`;
    fetch(csvFilePath)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(), // Trim headers for consistency
          complete: (result) => {
            const rawData: RawStaFlowDataItem[] = result.data as RawStaFlowDataItem[];
            
            // Define the start time for the "future" 7 days
            const now = new Date();
            // Start from 7 days ago at 7 AM, extending into the future
            const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 7, 0, 0).getTime();
            
            const stationFlows: Record<string, number[]> = {
                'E.91': [], 'E.1': [], 'E.8A': [], 'WY': [],
                'E.66A': [], 'E.87': [], 'RE': [], 'BTH': []
            };

            rawData.forEach(row => {
                const timestamp = convertToTimestamp(row.DateTime);
                if (timestamp && timestamp >= startTime) {
                    // Collect all flow values for each station within the 7-day window
                    // Ensure the keys here match the CSV headers and your stationFlows object
                    if (row['E.91']) stationFlows['E.91'].push(parseFloat(row['E.91']));
                    if (row['E.1']) stationFlows['E.1'].push(parseFloat(row['E.1']));
                    if (row['E.8A']) stationFlows['E.8A'].push(parseFloat(row['E.8A']));
                    if (row['WY']) stationFlows['WY'].push(parseFloat(row['WY']));
                    if (row['E.66A']) stationFlows['E.66A'].push(parseFloat(row['E.66A']));
                    if (row['E.87']) stationFlows['E.87'].push(parseFloat(row['E.87']));
                    if (row['RE']) stationFlows['RE'].push(parseFloat(row['RE'])); // New station
                    if (row['BTH']) stationFlows['BTH'].push(parseFloat(row['BTH'])); // New station
                }
            });

            const calculatedMaxFlows: Record<string, number> = {};
            // Find the maximum flow for each station
            for (const station in stationFlows) {
                const flows = stationFlows[station];
                if (flows.length > 0) {
                    const max = Math.max(...flows.filter(f => !isNaN(f))); // Filter out NaNs before finding max
                    calculatedMaxFlows[station] = max;
                } else {
                    calculatedMaxFlows[station] = 0; // Or some default like null
                }
            }
            
            setMaxFlows(calculatedMaxFlows);
          },
          error: (err: any) => {
            console.error('PapaParse error for sta_flow.csv:', err);
            setMaxFlows({}); // Reset on error
          }
        });
      })
      .catch((error) => {
        console.error('Error fetching sta_flow.csv:', error);
        setMaxFlows({}); // Reset on error
      });
  }, []);

  useEffect(() => {
    // Only show components when all necessary data is loaded
    // Now include forecastChartData in the dependency array
    if (rainData && flowData && eleData && wyData && data.length > 0 && waterData.length > 0 && forecastChartData !== null) {
      const timers = [
        setTimeout(() => setShowForecast(true), 500),
        setTimeout(() => setShowProfile(true), 1000),
        setTimeout(() => setShowWaterLevel(true), 500),
        setTimeout(() => setShowGate(true), 2000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [rainData, flowData, eleData, wyData, data, waterData, forecastChartData]); // Add forecastChartData

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
        <WaterLevelForecastChart 
          chartData={forecastChartData} 
          stationMapping={stationWaterLevelForecastMap} 
        />
      </Box>


      <Box sx={{ ...BoxStyle }} id="flood-warning">
        <FloodWarningTable maxLevels={maxElevations} maxFlows={maxFlows} />
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
            <ImageComponent src={`${Path_File}images/map_flood.png`} alt="" title={"แผนที่น้ำท่วมพื้นที่วังยาง"} />
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