import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Box, CardContent, Typography, MenuItem, Select, FormControl, InputLabel, Grid } from "@mui/material";
import Papa from "papaparse";
import { ApexOptions } from "apexcharts";
const stationMapping = {
  "E.91": 184715,
  "E.1": 151870,
  "E.8A": 112911,
  "E.66A": 51452,
  "E.87": 3636,
};

const VelocLineChart: React.FC = () => {
  const [chartData, setChartData] = useState<{ name: string; data: { x: number; y: number }[] }[]>([]);
  const [, setCategories] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>(Object.keys(stationMapping)[0]); // ค่าเริ่มต้นเป็นสถานีแรก

  useEffect(() => {
    fetch("./ras-output/output_profile.csv") // เปลี่ยนเป็น path ที่ถูกต้อง
      .then((response) => response.text())
      .then((csvData) => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            processCSVData(result.data);
          },
        });
      });
  }, []);

  const convertToTimestamp = (dateTimeStr: string) => {
    if (!dateTimeStr) return null;
    const [day, month, yearAndTime] = dateTimeStr.split('/');
    const [year, time] = yearAndTime.split(' ');
    const formattedDateTime = new Date(`${year}-${month}-${day}T${time}`).getTime();
    return isNaN(formattedDateTime) ? null : formattedDateTime;
  };

  const processCSVData = (data: any[]) => {
    const filteredData: Record<string, { x: number; y: number }[]> = {};
    const timestamps: Set<string> = new Set();

    data.forEach((row) => {
      const crossSection = parseInt(row["Cross Section"], 10);
      let velocity = parseFloat(row["Velocities"]);
      const profile = row["Profile"];

      if (Object.values(stationMapping).includes(crossSection) && isFinite(velocity)) {
        velocity = parseFloat(velocity.toFixed(2)); // ปรับทศนิยมสองตำแหน่ง
        if (!filteredData[crossSection]) {
          filteredData[crossSection] = [];
        }

        // แปลงเวลาโดยใช้ฟังก์ชัน convertToTimestamp
        const timestamp = convertToTimestamp(profile);

        // ตรวจสอบว่าแปลงได้สำเร็จหรือไม่
        if (timestamp !== null) {
          filteredData[crossSection].push({ x: timestamp, y: velocity });
        }
      }
    });

    setCategories(Array.from(timestamps).sort()); // เก็บและเรียงเวลาในรูปแบบที่ถูกต้อง
    setChartData(
      Object.entries(stationMapping).map(([station, section]) => ({
        name: station,
        data: filteredData[section] || [],
      }))
    );
  };


  
  const lineChartOptions: ApexOptions = {
    chart: {
      type: "area" as "area",
      toolbar: { show: false },
      fontFamily: "Prompt",
      zoom: { enabled: true },
    },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false, format: "dd MMM", style: { fontSize: "1rem" } },
    },
    yaxis: {
      labels: { formatter: (val: any) => Number(val.toFixed(2)).toLocaleString(), style: { fontSize: "1rem" } },
      title: { text: "ความเร็วของน้ำ (m/s)", style: { fontSize: "1rem" } },
    },
    tooltip: {
      x: { format: "dd MMM yyyy HH:mm" },
      y: { formatter: (val: any) => `${Number(val.toFixed(2)).toLocaleString()} m/s` },
    },
    stroke: { curve: "smooth" , width: [2],},
    markers: { size: 0 },
    colors: ["#2196f3"],
    grid: { strokeDashArray: 4 },
    fill: {
      type: ["gradient"], // กำหนดให้เส้นแรกเป็นไล่สี
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        opacityFrom: 0.9,
        opacityTo: 0.2,
        stops: [0, 100],
        colorStops: [
          [
            { offset: 0, color: "#007bff", opacity: 1 }, // สีดำด้านบน
            { offset: 100, color: "#ADD8E6", opacity: 0.4 }, // สีเทาด้านล่าง
          ],
        ],
      },
    },
  };

  return (
      <CardContent>
          {/* ชื่อหัวข้อ */}
          <Grid item>
            <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: "Prompt", color: "#28378B" ,justifySelf:"center" }}>
              ความเร็วการไหลของน้ำรายชั่วโมง
            </Typography>
          </Grid>
  
          {/* Dropdown เลือกสถานี */}
          <Grid item xs sx={{justifySelf:"center" }}>
            <FormControl sx={{marginInline:"10px"}}>
              <InputLabel sx={{ fontFamily: "Prompt", fontSize: "1rem" }}>เลือกสถานี</InputLabel>
              <Select sx={{minWidth:"10vw"}} value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
                {Object.keys(stationMapping).map((station) => (
                  <MenuItem key={station} value={station}>
                    {station}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

        </Grid>
  
        <Box sx={{height:"46.7vh"}}>
          <ReactApexChart
            options={lineChartOptions}
            series={chartData.filter((item) => item.name === selectedStation)} // แสดงเฉพาะสถานีที่เลือก
            type="area"
            height="100%"
          />
        </Box>
      </CardContent>
  );
}

export default VelocLineChart;
