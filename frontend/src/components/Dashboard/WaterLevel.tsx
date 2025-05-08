import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Select, MenuItem, CardContent, Typography, Box, Button } from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import Chart from "react-apexcharts";
import { formatThaiDay } from "../../utility";

interface WaterLevelData {
  time: string;
  station: string;
  elevation: number;
}

const warningLevels: Record<string, { watch: number; alert: number; crisis: number }> = {
  "E.91": { watch: 149.30, alert: 150.80, crisis: 152.20 },
  "E.1": { watch: 146.10, alert: 147.30, crisis: 148.70 },
  "E.8A": { watch: 145.40, alert: 147.00, crisis: 148.00 },
  "WY": { watch: 137.40, alert: 138.00, crisis: 139.00 },
  "E.66A": { watch: 138.60, alert: 140.00, crisis: 141.50 },
  "E.87": { watch: 137.80, alert: 138.90, crisis: 139.90 },
};


const stationMapping: Record<string, number> = {
  "E.91": 184715,
  "E.1": 151870,
  "E.8A": 112911,
  "WY": 62093,
  "E.66A": 51452,
  "E.87": 3636,
};

interface Props {
  data: WaterLevelData[];
}

const WaterLevelChart: React.FC<Props> = ({data}) => {
  const [secondData, setSecondData] = useState<WaterLevelData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedStation, setSelectedStation] = useState<string>("E.91");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const Levels = warningLevels[selectedStation];

  useEffect(() => {
    fetch("./data/ground_station.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const rawData: any[] = result.data;
            if (!rawData.length) return;
            const parsedData: WaterLevelData[] = rawData.flatMap((row) => [
              { station: "E.91", elevation: parseFloat(row["E.91"]), time: row["NO"]?.trim() },
              { station: "E.1", elevation: parseFloat(row["E.1"]), time: row["NO"]?.trim() },
              { station: "E.8A", elevation: parseFloat(row["E.8A"]), time: row["NO"]?.trim() },
              { station: "WY", elevation: parseFloat(row["WY"]), time: row["NO"]?.trim() },
              { station: "E.66A", elevation: parseFloat(row["E.66A"]), time: row["NO"]?.trim() },
              { station: "E.87", elevation: parseFloat(row["E.87"]), time: row["NO"]?.trim() },
            ]);
            setSecondData(parsedData);
          },
        });
      });
  }, []);

  
  const stationData = data.filter((item) => item.station === selectedStation);
  const selectedData = data.find((item) => item.station === selectedStation && item.time === selectedTime)
  || { time: "", elevation: 0, station: selectedStation };


  const filteredSecondData = secondData.filter((item) => item.station === selectedStation);
  const categories = filteredSecondData.map(item => item.time || "");
  // ดึงข้อมูลเฉพาะของสถานีที่เลือก

  // จัดกลุ่มข้อมูลตามวันที่ (YYYY-MM-DD)
  const groupedByDate: Record<string, WaterLevelData[]> = stationData.reduce((acc, item) => {
    const date = item.time.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, WaterLevelData[]>);

  const availableDates = Object.keys(groupedByDate);

  useEffect(() => {
    if (availableDates.length) {
      // ถ้า selectedDate ปัจจุบันยังคงอยู่ใน availableDates
      const validDate = availableDates.includes(selectedDate) ? selectedDate : availableDates[0];
      setSelectedDate(validDate);
  
      // หาเวลาทั้งหมดในวันที่นั้น
      const timesInDate = groupedByDate[validDate]?.map((item) => item.time) || [];
  
      // ถ้า selectedTime ปัจจุบันยังคงอยู่ใน timesInDate
      const validTime = timesInDate.includes(selectedTime) ? selectedTime : timesInDate[0];
      setSelectedTime(validTime);
    } else {
      setSelectedDate("");
      setSelectedTime("");
    }
  }, [availableDates, selectedStation]); // 👈 ยังใช้ dependency เดิม
  
  
  const chartOptions = {
    chart: {
      type: "line" as const,
      height: 450,
      fontFamily: 'Prompt',
      zoom: { enabled: true },
    },
    annotations: {
      yaxis: [
        {
          y: Levels.alert,
          borderWidth: 0,
          label: {
            position: 'right',
            offsetX: -10,
            offsetY: -10,
            text: `ตลิ่งขวา`,
            style: { fontSize: '0.8rem', fontWeight: 'bold' },
          },
        },
        {
          y: Levels.alert,
          borderWidth: 0,
          label: {
            position: 'left',
            offsetX: 55,
            offsetY: -10,
            text: `ตลิ่งซ้าย`,
            style: { fontSize: '0.8rem', fontWeight: 'bold' },
          },
        },
        {
          y: selectedData.elevation,
          borderColor: "#007bff",
          borderWidth: 0,
          label: {
            position: 'center',
            offsetY: -10,
            text: `ระดับน้ำ: ${selectedData.elevation.toFixed(2)} (ม.รทก.)`,
            style: { fontSize: '1rem', fontWeight: 'bold' },
          },
        },
        {
          y: Levels.watch,
          borderWidth: 2,
          strokeDashArray: 0,
          borderColor: "green",
          label: {
            position: 'center',
            offsetY: -5,
            text: `เฝ้าระวัง: ${Levels.watch.toFixed(2)} ม.รทก.`,
            style: {
              color: "#fff",
              background: "green",
              fontWeight: "bold",
              fontSize: '0.8rem'
            },
          },
        },
        {
          y: Levels.alert,
          borderWidth: 2,
          strokeDashArray: 0,
          borderColor: "#FFD700",
          label: {
            position: 'center',
            offsetY: -5,
            text: `เตือนภัย: ${Levels.alert.toFixed(2)} ม.รทก.`,
            style: {
              color: "#000",
              background: "#FFD700",
              fontWeight: "bold",
              fontSize: '0.8rem'
            },
          },
        },
        {
          y: Levels.crisis,
          borderWidth: 2,
          strokeDashArray: 0,
          borderColor: "#FF0000",
          label: {
            position: 'center',
            offsetY: -5,
            text: `วิกฤต: ${Levels.crisis.toFixed(2)} ม.รทก.`,
            style: {
              color: "#fff",
              background: "#FF0000",
              fontWeight: "bold",
              fontSize: '0.8rem'
            },
          },
        },
      ],
    },    
    xaxis: {
      categories: categories,
      labels: { show: false }
    },
    tooltip: {
      y: {
        formatter: (value: any) => value.toFixed(2), // แสดงค่าทศนิยม 2 ตำแหน่ง
      },
    },
    yaxis: {
      labels: {
        formatter: (val: any) => Number(val).toFixed(0),
        style: { fontSize: '1rem' },
      },
      title: {
        text: 'ระดับ (ม.รทก.)',
        style: { fontSize: '1rem' },
      },
      min: Math.min(...filteredSecondData.map((item) => item.elevation)) - 0.5,
      max: Math.max(...filteredSecondData.map((item) => item.elevation)) + 0.5,
    },
    stroke: {
      width: [1, 3],
      curve: "monotoneCubic" as const,
      dashArray: [0, 0, 8, 8],
    },
    colors: [ "#007bff","#744111"],
    fill: {
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [10, 90],
        inverseColors: false,
        blendMode: "multiply",
      },
    },
  };

  const chartSeries = [
    {
      name: 'ระดับน้ำ (ม.รทก.)',
      data: Array(35).fill(selectedData.elevation),
      type: "area",
    },
    {
      name: 'Ground (พื้นดิน)',
      data: filteredSecondData.map((item) => item.elevation),
      type: "area",
    },
  ];

  return (
    <CardContent>
    <Typography variant="h6" gutterBottom sx={{ fontFamily: "Prompt", fontWeight: "bold", color: "#28378B" }}>
      ระดับน้ำรายชั่วโมง สถานี{" "}
      <Box component="span" sx={{ color: "red" }}>
        {selectedStation}
      </Box>
    </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <Button
          sx={{
            fontFamily: "Prompt",
            fontSize: { xs: "0.8rem", sm: "1rem" },  // ปรับขนาดฟอนต์ตามขนาดหน้าจอ
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#115293" },
            borderRadius: "20px",
            paddingX: "16px",
            width: { xs: "100%", sm: "auto" }, // ปรับขนาดปุ่มให้เต็มหน้าจอในขนาดเล็ก
            mb: { xs: 2, sm: 0 }, // เพิ่ม margin-bottom ในขนาดเล็ก
          }}
          variant="contained"
          onClick={() => setSelectedIndex((prev) => Math.max(prev - 1, 0))}
          disabled={selectedIndex === 0}
        >
          <ArrowBack /> ย้อนกลับ
        </Button>
        
        <Select
          sx={{
            fontFamily: "Prompt",
            width: { xs: "100%", sm: "auto" },  // ปรับให้ Select ขยายเต็มหน้าจอในขนาดเล็ก
            marginBottom: { xs: 2, sm: 0 },  // เพิ่ม margin ในขนาดเล็ก
          }}
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
        >
          {Object.keys(stationMapping).map((station) => (
            <MenuItem key={station} value={station}>{station}</MenuItem>
          ))}
        </Select>
        
        {/* เลือกวันที่ */}
          <Select
              sx={{
                fontFamily: "Prompt",
                width: { xs: "40%", sm: "auto" }, // ขยาย Select ให้เต็มหน้าจอในขนาดเล็ก
              }}
            
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime(""); // reset เวลาเมื่อเปลี่ยนวัน
            }}
          >
            {availableDates.map((date) => (
              <MenuItem key={date} value={date}>
                {formatThaiDay(date)}
              </MenuItem>
            ))}
          </Select>

          {/* เลือกเวลาในวันที่ที่เลือก */}
          {selectedDate && (
            <Select
            sx={{
              fontFamily: "Prompt",
              width: { xs: "40%", sm: "auto" }, // ขยาย Select ให้เต็มหน้าจอในขนาดเล็ก
            }}
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              {groupedByDate[selectedDate]?.map((item) => {
                const timeOnly = item.time.split("T")[1];
                return (
                  <MenuItem key={item.time} value={item.time}>
                    {timeOnly}
                  </MenuItem>
                );
              })}
            </Select>
          )}

        
        <Button
          sx={{
            fontFamily: "Prompt",
            fontSize: { xs: "0.8rem", sm: "1rem" }, // ปรับขนาดฟอนต์ตามขนาดหน้าจอ
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#115293" },
            borderRadius: "20px",
            paddingX: "16px",
            width: { xs: "100%", sm: "auto" }, // ปรับขนาดปุ่มให้เต็มหน้าจอในขนาดเล็ก
            mb: { xs: 2, sm: 0 }, // เพิ่ม margin-bottom ในขนาดเล็ก
          }}
          variant="contained"
          onClick={() => setSelectedIndex((prev) => Math.min(prev + 1, stationData.length - 1))}
          disabled={selectedIndex >= stationData.length - 1}
        >
          ถัดไป <ArrowForward />
        </Button>
      </Box>

      <Box sx={{ width: "100%", height: 450 }}>
        <Chart options={chartOptions} series={chartSeries} type="line" height={450} />
      </Box>
      <Typography variant="h6" textAlign="center" sx={{ mt: 2, fontFamily: "Prompt", color: "blue", fontWeight: "bold" }}>
        ระดับน้ำปัจจุบัน: {selectedData.elevation.toFixed(2)} ม.รทก.
      </Typography>
    </CardContent>
  );
};

export default WaterLevelChart;