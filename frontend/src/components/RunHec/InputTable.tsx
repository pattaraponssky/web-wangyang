import { useState, useEffect } from "react";
import {
  Table, TableHead, TableBody, TableCell, TableRow,
  TextField, Button, Typography,
  CardContent,
  Grid,
  Card,
  CircularProgress,
  Box
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

const getCellStyle = (index: number, rowType: string) => ({
  padding: "5px",
  // **แก้ไขตรงนี้**: ตรวจสอบ rowType เพื่อกำหนดสีพื้นหลัง
  backgroundColor:
  rowType === 'flow'
    ? '#e3f2fd'
    : rowType === 'rain_rid'
    ? '#fce4ec'
     : rowType === 'rain_project'
    ? '#fce4ec'
    : index % 2 === 0
    ? '#FAFAFA'
    : '#FFF',
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "0.9rem" },
});

export default function RainInputTable() {
    const [rows, setRows] = useState(defaultRows);
    const [messages, setMessages] = useState<{ [key: number]: string }>({});
    const [buttonLoading, setButtonLoading] = useState<{ [key: number]: boolean }>({}); // เปลี่ยนชื่อเป็น buttonLoading
    const [initialDataLoading, setInitialDataLoading] = useState(true); // เพิ่ม state สำหรับการโหลดข้อมูลเริ่มต้น

    const cardData = [
        { title: "ดาวน์โหลดกริดฝนพยากรณ์ (กรมอุตุนิยมวิทยา)",color: "#1976d2", icon: <BeachAccess />, url: `${API_URL}dowload_rain_grid.php` },
        { title: "สร้างไฟล์ input-hms.txt โดยใช้ฝนพยากรณ์",color: "#1976d2", icon: <WaterDrop />, url: `${API_URL}write_input_txt.php` },
        { title: "แปลงรูปแบบไฟล์เป็น input-hms.dss",color: "#1976d2", icon: <Flood />, url: `${API_URL}write_input_dss.php` },
        { title: "รันสคริปต์ทั้งหมด (Hec-Dss)",color: "#2e7d32", icon: <Flood />, url: `${API_URL}dss_all.php` },
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
        } catch (error: any) { // ระบุ type ของ error
            setMessages((prev) => ({ ...prev, [index]: "❌ Error executing PHP script: " + (error.message || error) }));
        } finally {
            setButtonLoading((prev) => ({ ...prev, [index]: false }));
        }
    };


    const generateDates = () => {
      const dates: string[] = [];
      const today = new Date(); // วันนี้คือ Mon Jul 14 2025
      
      // ลูปจาก -6 (6 วันที่แล้ว) ถึง 7 (7 วันในอนาคต)
      // รวมทั้งหมด 14 วัน: (-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7)
      for (let i = -7; i <= 6; i++) { 
        const d = new Date(today);
        d.setDate(d.getDate() + i); // เพิ่ม/ลบวัน
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
        fetch(`${API_URL}write_input_manual.php`, {
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
                    resGridRainData // Data from filter_rain_grid_api.php
                ] = await Promise.all([
                    fetch(`${API_URL}/input_hms.php`).then(res => res.json()),
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
                const getRainDateKeysForApi = () => {
                    const keys: string[] = [];
                    const today = new Date();
                    for (let i = -7; i <= 6; i++) {
                        const d = new Date(today);
                        d.setDate(d.getDate() + i);
                        keys.push(`00:00Z ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                    }
                    return keys;
                };
                const rainDateKeys = getRainDateKeysForApi();

                const newRows = defaultRows.map(row => {
                    let values: number[] = [];
                    const numDays = row.type.startsWith("rain") ? 14 : 7; // Rain data is 14 days, Flow is 7 days

                    // Initialize values array with zeros
                    values = Array(numDays).fill(0);

                    // --- Step 1: Populate rain data from filter_rain_grid_api.php (SB values) ---
                    // This acts as the base or forecasted values, especially for future days.
                    if (row.type.startsWith("rain")) {
                        for (const sb in subbasinRatios) {
                            if (Object.prototype.hasOwnProperty.call(subbasinRatios, sb)) {
                                const ratiosForSb = subbasinRatios[sb as keyof typeof subbasinRatios];
                                // Check if the current station is part of this SB
                                if (ratiosForSb.hasOwnProperty(String(row.station_id))) {
                                    rainDateKeys.forEach((dateKey, index) => {
                                        if (resGridRainData && resGridRainData[sb] && resGridRainData[sb].values && resGridRainData[sb].values[dateKey] !== undefined) {
                                            const sbValue = parseFloat(resGridRainData[sb].values[dateKey]);
                                            values[index] = isNaN(sbValue) ? 0 : sbValue;
                                        }
                                    });
                                    // IMPORTANT: Do NOT return here. Allow more precise data to overwrite.
                                }
                            }
                        }
                    }

                    // --- Step 2: Overwrite with more precise historical/forecast data if available ---
                    // This ensures actual observed/projected data takes precedence.

                    if (row.type === "rain_rid") {
                        const rainStationData = rainDataMap.get(row.station_id);
                        if (rainStationData) {
                            // Populate 7 days of historical rain data (indices 0-6 in 14-day array)
                            for (let i = 7; i >= 1; i--) {
                                const key = `rain_${i}_days_ago`;
                                const val = parseFloat(rainStationData[key]);
                                values[7 - i] = isNaN(val) ? 0 : val; // Overwrite estimated values
                            }
                            // Future days (index 7 to 13) will retain values from Step 1 or remain 0
                        }
                    } else if (row.type === "rain_project") {
                        const stationDailyRain = wyDailyRainMap.get(row.station_id);
                        if (stationDailyRain) {
                            const today = new Date();
                            for (let i = -6; i <= 0; i++) {
                                const date = new Date(today);
                                date.setDate(today.getDate() + i);
                                const dateKeyCE = date.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });

                                const val = stationDailyRain[dateKeyCE];
                                values[i + 6] = isNaN(parseFloat(val)) ? 0 : parseFloat(val); // Overwrite estimated values
                            }
                        }
                    } else if (row.type === "flow") {
                        const flowStationData = flowDataMap.get(row.station_id);
                        // Flow values are always 7 days, and distinct from rain logic
                        values = Array(8).fill(0); // Re-initialize as flow is separate from rain estimation
                        if (flowStationData) {
                            const today = new Date();
                            for (let i = -7; i <= 0; i++) { // Loop for 7 days (6 days ago to today)
                                const date = new Date(today);
                                date.setDate(today.getDate() + i); // Adjust day
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                const dateKey = `${day}/${month}/${year}`;

                                const val = parseFloat(flowStationData[dateKey]);
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
            <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "Prompt", my: 2 }}>
                กรอกข้อมูล<span style={{ color: '#fd7fab' }}>ปริมาณน้ำฝน</span> และ<span style={{ color: '#0288d1' }}>ปริมาณน้ำท่า</span>สำหรับแบบจำลอง
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ ...HeaderCellStyle, minWidth: { md: "200px", xs: "100px" } }}>สถานี</TableCell>
                        {generateDates().map((dateStr, i) => (
                            <TableCell key={i} sx={HeaderCellStyle}>{dateStr}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, rowIdx) => (
                        <TableRow key={row.station_id}>
                             <TableCell sx={getCellStyle(rowIdx, row.type)}>{row.name}</TableCell>
                            {row.values.map((val, colIdx) => (
                                 <TableCell key={colIdx} sx={getCellStyle(rowIdx, row.type)}>
                                    <TextField
                                        type="number"
                                        variant="outlined"
                                        size="small"
                                        value={val.toFixed(2)}
                                        inputProps={{ min: 0 }}
                                        onKeyDown={(e) => {
                                            if (e.key === '-' || e.key === 'e') e.preventDefault();
                                        }}
                                        onChange={(e) =>
                                            handleChange(rowIdx, colIdx, e.target.value)
                                        }
                                    />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
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
        </Box>
    );
}