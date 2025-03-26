import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Select, MenuItem, CardContent, Typography, Box, Button } from "@mui/material";
import { ArrowBack, ArrowForward, Label } from "@mui/icons-material";
import Chart from "react-apexcharts";
import { formatThaiDate } from "../../utility";

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
  const [secondData, setSecondData] = useState<WaterLevelData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedStation, setSelectedStation] = useState<string>("E.91");

  const lastDataPoints = 35;

  const fillData = (data: WaterLevelData[]) => {
    if (data.length >= lastDataPoints) return data.slice(-lastDataPoints);
    const missingCount = lastDataPoints - data.length;
    return [...data, ...Array(missingCount).fill(data[data.length - 1] || { time: "", elevation: 0 })];
  };

  useEffect(() => {
    // โหลดข้อมูลจากไฟล์ CSV แรก
    fetch("./ras-output/output_profile.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          complete: (result) => {
            const rawData: any[] = result.data;

            if (!rawData.length) {
              console.error("Empty CSV data");
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

    // โหลดข้อมูลจากไฟล์ CSV ที่สอง
    fetch("./data/ground_station.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          complete: (result) => {
            const rawData: any[] = result.data;

            if (!rawData.length) {
              console.error("Empty CSV data");
              return;
            }

            const parsedData: WaterLevelData[] = rawData.map((row) => {
              const time = row["NO"]?.trim();
              const e91 = parseFloat(row["E.91"]);
              const e1 = parseFloat(row["E.1"]);
              const e8A = parseFloat(row["E.8A"]);
              const e66A = parseFloat(row["E.66A"]);
              const e87 = parseFloat(row["E.87"]);

              return [
                { time, station: "E.91", elevation: e91 },
                { time, station: "E.1", elevation: e1 },
                { time, station: "E.8A", elevation: e8A },
                { time, station: "E.66A", elevation: e66A },
                { time, station: "E.87", elevation: e87 },
              ];
            }).flat();

            setSecondData(parsedData); // ตั้งค่า secondData
          },
          header: true,
          skipEmptyLines: true,
        });
      })
      .catch((error) => console.error("Error loading second CSV:", error));
  }, []);

  // ข้อมูลที่กรองตามสถานีจากไฟล์แรก
  const stationData = data.filter((item) => item.station === selectedStation);
  const selectedData = stationData[selectedIndex] || { time: "", elevation: 0 };
  const filledStationData = fillData(stationData);
  // ข้อมูลที่กรองจากไฟล์ที่สองตามสถานีที่เลือก
  const filteredSecondData = secondData.filter((item) => item.station === selectedStation);

  // กำหนด options สำหรับกราฟ
  const chartOptions = {
    chart: {

      type: "line" as const, // เปลี่ยนเป็น area เพื่อแสดงกราฟที่แสดงข้อมูลทั้งหมด
      height: 450,
      fontFamily: 'Prompt',
      zoom: {
        enabled: true, // ปิดการซูม
      },
    },
    annotations: {
      yaxis: [
        {
          y: selectedData.elevation, // ค่า elevation ที่เลือก
          borderColor: "#000", // สีของเส้นแสดงตำแหน่ง
          label: {
            text: `ระดับน้ำ: ${selectedData.elevation.toFixed(2)} (ม.รทก.)`,
            style: {
              fontSize: '1rem',
              fontWeight: 'bold', // ทำให้ตัวหนา
              color: '#000',
            },
          },
        },
      ],
    },
    xaxis: {
      categories: filteredSecondData.slice(-lastDataPoints).map((item) => item.time),
      labels: {
        show: false // ไม่แสดงข้อความบนแกน X
      }
    },
    yaxis: {
      labels: {
        formatter: function (val: any) {
          return Number(Number(val).toFixed(2)).toLocaleString();
        },
        style: {
          fontSize: '1.6vh',
        },
      },
      title: {
        text: 'ระดับ (ม.ทรก.)',
        style: {
          fontSize: '1.6vh',
        },
      },
      min: Math.min(...filteredSecondData.map((item) => item.elevation)) - 0.5,
      max: Math.max(...filteredSecondData.map((item) => item.elevation)) + 0.5,
    },
    stroke: {
      width: [1, 1],
      curve: "straight" as "straight",
      dashArray: [0, 0, 8, 8],
    },
    colors: ["#007bff","#000000", "red", "green" ],
    fill: {
      
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
        colorStops: [
          [
            { offset: 0, color: "#007bff", opacity: 1 }, // สีดำด้านบน
            { offset: 100, color: "#007bff", opacity: 0.5 }, // สีเทาด้านล่าง
          ],
          [
            { offset: 0, color: "#000000", opacity: 1 }, // สีดำด้านบน
            { offset: 100, color: "#333333", opacity: 1 }, // สีเทาด้านล่าง
          ],
        ],
      },
    },
  };
  // กำหนด series สำหรับกราฟ
  const chartSeries = [
    {
      name: 'ระดับน้ำ (ม.รทก.)', // ใช้ชื่อสถานีที่เลือก
      data: filledStationData.map((item) => item.elevation),
      type: "area", // แสดงเป็นเส้น
    },
    {
      name: 'Ground (พื้นดิน)', // ใช้ชื่อสถานีที่เลือก
      data: filteredSecondData.map((item) => item.elevation), // ข้อมูลระดับน้ำจากไฟล์ที่สองตามสถานีที่เลือก
      type: "area", // แสดงเป็นเส้น
    },
  ];

  const handlePrevTime = () => {
    if (selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  };

  const handleNextTime = () => {
    if (selectedIndex < stationData.length - 1) setSelectedIndex(selectedIndex + 1);
  };

  return (
    <CardContent>
      <Typography variant="h6" gutterBottom sx={{ fontFamily: "Prompt", fontWeight: "bold", color:"#28378B", justifySelf: "center" }}>
        ระดับน้ำรายชั่วโมง สถานี {selectedStation}
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
        <Button     sx={{
              fontFamily: "Prompt",
              fontSize: { xs: "0.8rem", sm: "1rem" },
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#115293" },
              borderRadius: "20px",
              paddingX: "16px",
            }} variant="contained" onClick={handlePrevTime} disabled={selectedIndex === 0}>
          <ArrowBack /> ย้อนกลับ
        </Button>
        

        <Select sx={{fontFamily:"Prompt"}} value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
          {Object.keys(stationMapping).map((station) => (
            <MenuItem key={station} value={station}>{station}</MenuItem>
          ))}
        </Select>

        <Select sx={{fontFamily:"Prompt"}} value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))}>
          {stationData.map((item, index) => (
            <MenuItem key={formatThaiDate(item.time)} value={index}>{formatThaiDate(item.time)}</MenuItem>
          ))}
        </Select>

        <Button  sx={{
              fontFamily: "Prompt",
              fontSize: { xs: "0.8rem", sm: "1rem" },
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#115293" },
              borderRadius: "20px",
              paddingX: "16px",
            }}
        variant="contained" onClick={handleNextTime} disabled={selectedIndex >= stationData.length - 1}>
          ถัดไป <ArrowForward />
        </Button>
      </Box>

      <Box sx={{ width: "100%", height: 450 }}>
        <Chart options={chartOptions} series={chartSeries} type="line" height={450} />
      </Box>

      <Typography variant="h6" textAlign="center" sx={{ mt: 2 ,fontFamily:"Prompt" ,color:"blue",fontWeight:"bold"}}>
        ระดับน้ำปัจจุบัน: {selectedData.elevation.toFixed(2)} ม.มรก.
      </Typography>
    </CardContent>
  );
};

export default WaterLevelChart;
