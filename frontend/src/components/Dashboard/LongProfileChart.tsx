import React, { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import ReactApexChart from "react-apexcharts";
import { Box, Button, CardContent, MenuItem, Select, Typography } from "@mui/material";
import { formatThaiDay } from "../../utility";
import { ArrowBack, ArrowForward, PlayArrow, Pause } from "@mui/icons-material";

interface waterData {
  CrossSection: number;
  Date: string | null;
  WaterLevel: number;
}
interface Props {
  waterData: waterData[];
}

const LongProfileChart: React.FC<Props> = ({ waterData }) => {
  const [data, setData] = useState<{ Ground: number; LOB: number; ROB: number; KM: number; WaterLevel?: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const intervalIdRef = useRef<number | null>(null);

  // Memoize unique dates (days)
  const uniqueDays = useMemo(() => {
    return [...new Set(waterData.map((d) => d.Date?.split(" ")[0]))].sort();
  }, [waterData]);

  // Memoize unique times for the selected date
  const uniqueTimes = useMemo(() => {
    return [...new Set(waterData.filter((d) => d.Date?.startsWith(selectedDate || "")).map((d) => d.Date?.split(" ")[1]))].sort();
  }, [waterData, selectedDate]);

  // Create a sorted array of all unique full date-time strings for playback
  const allDateTimes = useMemo(() => {
    // Filter out any null or undefined Dates and sort them
    return [...new Set(waterData.map(d => d.Date).filter((date): date is string => date !== null))].sort();
  }, [waterData]);

  

  useEffect(() => {
    // Load main CSV file
    fetch("./data/longProfile.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          complete: (result) => {
            const rawData: any[] = result.data;
            const parsedData = rawData.slice(1).map((row: any) => ({
              Ground: parseFloat(row[0]) || 0,
              LOB: parseFloat(row[1]) || 0,
              ROB: parseFloat(row[2]) || 0,
              KM: parseFloat(row[3]) || 0,
            }));
            setData(parsedData);
          },
          header: false,
          skipEmptyLines: true,
        });
      })
      .catch((error) => console.error("Error loading CSV:", error));
  }, []);

  useEffect(() => {
    if (waterData.length > 0 && !selectedDate && !selectedTime) {
      const firstDateTime = allDateTimes[0]; // Use the first full date-time from the sorted list
      if (firstDateTime) {
        const [datePart, timePart] = firstDateTime.split(" ");
        setSelectedDate(datePart);
        setSelectedTime(timePart);
      }
    }
  }, [waterData, allDateTimes, selectedDate, selectedTime]);


  useEffect(() => {
    if (!selectedDate || !selectedTime || waterData.length === 0 || data.length === 0) return;

    const fullSelectedDateTime = `${selectedDate} ${selectedTime}`;
    const filteredwaterData = [...waterData.filter((d) => d.Date === fullSelectedDateTime)].reverse();

    const maxKM = Math.max(...data.map((d) => d.KM));
    const minKM = Math.min(...data.map((d) => d.KM));
    const waterDataLength = filteredwaterData.length;

    setData((prevData) =>
      prevData.map((d) => {
        // Find the closest KM value in filteredwaterData
        let closestWaterLevel: number | null = null;
        let minDiff = Infinity;

        const normalized = (d.KM - minKM) / (maxKM - minKM);
        const waterIndex = Math.round((1 - normalized) * (waterDataLength - 1));
        closestWaterLevel = filteredwaterData[waterIndex]?.WaterLevel ?? null;
        
        return { ...d, WaterLevel: closestWaterLevel };
      })
    );
  }, [selectedDate, selectedTime, waterData, data.length]);

  // --- MODIFIED useEffect for auto-play functionality ---
  useEffect(() => {
    if (isPlaying) {
      intervalIdRef.current = window.setInterval(() => {
        const currentFullDateTime = selectedDate && selectedTime ? `${selectedDate} ${selectedTime}` : null;
        const currentFullDateTimeIndex = allDateTimes.indexOf(currentFullDateTime ?? "");

        if (currentFullDateTimeIndex < allDateTimes.length - 1) {
          const nextDateTime = allDateTimes[currentFullDateTimeIndex + 1];
          const [nextDatePart, nextTimePart] = nextDateTime.split(" ");
          setSelectedDate(nextDatePart);
          setSelectedTime(nextTimePart);
        } else {
          // Stop playing when the end is reached
          setIsPlaying(false);
          // Optional: reset to the first date/time after finishing
          // const firstDateTime = allDateTimes[0];
          // if (firstDateTime) {
          //   const [datePart, timePart] = firstDateTime.split(" ");
          //   setSelectedDate(datePart);
          //   setSelectedTime(timePart);
          // }
        }
      }, 500); // Change time every 2 seconds (adjust as needed)
    } else {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    }

    // Cleanup on unmount or when isPlaying changes
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [isPlaying, allDateTimes, selectedDate, selectedTime]); // Add selectedDate and selectedTime as dependencies

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const chartOptions = {
    chart: {
      type: "line" as "line",
      toolbar: { show: false },
      fontFamily: "Prompt",
      zoom: {
        enabled: true,
      },
    },
    xaxis: {
      type: "numeric" as "numeric",
      categories: data.map((d) => d.KM),
      labels: {},
      title: {
        text: "ระยะทาง (กม.)",
      },
    },
    yaxis: {
      labels: {
        formatter: function (val: any) {
          return Number(Number(val).toFixed(2)).toLocaleString();
        },
        style: {
          fontSize: "1rem",
        },
      },
      title: {
        text: "ระดับ (ม.ทรก.)",
        style: {
          fontSize: "1rem",
        },
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      y: {
        formatter: function (val: number) {
          return Number(val).toFixed(2).toLocaleString() + " ม.ทรก.";
        },
      },
      x: {
        formatter: function (val: number) {
          return `ระยะทาง: ${val.toFixed(2)} กม.`;
        },
      },
    },
    annotations: {
      xaxis: [
        {
          x: 140,
          x2: 200,
          borderColor: "#FF0000",
          fillColor: "#FF0000",
          opacity: 0.1,
          label: {
            style: {
              color: "#ffffff",
              background: "#FF0000",
              fontSize: "12px",
            },
          },
        },
        {
          x: 0,
          x2: 140,
          borderColor: "blue",
          fillColor: "blue",
          opacity: 0.1,
          label: {
            style: {
              color: "#ffffff",
              background: "#FF0000",
              fontSize: "12px",
            },
          },
        },
        {
          x: 125,
          borderColor: "#000",
          borderWidth: 0,
          label: {
            borderColor: "#66B2FF",
            position: "bottom",
            style: {
              fontSize: "1.15rem",
              color: "#fff",
              background: "#66B2FF",
            },
            text: "สถานีสนามเขื่อนวังยาง",
          },
        },
        {
          x: 200,
          borderColor: "#000",
          borderWidth: 0,
          label: {
            position: "bottom",
            style: {
              fontSize: "15px",
              color: "#fff",
              background: "#66B2FF",
            },
            text: "สถานีหลัก คบ.ชีกลาง / เขื่อนร้อยเอ็ด",
          },
        },
      ],
      yaxis: [
        {
          y: 0,
          y2: 200,
          borderColor: "#E5CCFF",
          fillColor: "#E5CCFF",
          opacity: 0,
        },
        {
          y: 0,
          y2: 140,
          borderColor: "red",
          fillColor: "red",
          opacity: 0.1,
        },
      ],
      points: [
        {
          x: 170,
          y: 155,
          marker: {
            size: 0,
          },
          label: {
            show: true,
            style: {
              fontSize: "1rem",
              fontWeight: "bold",
              color: "#000",
            },
            text: "จ.ร้อยเอ็ด",
          },
        },
        {
          x: 70,
          y: 155,
          marker: {
            size: 0,
          },
          label: {
            show: true,
            style: {
              fontSize: "1rem",
              fontWeight: "bold",
              color: "#000",
            },
            text: "จ.มหาสารคาม",
          },
        },
        {
          x: 0,
          y: 138,
          marker: {
            size: 4,
            fillColor: "red",
            strokeColor: "red",
            radius: 2,
            cssClass: "apexcharts-custom-class",
          },
          label: {
            show: true,
            offsetY: 35,
            offsetX: 25,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "E.91",
          },
        },
        {
          x: 39,
          y: 135,
          marker: {
            size: 4,
            fillColor: "red",
            strokeColor: "red",
            radius: 2,
            cssClass: "apexcharts-custom-class",
          },
          label: {
            show: true,
            offsetY: 40,
            offsetX: 0,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "E.1",
          },
        },
        {
          x: 72,
          y: 132,
          marker: {
            size: 4,
            fillColor: "red",
            strokeColor: "red",
            radius: 2,
            cssClass: "apexcharts-custom-class",
          },
          label: {
            show: true,
            offsetY: 40,
            offsetX: 10,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "E.8A",
          },
        },
        {
          x: 119,
          y: 128,
          marker: {
            size: 4,
            fillColor: "red",
            strokeColor: "red",
            radius: 2,
            cssClass: "apexcharts-custom-class",
          },
          label: {
            show: true,
            offsetY: 45,
            offsetX: -30,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "สถานีสนามบ้านท่าแห",
          },
        },
        {
          x: 146,
          y: 128,
          marker: {
            size: 4,
            fillColor: "red",
            strokeColor: "red",
            radius: 2,
            cssClass: "apexcharts-custom-class",
          },
          label: {
            show: true,
            offsetY: 45,
            offsetX: 0,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "สถานีสนาม E.66A",
          },
        },
        {
          x: 184,
          y: 124.5,
          marker: {
            size: 4,
            fillColor: "red",
            strokeColor: "red",
            radius: 2,
            cssClass: "apexcharts-custom-class",
          },
          label: {
            show: true,
            offsetY: 40,
            offsetX: -70,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "จุดบรรจบคลองปาว",
          },
        },
        {
          x: 20,
          y: 120,
          marker: { size: 0 },
          label: {
            show: true,
            style: {
              color: "#skyblue",
              fontSize: "1rem",
              fontWeight: "bold",
            },
            text: "→→→ ทิศทางน้ำไหล →→→",
            offsetY: -20,
            offsetX: 10,
          },
        },
      ],
    },
    stroke: {
      width: [2, 0, 5, 5],
      curve: "monotoneCubic" as "monotoneCubic",
      dashArray: [0, 0, 8, 8],
    },
    colors: ["#007bff", "#744111", "red", "green"],
    fill: {
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        opacityFrom: 0.9,
        opacityTo: 0.2,
        stops: [0, 100],
        colorStops: [
          [{ offset: 0, color: "#007bff", opacity: 1 }, { offset: 100, color: "#007bff", opacity: 0.5 }],
          [{ offset: 0, color: "##744111", opacity: 1 }, { offset: 100, color: "##744111", opacity: 0.2 }],
        ],
      },
    },
  };

  const chartSeries = useMemo(() => {
    return [
      { name: "Water Level (ระดับผิวน้ำ)", type: "area", data: data.map((d) => d.WaterLevel ?? null) },
      { name: "Ground (ท้องคลอง)", type: "area", data: data.map((d) => d.Ground) },
      { name: "LOB (ตลิ่งซ้าย)", data: data.map((d) => d.LOB) },
      { name: "ROB (ตลิ่งขวา)", data: data.map((d) => d.ROB) },
    ];
  }, [data]);

  return (
    <CardContent>
      <Typography variant="h6" gutterBottom sx={{ fontFamily: "Prompt", fontWeight: "bold", color: "#28378B" }}>
        รูปตัดตามยาวแม่น้ำพื้นที่ศึกษาโครงการวังยาง (เขื่อนมหาสารคาม - เขื่อนร้อยเอ็ด)
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        {/* Buttons and Selects remain largely the same, but their `disabled` state should depend on `isPlaying` */}
        <Button
          variant="contained"
          onClick={() => {
            const currentFullDateTime = selectedDate && selectedTime ? `${selectedDate} ${selectedTime}` : null;
            const currentFullDateTimeIndex = allDateTimes.indexOf(currentFullDateTime ?? "");
            if (currentFullDateTimeIndex > 0) {
              const prevDateTime = allDateTimes[currentFullDateTimeIndex - 1];
              const [prevDatePart, prevTimePart] = prevDateTime.split(" ");
              setSelectedDate(prevDatePart);
              setSelectedTime(prevTimePart);
            }
            setIsPlaying(false);
          }}
          disabled={allDateTimes.indexOf(`${selectedDate} ${selectedTime}`) <= 0 || isPlaying}
          sx={{
            fontFamily: "Prompt",
            fontSize: { xs: "0.8rem", sm: "1rem" },
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#115293" },
            borderRadius: "20px",
            paddingX: "16px",
            width: { xs: "100%", sm: "auto" },
            mb: { xs: 2, sm: 0 },
          }}
        >
          <ArrowBack sx={{ fontSize: "1.5rem" }} />
          ย้อนกลับ
        </Button>

        <Select
          value={selectedDate || ""}
          onChange={(e) => {
            setSelectedDate(e.target.value as string);
            // setSelectedTime(null); // Clear time when date changes, let user re-select or default to first
            setIsPlaying(false);
          }}
          sx={{
            fontFamily: "Prompt",
            width: { xs: "40%", sm: "auto" },
          }}
          disabled={isPlaying}
        >
          {uniqueDays.map((day) => (
            <MenuItem key={day} value={day}>
              {formatThaiDay(day || "")}
            </MenuItem>
          ))}
        </Select>

        <Select
          value={selectedTime || ""}
          onChange={(e) => {
            setSelectedTime(e.target.value as string);
            setIsPlaying(false);
          }}
          disabled={!selectedDate || isPlaying}
          sx={{
            fontFamily: "Prompt",
            width: { xs: "40%", sm: "auto" },
          }}
        >
          {uniqueTimes.map((time) => (
            <MenuItem key={time} value={time}>
              {time}
            </MenuItem>
          ))}
        </Select>

        <Button
          variant="contained"
          onClick={handlePlayPause}
          sx={{
            fontFamily: "Prompt",
            fontSize: { xs: "0.8rem", sm: "1rem" },
            bgcolor: isPlaying ? "#d32f2f" : "#2e7d32",
            "&:hover": { bgcolor: isPlaying ? "#b71c1c" : "#1b5e20" },
            borderRadius: "20px",
            paddingX: "16px",
            width: { xs: "100%", sm: "auto" },
            mb: { xs: 2, sm: 0 },
          }}
        >
          {isPlaying ? <Pause sx={{ fontSize: "1.5rem" }} /> : <PlayArrow sx={{ fontSize: "1.5rem" }} />}
          {isPlaying ? "หยุด" : "เล่น"}
        </Button>

        <Button
          variant="contained"
          onClick={() => {
            const currentFullDateTime = selectedDate && selectedTime ? `${selectedDate} ${selectedTime}` : null;
            const currentFullDateTimeIndex = allDateTimes.indexOf(currentFullDateTime ?? "");
            if (currentFullDateTimeIndex < allDateTimes.length - 1) {
              const nextDateTime = allDateTimes[currentFullDateTimeIndex + 1];
              const [nextDatePart, nextTimePart] = nextDateTime.split(" ");
              setSelectedDate(nextDatePart);
              setSelectedTime(nextTimePart);
            }
            setIsPlaying(false);
          }}
          disabled={allDateTimes.indexOf(`${selectedDate} ${selectedTime}`) >= allDateTimes.length - 1 || isPlaying}
          sx={{
            fontFamily: "Prompt",
            fontSize: { xs: "0.8rem", sm: "1rem" },
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#115293" },
            borderRadius: "20px",
            paddingX: "16px",
            width: { xs: "100%", sm: "auto" },
            mb: { xs: 2, sm: 0 },
          }}
        >
          ถัดไป
          <ArrowForward sx={{ fontSize: "1.5rem" }} />
        </Button>
      </Box>

      <Box>
        <ReactApexChart options={chartOptions} series={chartSeries} type="line" height={600} />
      </Box>
    </CardContent>
  );
};

export default LongProfileChart;