import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Select, MenuItem, CardContent, Typography, Box, Button } from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import Chart from "react-apexcharts";

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
    fetch("./ras-output/ground_station.csv")
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

  // ข้อมูลที่กรองจากไฟล์ที่สองตามสถานีที่เลือก
  const filteredSecondData = secondData.filter((item) => item.station === selectedStation);

  // กำหนด options สำหรับกราฟ
  const chartOptions = {
    chart: {
      type: "line", // เปลี่ยนเป็น Line เพื่อแสดงกราฟที่แสดงข้อมูลทั้งหมด
      height: 350,
    },
    annotations: {
      yaxis: [
        {
          y: selectedData.elevation, // ค่า elevation ที่เลือก
          borderColor: "#FF0000", // สีของเส้นแสดงตำแหน่ง
          label: {
            text: `Elevation: ${selectedData.elevation.toFixed(2)} m`,
            style: {
              color: "#FF0000",
              background: "#fff",
            },
          },
        },
      ],
    },
    xaxis: {
      categories: filteredSecondData.map((item) => item.time), // ใช้ time เป็นค่าแกน X
    },
    yaxis: {
      title: { text: "ระดับน้ำ (ม.มรก.)" },
      min: Math.min(...filteredSecondData.map((item) => item.elevation)) - 0.5,
      max: Math.max(...filteredSecondData.map((item) => item.elevation)) + 0.5,
    },
  };

  // กำหนด series สำหรับกราฟ
  const chartSeries = [
    {
      name: selectedStation, // ใช้ชื่อสถานีที่เลือก
      data: stationData.map((item) => item.elevation), // ข้อมูลระดับน้ำของสถานีที่เลือกจากไฟล์แรก
      type: "line", // แสดงเป็นเส้น
    },
    {
      name: selectedStation, // ใช้ชื่อสถานีที่เลือก
      data: filteredSecondData.map((item) => item.elevation), // ข้อมูลระดับน้ำจากไฟล์ที่สองตามสถานีที่เลือก
      type: "line", // แสดงเป็นเส้น
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
      <Typography variant="h6" sx={{ textAlign: "center", mb: 2, fontWeight: "bold" }}>
        ระดับน้ำรายชั่วโมง สถานี {selectedStation}
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={handlePrevTime} disabled={selectedIndex === 0}>
          <ArrowBack /> ย้อนกลับ
        </Button>

        <Select value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
          {Object.keys(stationMapping).map((station) => (
            <MenuItem key={station} value={station}>{station}</MenuItem>
          ))}
        </Select>

        <Select value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))}>
          {stationData.map((item, index) => (
            <MenuItem key={item.time} value={index}>{item.time}</MenuItem>
          ))}
        </Select>

        <Button variant="contained" onClick={handleNextTime} disabled={selectedIndex >= stationData.length - 1}>
          ถัดไป <ArrowForward />
        </Button>
      </Box>

      <Box sx={{ width: "100%", height: 350 }}>
        <Chart options={chartOptions} series={chartSeries} type="line" height={350} />
      </Box>

      <Typography variant="h6" textAlign="center" sx={{ mt: 2 }}>
        ระดับน้ำปัจจุบัน: {selectedData.elevation.toFixed(2)} ม.มรก.
      </Typography>
    </CardContent>
  );
};

export default WaterLevelChart;
