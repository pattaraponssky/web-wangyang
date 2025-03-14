import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Box, CardContent, Typography, Grid } from "@mui/material";
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

  useEffect(() => {
    fetch("./ras-output/output_profile.csv")
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
    const [day, month, yearAndTime] = dateTimeStr.split("/");
    const [year, time] = yearAndTime.split(" ");
    const formattedDateTime = new Date(`${year}-${month}-${day}T${time}`).getTime();
    return isNaN(formattedDateTime) ? null : formattedDateTime;
  };

  const processCSVData = (data: any[]) => {
    const filteredData: Record<string, { x: number; y: number }[]> = {};

    data.forEach((row) => {
      const crossSection = parseInt(row["Cross Section"], 10);
      let velocity = parseFloat(row["Velocities"]);
      const profile = row["Profile"];

      if (Object.values(stationMapping).includes(crossSection) && isFinite(velocity)) {
        velocity = parseFloat(velocity.toFixed(2));
        if (!filteredData[crossSection]) {
          filteredData[crossSection] = [];
        }

        const timestamp = convertToTimestamp(profile);
        if (timestamp !== null) {
          filteredData[crossSection].push({ x: timestamp, y: velocity });
        }
      }
    });

    setChartData(
      Object.entries(stationMapping).map(([station, section]) => ({
        name: station,
        data: filteredData[section] || [],
      }))
    );
  };

  const lineChartOptions: ApexOptions = {
    chart: {
      type: "line",
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
    stroke: { curve: "smooth", width: [5,5,5,5,5] },
    markers: { size: 0 },
    colors: ["#2196f3", "#ff5722", "#4caf50", "#ff9800", "#9c27b0"], // ใช้หลายสีให้แต่ละสถานี
    grid: { strokeDashArray: 4 },

  };

  return (
    <CardContent>
      <Grid item>
        <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: "Prompt", color: "#28378B", justifySelf: "center" }}>
          ความเร็วการไหลของน้ำ รายชั่วโมง
        </Typography>
      </Grid>

      <Box sx={{ height: "52.5vh" }}>
        <ReactApexChart options={lineChartOptions} series={chartData} type="line" height="100%" />
      </Box>
    </CardContent>
  );
};

export default VelocLineChart;
