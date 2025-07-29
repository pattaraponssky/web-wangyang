import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { Select, MenuItem, CardContent, Typography, Box, Button } from "@mui/material";
import { ArrowBack, ArrowForward, PlayArrow, Pause } from "@mui/icons-material";
import Chart from "react-apexcharts";
import { formatThaiDay, Path_File } from "../../utility";

interface WaterLevelData {
  time: string;
  station: string;
  elevation: number;
}

const warningLevels: Record<string, { watch: number; alert: number; crisis: number }> = {
  "E.91": { watch: 149.30, alert: 150.80, crisis: 152.20 },
  "E.8A": { watch: 145.40, alert: 147.00, crisis: 148.00 },
  "BTH": { watch: 135.60, alert: 136.30, crisis: 137.10 },
  "WY": { watch: 137.40, alert: 138.00, crisis: 139.00 },
  "E.66A": { watch: 138.60, alert: 140.00, crisis: 141.50 },
  "E.87": { watch: 137.80, alert: 138.90, crisis: 139.90 },
  "RE": { watch: 133.80, alert: 135.10, crisis: 136.30 },
};


const stationMapping: Record<string, number> = {
  "E.91": 184715,
  "BTH": 79205,
  "E.8A": 112911,
  "WY": 62093,
  "E.66A": 51452,
  "E.87": 3636,
  "RE": 1158,
};

interface Props {
  data: WaterLevelData[];
}


const locationMapping = (key: string): string => {
  const map: { [key: string]: string } = {
    "BTH": "บ้านท่าแห (เหนือน้ำ)",
    "WY": "เขื่อนวังยาง",
    "RE": "เขื่อนร้อยเอ็ด",
    "E.66A": "E.66A (ท้ายน้ำ)"
  };
  return map[key] || key; // If key not found in map, return original key
};

const WaterLevelChart: React.FC<Props> = ({data}) => {
  const [secondData, setSecondData] = useState<WaterLevelData[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("E.91");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const intervalIdRef = useRef<number | null>(null);
  const Levels = warningLevels[selectedStation];

  useEffect(() => {
    fetch(`${Path_File}data/ground_station.csv`)
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
              { station: "BTH", elevation: parseFloat(row["BTH"]), time: row["NO"]?.trim() },
              { station: "E.8A", elevation: parseFloat(row["E.8A"]), time: row["NO"]?.trim() },
              { station: "WY", elevation: parseFloat(row["WY"]), time: row["NO"]?.trim() },
              { station: "E.66A", elevation: parseFloat(row["E.66A"]), time: row["NO"]?.trim() },
              { station: "E.87", elevation: parseFloat(row["E.87"]), time: row["NO"]?.trim() },
              { station: "RE", elevation: parseFloat(row["RE"]), time: row["NO"]?.trim() },
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

  // --- START: MODIFIED USEEFFECT FOR INITIAL DATE/TIME AND STATION CHANGE ---
  useEffect(() => {
    if (availableDates.length) {
      // If selectedDate is currently empty or not in availableDates, set it to the first available date
      const initialDate = availableDates.includes(selectedDate) ? selectedDate : availableDates[0];
      setSelectedDate(initialDate);
  
      // Get all times for the initialDate
      const timesInDate = groupedByDate[initialDate]?.map((item) => item.time) || [];
      
      // Attempt to find 7 AM
      const sevenAMTime = initialDate + "T07:00:00";
      let newSelectedTime = timesInDate[0]; // Default to first available time

      if (timesInDate.includes(sevenAMTime)) {
        newSelectedTime = sevenAMTime;
      } else {
        const nextAvailableTime = timesInDate.find(time => time > sevenAMTime);
        if (nextAvailableTime) {
          newSelectedTime = nextAvailableTime;
        }
      }
      
      // Set initial selected time (only if selectedTime is currently empty or invalid for the station)
      // This ensures selectedTime is set on initial load or station change, but not overridden by date change
      if (!timesInDate.includes(selectedTime) || !selectedTime) {
         setSelectedTime(newSelectedTime);
      }

    } else {
      setSelectedDate("");
      setSelectedTime("");
    }
  }, [availableDates, selectedStation]); // Re-run when availableDates or selectedStation changes

  // --- NEW useEffect to handle selectedTime when selectedDate changes ---
  useEffect(() => {
    // This effect runs when selectedDate changes due to user interaction (not play button)
    // We only need to adjust selectedTime if the current selectedTime is no longer valid for the new selectedDate.
    if (selectedDate && groupedByDate[selectedDate]) {
      const timesForNewDate = groupedByDate[selectedDate]?.map(item => item.time) || [];
      // If the current selectedTime is NOT in the new date's times, find the closest valid time
      if (!timesForNewDate.includes(selectedTime)) {
        const timePart = selectedTime.split('T')[1]; // Get just the time part (e.g., "07:00:00")
        const targetTimeOnNewDate = selectedDate + 'T' + timePart;

        let newValidTime = timesForNewDate[0]; // Fallback to the first time of the new day

        if (timesForNewDate.includes(targetTimeOnNewDate)) {
          newValidTime = targetTimeOnNewDate;
        } else {
          // If the specific time doesn't exist, find the next closest one or the last one
          const nextClosest = timesForNewDate.find(t => t > targetTimeOnNewDate);
          if (nextClosest) {
            newValidTime = nextClosest;
          } else if (timesForNewDate.length > 0) {
            newValidTime = timesForNewDate[timesForNewDate.length - 1]; // Fallback to last time if no next
          }
        }
        setSelectedTime(newValidTime);
      }
    }
  }, [selectedDate]); // This effect only depends on selectedDate

  // --- END: MODIFIED USEEFFECT FOR INITIAL DATE/TIME AND STATION CHANGE ---
  
  useEffect(() => {
  if (isPlaying) {
    intervalIdRef.current = window.setInterval(() => {
      const timesForSelectedDate = groupedByDate[selectedDate]?.map(item => item.time) || [];
      const currentIndexInDay = timesForSelectedDate.indexOf(selectedTime);

      if (currentIndexInDay !== -1 && currentIndexInDay < timesForSelectedDate.length - 1) {
        // If there's a next time in the current day
        setSelectedTime(timesForSelectedDate[currentIndexInDay + 1]);
      } else {
        // No more times in current day, move to next date
        const currentDayIndex = availableDates.indexOf(selectedDate);
        if (currentDayIndex < availableDates.length - 1) {
          const nextDate = availableDates[currentDayIndex + 1];
          setSelectedDate(nextDate); // This will trigger the new useEffect for selectedTime
        } else {
          // End of all dates, stop playing
          setIsPlaying(false);
        }
      }
    }, 400); // Change time every 1 second (adjust as needed for smoother animation)
  } else {
    // Clear interval when not playing
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
  }

  // Cleanup on unmount or when isPlaying/dependencies change
  return () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
  };
}, [isPlaying, selectedDate, selectedTime, groupedByDate, availableDates]); // Dependencies for play/pause
  
  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };
  
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
          y: Levels.alert, // Assuming this is for Left Bank
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
          y: Levels.alert, // Assuming this is for Right Bank
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
        formatter: (value: any) => (value).toFixed(2), // แสดงค่าทศนิยม 2 ตำแหน่ง
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
            fontSize: { xs: "0.8rem", sm: "1rem" },
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#115293" },
            borderRadius: "20px",
            paddingX: "16px",
            width: { xs: "100%", sm: "auto" },
            mb: { xs: 2, sm: 0 },
          }}
          variant="contained"
          onClick={() => {
            setIsPlaying(false); // Pause on manual navigation
            const timesForSelectedDate = groupedByDate[selectedDate]?.map(item => item.time) || [];
            const currentIndexInDay = timesForSelectedDate.indexOf(selectedTime);

            if (currentIndexInDay > 0) {
              setSelectedTime(timesForSelectedDate[currentIndexInDay - 1]);
            } else {
              // If at the beginning of the day, try to go to the previous day
              const currentDayIndex = availableDates.indexOf(selectedDate);
              if (currentDayIndex > 0) {
                const prevDate = availableDates[currentDayIndex - 1];
                setSelectedDate(prevDate);
                // When moving to previous day, set time to the last hour of that day
                const timesForPrevDate = groupedByDate[prevDate]?.map(item => item.time) || [];
                setSelectedTime(timesForPrevDate[timesForPrevDate.length - 1] || "");
              }
            }
          }}
          disabled={isPlaying || (selectedDate === availableDates[0] && selectedTime === (groupedByDate[availableDates[0]]?.[0]?.time || ""))}
        >
          <ArrowBack /> ย้อนกลับ
        </Button>
        
        <Select
          sx={{
            fontFamily: "Prompt",
            width: { xs: "100%", sm: "auto" },
            marginBottom: { xs: 2, sm: 0 },
          }}
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value as string)}
          disabled={isPlaying} // Disable during playback
        >
          {Object.keys(stationMapping).map((station) => (
            <MenuItem key={station} value={station}>{locationMapping(station)}</MenuItem>
          ))}
        </Select>
        
        {/* เลือกวันที่ */}
        <Select
            sx={{
              fontFamily: "Prompt",
              width: { xs: "40%", sm: "auto" },
            }}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value as string);
              setIsPlaying(false); // Pause on manual date change
              // *** No direct setSelectedTime here, it's handled by the new useEffect ***
            }}
            disabled={isPlaying} // Disable during playback
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
            width: { xs: "40%", sm: "auto" },
          }}
            value={selectedTime}
            onChange={(e) => {
              setSelectedTime(e.target.value as string);
              setIsPlaying(false); // Pause on manual time change
            }}
            disabled={!selectedDate || isPlaying} // Disable during playback
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

        {/* Play/Pause Button */}
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
          variant="contained"
          onClick={() => {
            setIsPlaying(false); // Pause on manual navigation
            const timesForSelectedDate = groupedByDate[selectedDate]?.map(item => item.time) || [];
            const currentIndexInDay = timesForSelectedDate.indexOf(selectedTime);

            if (currentIndexInDay !== -1 && currentIndexInDay < timesForSelectedDate.length - 1) {
              setSelectedTime(timesForSelectedDate[currentIndexInDay + 1]);
            } else {
              // If at the end of the day, try to go to the next day
              const currentDayIndex = availableDates.indexOf(selectedDate);
              if (currentDayIndex < availableDates.length - 1) {
                const nextDate = availableDates[currentDayIndex + 1];
                setSelectedDate(nextDate);
                // When moving to next day, set time based on existing selectedTime or 7 AM if not found
                const timesForNextDate = groupedByDate[nextDate]?.map(item => item.time) || [];
                const timePart = selectedTime.split('T')[1]; // Get just the time part
                const targetTimeOnNextDate = nextDate + 'T' + timePart;

                let nextDayTime = timesForNextDate[0]; // Default to first available time

                if (timesForNextDate.includes(targetTimeOnNextDate)) {
                  nextDayTime = targetTimeOnNextDate;
                } else {
                  const nextClosest = timesForNextDate.find(t => t > targetTimeOnNextDate);
                  if (nextClosest) {
                    nextDayTime = nextClosest;
                  } else if (timesForNextDate.length > 0) {
                    nextDayTime = timesForNextDate[timesForNextDate.length - 1]; // Fallback to last time if no next
                  }
                }
                setSelectedTime(nextDayTime || "");
              }
            }
          }}
          disabled={isPlaying || (selectedDate === availableDates[availableDates.length - 1] && selectedTime === (groupedByDate[availableDates[availableDates.length - 1]]?.[groupedByDate[availableDates[availableDates.length - 1]]?.length - 1]?.time || ""))}
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