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
  { station_id: 5, name: "สชป.6", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: 10, name: "E.6C", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: 14, name: "อ่างฯห้วยสามพาด", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: 16, name: "อ่างฯห้วยสังเคียบ", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: "WY.01", name: "สถานีชีกลาง", type: "rain_project", values: Array(7).fill(0) },
  { station_id: "WY.02", name: "สถานีวังยาง", type: "rain_project", values: Array(7).fill(0) },
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
  backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
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
        { title: "สร้างไฟล์ input-hms.txt อัตโนมัติ (ไม่ต้องรันหากกรอกข้อมูลด้วยตัวเอง)",color: "#1976d2", icon: <WaterDrop />, url: `${API_URL}write_input_txt.php` },
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
      for (let i = -7; i <= 0; i++) { 
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
                    let values = [];
                    let newValues = Array(7).fill(0); 
                    if (row.type === "rain_rid") {
                        const rainStationData = rainDataMap.get(row.station_id);

                        if (rainStationData) {
                            const extractedRainValues: number[] = [];
                            for (let i = 7; i >= 1; i--) { // i=6 คือ 6 วันที่แล้ว, i=0 คือ วันนี้
                                const key = `rain_${i}_days_ago`;
                                if (i === 0) { 
                                   extractedRainValues.push(0); // สมมติว่าวันนี้ฝน 0 หรือถ้า API มีคีย์อื่นให้ใส่ตรงนี้
                                } else {
                                    const val = parseFloat(rainStationData[key]);
                                    extractedRainValues.push(isNaN(val) ? 0 : val);
                                }
                            }
                             values = extractedRainValues; // reverse เพื่อให้เก่าสุดอยู่ซ้ายสุด (วันที่เก่าสุด) ไปใหม่สุดอยู่ขวาสุด (วันที่ใกล้ปัจจุบัน)
                        } else {
                            // ถ้าไม่พบข้อมูล rain_project ให้ใช้ค่า default (Array(14).fill(0))
                            values = newValues; // ซึ่งเป็น Array(14).fill(0) อยู่แล้ว
                        }
                       } else if (row.type === "rain_project") {
                        // ดึงข้อมูลฝนรายวันจาก wy_api_raw_data_hourly_summed (จาก resSubbasinData)
                        const stationDailyRain = wyDailyRainMap.get(row.station_id);
                        if (stationDailyRain) {
                            const extractedProjectRainValues: number[] = [];
                            const today = new Date();

                            // ต้องการ 7 วัน (ตาม UI), ลูปจาก 6 วันที่แล้วถึงวันนี้
                            for (let i = 7; i >= 1; i--) {
                                const date = new Date(today);
                                date.setDate(today.getDate() - i);
                                // แปลงวันที่เป็น YYYY-MM-DD (ค.ศ.) เพื่อใช้เป็น key ใน wyDailyRainMap
                                const dateKeyCE = date.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }); // "YYYY-MM-DD"
                                
                                const val = stationDailyRain[dateKeyCE];
                                extractedProjectRainValues.push(isNaN(parseFloat(val)) ? 0 : parseFloat(val));
                            }
                            // reverse เพื่อให้เก่าสุดอยู่ซ้ายสุด (วันที่เก่าสุด) ไปใหม่สุดอยู่ขวาสุด (วันที่ใกล้ปัจจุบัน)
                            values = extractedProjectRainValues
                        } else {
                            // ถ้าไม่พบข้อมูล rain_project ให้ใช้ค่า default (Array(14).fill(0))
                            values = newValues; 
                        }
                       } else if (row.type === "flow") {
                        // ดึงข้อมูลน้ำท่าจาก resFlowData
                        // ใช้ row.station_id (เช่น "E.91", "E.87") เพื่อจับคู่กับ stationcode ของ API น้ำท่า
                        const flowStationData = flowDataMap.get(row.station_id);

                        if (flowStationData) {
                            const extractedFlowValues: number[] = [];
                            const today = new Date();
                            // API flow มีวันที่เป็นคีย์ (จากตัวอย่างล่าสุด)
                            for (let i = 7; i >= 0; i--) { // ต้องการ 7 วัน (i=6 คือ 6 วันที่แล้ว, i=0 คือ วันนี้)
                                const date = new Date(today);
                                date.setDate(today.getDate() - i);
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                const dateKey = `${day}/${month}/${year}`;

                                const val = parseFloat(flowStationData[dateKey]);
                                extractedFlowValues.push(isNaN(val) ? 0 : val);
                            }
                            values = extractedFlowValues; // API flow ให้ข้อมูลตามลำดับอยู่แล้ว
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
        <Box sx={{ p: 2 }}>
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
                กรอกข้อมูลปริมาณน้ำฝน/น้ำท่าสำหรับแบบจำลอง
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
                            <TableCell sx={getCellStyle(rowIdx)}>{row.name}</TableCell>
                            {row.values.map((val, colIdx) => (
                                <TableCell key={colIdx} sx={getCellStyle(rowIdx)}>
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