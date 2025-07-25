import { useState, useEffect } from "react";
import {
  Table, TableHead, TableBody, TableCell, TableRow,
  TextField, Button, Typography,
  CardContent,
  Grid,
  Card,
  CircularProgress,
  Box,
  Divider
} from "@mui/material";
import { API_URL } from "../../utility";
import { BeachAccess, WaterDrop, Flood } from "@mui/icons-material";
import axios from "axios";

const defaultRows = [
  { station_id: 5, name: "สชป.6", type: "rain_rid", values: Array(14).fill(0) },
  { station_id: 10, name: "E.6C", type: "rain_rid", values: Array(14).fill(0) },
  { station_id: 14, name: "อ่างฯห้วยสามพาด", type: "rain_rid", values: Array(14).fill(0) },
  { station_id: 16, name: "อ่างฯห้วยสังเคียบ", type: "rain_rid", values: Array(14).fill(0) },
  { station_id: "WY.01", name: "สถานีชีกลาง", type: "rain_project", values: Array(14).fill(0) },
  { station_id: "WY.02", name: "สถานีวังยาง", type: "rain_project", values: Array(14).fill(0) },
  { station_id: "E.91", name: "สถานีวัดน้ำท่า E.91", type: "flow", values: Array(7).fill(0) },
  { station_id: "E.87", name: "สถานีวัดน้ำท่า E.87", type: "flow", values: Array(7).fill(0) },
];

const HeaderCellStyle = {
  top: { xs: 115, md: 60 },
  border: "1px solid #ddd",
  fontFamily: "Prompt",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "rgb(1, 87, 155)",
  color: "white",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "0.9rem" },
};

const getCellStyle = (index: number) => ({
  padding: "5px",
  backgroundColor: index % 2 === 0 ? '#FAFAFA': '#FFF',
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "0.9rem" },
});

export default function RainInputTable() {
    const [rows, setRows] = useState(defaultRows);
    const [messages, setMessages] = useState<{ [key: number]: string }>({});
    const [buttonLoading, setButtonLoading] = useState<{ [key: number]: boolean }>({});
    const [initialDataLoading, setInitialDataLoading] = useState(true);

    const cardData = [
        { title: "ดาวน์โหลดกริดฝนพยากรณ์ (กรมอุตุนิยมวิทยา)",color: "#1976d2", icon: <BeachAccess />, url: `${API_URL}hec_apidowload_rain_grid.php` },
        { title: "สร้างไฟล์ input-hms.txt โดยใช้ฝนพยากรณ์",color: "#1976d2", icon: <WaterDrop />, url: `${API_URL}hec_apiwrite_input_txt.php` },
        { title: "แปลงรูปแบบไฟล์เป็น input-hms.dss",color: "#1976d2", icon: <Flood />, url: `${API_URL}hec_apiwrite_input_dss.php` },
        { title: "รันสคริปต์ทั้งหมด (Hec-Dss)",color: "#2e7d32", icon: <Flood />, url: `${API_URL}hec_apidss_all.php` },
    ];

    const handleRunPhpFile = async (index: number, url: string) => {
        setButtonLoading((prev) => ({ ...prev, [index]: true }));

        try {
            const response = await axios.post(url);

            if (response.data.error) {
                setMessages((prev) => ({ ...prev, [index]: "❌ Run Error" }));
            } else {
                setMessages((prev) => ({ ...prev, [index]: "✅ Run Success" }));
            }
        } catch (error: any) {
            setMessages((prev) => ({ ...prev, [index]: "❌ Error executing PHP script: " + (error.message || error) }));
        } finally {
            setButtonLoading((prev) => ({ ...prev, [index]: false }));
        }
    };


    // This function now precisely generates dates for specific ranges
    const generateDates = (startDayOffset: number, endDayOffset: number) => {
      const dates: string[] = [];
      const today = new Date();

      for (let i = startDayOffset; i <= endDayOffset; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const formatted = d.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });
        dates.push(formatted);
      }
      return dates;
    };

    const handleChange = (rowIdx: number, dayIdx: number, value: string) => {
        const newRows = [...rows];
        let val = parseFloat(value);
        if (isNaN(val) || val < 0) val = 0;
        newRows[rowIdx].values[dayIdx] = val;
        setRows(newRows);
    };

    const handleSubmit = () => {
        fetch(`${API_URL}hec_apiwrite_input_manual.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: rows }),
        })
            .then((res) => res.json())
            .then((data) => {
                console.log("✅ สร้างไฟล์ input-hms.txt สำเร็จ:", data);
                alert("คำนวณสำเร็จ");
            })
            .catch((err) => {
                console.error("❌ สร้างไฟล์ input-hms.txt ล้มเหลว:", err);
                alert("สร้างไฟล์ไม่สำเร็จ");
            });
    };
  useEffect(() => {
        const loadData = async () => {
            try {
                setInitialDataLoading(true);

                // --- Fetch all necessary data ---
                const [
                    resSubbasinData,
                    resRainData,
                    resFlowData,
                    resGridRainData
                ] = await Promise.all([
                    fetch(`${API_URL}hec_api/input_hms.php`).then(res => res.json()),
                    fetch(`http://localhost/wangyang/API/api_rain_hydro3.php`).then(res => res.json()),
                    fetch("http://localhost/wangyang/API/api_flow_hydro3_8day.php").then(res => res.json()),
                    fetch("http://localhost/wangyang/hec_api/filter_rain_grid_api.php").then(res => res.json()),
                ]);

                // --- Process fetched data into Maps for easy lookup ---
                const rainDataMap = new Map();
                if (Array.isArray(resRainData)) {
                    resRainData.forEach((data: any) => {
                        if (data.station_id !== undefined) {
                            rainDataMap.set(data.station_id, data);
                        }
                    });
                }

                const flowDataMap = new Map();
                if (Array.isArray(resFlowData)) {
                    resFlowData.forEach((data: any) => {
                        if (data.stationcode) {
                            flowDataMap.set(data.stationcode, data);
                        }
                    });
                }

                const wyDailyRainMap = new Map();
                if (resSubbasinData && resSubbasinData.wy_api_raw_data_hourly_summed) {
                    const summedData = resSubbasinData.wy_api_raw_data_hourly_summed;
                    for (const stationCode in summedData) {
                        if (Object.prototype.hasOwnProperty.call(summedData, stationCode)) {
                            wyDailyRainMap.set(stationCode, summedData[stationCode]);
                        }
                    }
                }

                // --- Subbasin Ratios (Hardcoded in frontend for now) ---
                const subbasinRatios = {
                    'SB-01': { '5': 0.7979, '10': 0.2021 },
                    'SB-02': { '5': 0.7725, '14': 0.2275 },
                    'SB-03': { '5': 0.5710, 'WY.02': 0.4290 },
                    'SB-04': { 'WY.01': 0.1585, 'WY.02': 0.8415 },
                    'SB-05': { '16': 0.2931, '5': 0.0250, 'WY.01': 0.0874, 'WY.02': 0.5945 },
                    'SB-06': { 'WY.01': 0.5962, 'WY.02': 0.4038 },
                    'SB-07': { 'WY.01': 1.000 },
                };

                // Helper to get date keys in "00:00Z YYYY-MM-DD" format for 14-day rain period
                const getRainDateKeysForApi = (startOffset: number, endOffset: number) => {
                    const keys: string[] = [];
                    const today = new Date();
                    for (let i = startOffset; i <= endOffset; i++) {
                        const d = new Date(today);
                        d.setDate(d.getDate() + i);
                        keys.push(`00:00Z ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                    }
                    return keys;
                };


                const newRows = defaultRows.map(row => {
                    let values: number[] = [];
                    // Rain data (both observed and forecast) covers 14 days (-7 to +6)
                    // Flow data covers 8 days (-7 to 0)
                    const totalRainDays = 14;
                    const totalFlowDays = 8;
                    const numDaysForType = row.type.startsWith("rain") ? totalRainDays : totalFlowDays;

                    // Initialize values array with zeros for the full 14 or 8 days
                    values = Array(numDaysForType).fill(0);

                    // --- Populate based on type ---
                    if (row.type === "rain_rid") { // Observed Rain Data (-7 to -1)
                        const rainStationData = rainDataMap.get(row.station_id);
                        if (rainStationData) {
                            // Loop for the past 7 days (index 0 to 6 in a 14-day array)
                            for (let i = 7; i >= 1; i--) {
                                const key = `rain_${i}_days_ago`;
                                const val = parseFloat(rainStationData[key]);
                                // Map "i days ago" to the correct index in the 14-day array
                                // For rain_7_days_ago (i=7), index is 0 (-7 days from today)
                                // For rain_1_days_ago (i=1), index is 6 (-1 day from today)
                                values[7 - i] = isNaN(val) ? 0 : val;
                            }
                        }
                    } else if (row.type === "rain_project") { // Forecast Rain Data (0 to +6) and observed from WY.01/WY.02
                        // First, populate future forecast from rain grid (SB values) for days 0 to 6
                        const forecastRainDateKeys = getRainDateKeysForApi(0, 6); // Today to 6 days in future
                        for (const sb in subbasinRatios) {
                            if (Object.prototype.hasOwnProperty.call(subbasinRatios, sb)) {
                                const ratiosForSb = subbasinRatios[sb as keyof typeof subbasinRatios];
                                if (ratiosForSb.hasOwnProperty(String(row.station_id))) {
                                    forecastRainDateKeys.forEach((dateKey, index) => {
                                        // The index 'index' here directly corresponds to the day offset from today (0 for today, 1 for tomorrow, etc.)
                                        // So, these values go into array indices 7 to 13 (since index 7 is 'today' in the 14-day array)
                                        if (resGridRainData && resGridRainData[sb] && resGridRainData[sb].values && resGridRainData[sb].values[dateKey] !== undefined) {
                                            const sbValue = parseFloat(resGridRainData[sb].values[dateKey]);
                                            values[7 + index] = isNaN(sbValue) ? 0 : sbValue; // Place in the future part of the 14-day array
                                        }
                                    });
                                }
                            }
                        }

                        // Then, overwrite with specific observed project rain (WY.01, WY.02) for past 7 days and today
                        const stationDailyRain = wyDailyRainMap.get(row.station_id);
                        if (stationDailyRain) {
                            const today = new Date();
                            // Loop for past 7 days including today (indices 0 to 6 in 14-day array)
                            for (let i = -7; i <= 0; i++) { // From 7 days ago to today
                                const date = new Date(today);
                                date.setDate(today.getDate() + i);
                                const dateKeyCE = date.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });

                                const val = stationDailyRain[dateKeyCE];
                                // Map "i" (offset from today) to the correct index in the 14-day array
                                // i=-7 -> index 0; i=0 -> index 7
                                values[i + 7] = isNaN(parseFloat(val)) ? 0 : parseFloat(val);
                            }
                        }

                    } else if (row.type === "flow") { // Flow Data (-7 to 0)
                        const flowStationData = flowDataMap.get(row.station_id);
                        if (flowStationData) {
                            const today = new Date();
                            // Loop for 8 days (7 days ago to today)
                            for (let i = -7; i <= 0; i++) {
                                const date = new Date(today);
                                date.setDate(today.getDate() + i);
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                const dateKey = `${day}/${month}/${year}`;

                                const val = parseFloat(flowStationData[dateKey]);
                                // Map "i" (offset from today) to the correct index in the 8-day array
                                // i=-7 -> index 0; i=0 -> index 7
                                values[i + 7] = isNaN(val) ? 0 : val;
                            }
                        }
                    }
                    return { ...row, values };
                });
                setRows(newRows);
            } catch (err) {
                console.error("❌ ดึงข้อมูลจาก API ล้มเหลว:", err);
            } finally {
                setInitialDataLoading(false);
            }
        };

        loadData();
    }, []);

    const allRainfallRows = rows.filter(row => row.type === 'rain_rid' || row.type === 'rain_project');
    const flowRows = rows.filter(row => row.type === 'flow');


    const renderTable = (tableRows: typeof defaultRows, title: string, startDayOffset: number, endDayOffset: number) => (
        <Box sx={{ my: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "Prompt", mb: 2 }}>
                {title}
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ ...HeaderCellStyle, minWidth: { md: "200px", xs: "100px" } }}>สถานี</TableCell>
                        {generateDates(startDayOffset, endDayOffset).map((dateStr, i) => (
                            <TableCell key={i} sx={HeaderCellStyle}>{dateStr}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tableRows.map((row, rowIdx) => {
                        // Calculate the number of cells needed based on the date range
                        const numberOfCells = endDayOffset - startDayOffset + 1;

                        let startIndexInValues = 0;
                        if (row.type === 'rain_project' && startDayOffset === 0) { // If it's a future rain project table
                             startIndexInValues = 7;
                        } else if (row.type === 'rain_rid' && startDayOffset === -7) { // If it's historical rain
                            startIndexInValues = 0;
                        } else if (row.type === 'flow' && startDayOffset === -7) { // If it's flow data
                             startIndexInValues = 0;
                        }

                        return (
                            <TableRow key={row.station_id}>
                                <TableCell sx={getCellStyle(rowIdx)}>{row.name}</TableCell>
                                {Array.from({ length: numberOfCells }).map((_, colIdx) => {
                                    const valueToShow = row.values[startIndexInValues + colIdx];
                                    return (
                                        <TableCell key={colIdx} sx={getCellStyle(rowIdx)}>
                                            <TextField
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                                value={valueToShow !== undefined ? valueToShow.toFixed(2) : '0.00'}
                                                inputProps={{ min: 0 }}
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === 'e') e.preventDefault();
                                                }}
                                                onChange={(e) =>
                                                    handleChange(rows.indexOf(row), startIndexInValues + colIdx, e.target.value)
                                                }
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Box>
    );

    if (initialDataLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ fontFamily: "Prompt", ml: 2 }}>กำลังโหลดข้อมูล...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "Prompt", mb: 2 }}>
                ขั้นตอนที่ 1 เตรียมข้อมูลน้ำฝน-น้ำท่า (Hec-Dss)
            </Typography>
            <Grid container spacing={2}>
                {cardData.slice(0, 2).map((card, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                        <Card sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    color="textSecondary"
                                    gutterBottom
                                    sx={{ fontFamily: "Prompt" }}
                                >
                                    {card.icon} {card.title}
                                </Typography>

                                <Button
                                    variant="contained"
                                    sx={{ marginTop: 2, width: "100%", backgroundColor: card.color }}
                                    onClick={() => handleRunPhpFile(index, card.url)}
                                    disabled={buttonLoading[index]}
                                >
                                    {buttonLoading[index] ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        "รันคำสั่ง"
                                    )}
                                </Button>

                                <Typography
                                    variant="body1"
                                    sx={{
                                        textAlign: "center",
                                        marginTop: 2,
                                        color: messages[index]?.includes("Error") ? "red" : "green",
                                    }}
                                >
                                    {messages[index]}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* ตารางข้อมูลปริมาณน้ำฝน (Rainfall Data - Observed) */}
            {/* Displaying -7 days ago to -1 day ago (7 days total) */}
            {renderTable(allRainfallRows, "ข้อมูลปริมาณน้ำฝนตรวจวัด (ข้อมูลย้อนหลัง 7 วัน)", -7, -1)}

            <Divider sx={{ my: 4 }} />

            {/* ตารางฝนพยากรณ์ (Rain Forecast - Project) */}
            {/* Displaying today (0) to +6 days in the future (7 days total) */}
            {renderTable(allRainfallRows, "ข้อมูลปริมาณน้ำฝนพยากรณ์ (วันปัจจุบันถึงล่วงหน้า 6 วัน)", 0, 6)}

            <Divider sx={{ my: 4 }} />

            {/* ตารางปริมาณน้ำท่า (Water Flow Data) */}
            {/* Displaying -7 days ago to today (0) (8 days total) */}
            {renderTable(flowRows, "ข้อมูลปริมาณน้ำท่าตรวจวัด (ย้อนหลัง 7 วันและวันปัจจุบัน)", -7, 0)}

            <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 2, fontFamily: "Prompt" }}>
                คำนวณ SB แล้วสร้างไฟล์ input-hms.txt
            </Button>
            <Grid container spacing={2} sx={{ mt: 2 }}>
             {cardData.slice(2, 4).map((card, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                        <Card sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    color="textSecondary"
                                    gutterBottom
                                    sx={{ fontFamily: "Prompt" }}
                                >
                                    {card.icon} {card.title}
                                </Typography>

                                <Button
                                    variant="contained"
                                    sx={{ marginTop: 2, width: "100%", backgroundColor: card.color}}
                                    onClick={() => handleRunPhpFile(index + 2, card.url)}
                                    disabled={buttonLoading[index + 2]}
                                >
                                    {buttonLoading[index + 2] ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        "รันคำสั่ง"
                                    )}
                                </Button>

                                <Typography
                                    variant="body1"
                                    sx={{
                                        textAlign: "center",
                                        marginTop: 2,
                                        color: messages[index + 2]?.includes("Error") ? "red" : "green",
                                    }}
                                >
                                    {messages[index + 2]}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}