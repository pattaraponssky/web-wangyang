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

                const [resSubbasinData ,resRainData, resFlowData] = await Promise.all([
                    fetch(`${API_URL}/input_hms.php`).then(res => res.json()),
                    // API_rain_hydro3.php ตอนนี้มี rain_X_days_ago
                    fetch(`http://localhost/wangyang/API/api_rain_hydro3.php`).then(res => res.json()),
                    // API_flow_hydro3_8day.php ตอนนี้มีวันที่เป็นคีย์
                    fetch("http://localhost/wangyang/API/api_flow_hydro3_8day.php").then(res => res.json()),
                ]);

                // สร้าง Map สำหรับข้อมูลฝน (resRainData) ใช้ station_code เป็น key
                const rainDataMap = new Map();
                if (Array.isArray(resRainData)) {
                    resRainData.forEach((data: any) => {
                        if (data.station_id !== undefined) { // ใช้ station_id (ตัวเลข)
                            rainDataMap.set(data.station_id, data);
                            console.log(`📊 ข้อมูลฝนสำหรับสถานี ${data.station_id}:`, data);
                            
                        }
                    });
                }
                
                
                // สร้าง Map สำหรับข้อมูลน้ำท่า (resFlowData) ใช้ stationcode เป็น key
                const flowDataMap = new Map();
                if (Array.isArray(resFlowData)) {
                    resFlowData.forEach((data: any) => {
                        if (data.stationcode) { // ใช้ stationcode จาก API flow
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
 const newRows = defaultRows.map(row => {
                    let values: number[] = []; // Ensure values is an array of numbers

                    if (row.type === "rain_rid") {
                        const rainStationData = rainDataMap.get(row.station_id);
                        values = Array(14).fill(0); // Initialize with 14 zeros for rain

                        if (rainStationData) {
                            // Populate 7 days of historical rain data
                            for (let i = 7; i >= 1; i--) {
                                const key = `rain_${i}_days_ago`;
                                const val = parseFloat(rainStationData[key]);
                                // Calculate the correct index for the `values` array
                                // `i` goes from 7 (oldest) to 1 (yesterday)
                                // We want the oldest day (7 days ago) to be at index 0
                                // and yesterday (1 day ago) to be at index 6
                                // So, index = 7 - i
                                values[7 - i] = isNaN(val) ? 0 : val;
                            }
                            // Days from index 7 to 13 (today to 6 days from now) remain 0
                            // unless you have future forecast data from this API.
                        }
                    } else if (row.type === "rain_project") {
                        const stationDailyRain = wyDailyRainMap.get(row.station_id);
                        values = Array(14).fill(0); // Initialize with 14 zeros for project rain

                        if (stationDailyRain) {
                            const today = new Date();
                            for (let i = -7; i <= 6; i++) { // Loop for 14 days
                                const date = new Date(today);
                                date.setDate(today.getDate() + i);
                                const dateKeyCE = date.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });

                                const val = stationDailyRain[dateKeyCE];
                                // Map the loop index `i` (-7 to 6) to `values` array index (0 to 13)
                                // If i is -7, array index is 0. If i is 6, array index is 13.
                                values[i + 7] = isNaN(parseFloat(val)) ? 0 : parseFloat(val);
                            }
                        }
                    } else if (row.type === "flow") {
                        const flowStationData = flowDataMap.get(row.station_id);
                        values = Array(8).fill(0); // Initialize with 8 zeros for flow

                        if (flowStationData) {
                            const today = new Date();
                            for (let i = 7; i >= 0; i--) { // Loop for 8 days (7 days ago to today)
                                const date = new Date(today);
                                date.setDate(today.getDate() - i);
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                const dateKey = `${day}/${month}/${year}`;

                                const val = parseFloat(flowStationData[dateKey]);
                                // Flow data goes from oldest (index 0) to newest (index 7)
                                values[7 - i] = isNaN(val) ? 0 : val;
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
                                        value={val}
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