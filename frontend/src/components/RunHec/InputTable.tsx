import { useState } from "react";
// import { useState, useEffect } from "react";
import {
  Table, TableHead, TableBody, TableCell, TableRow,
  TextField, Button, Paper, Typography,
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
  { station_id: "5", name: "สชป.6", type: "rain", values: Array(14).fill(0) },
  { station_id: "10", name: "E.6C", type: "rain", values: Array(14).fill(0) },
  { station_id: "14", name: "อ่างฯห้วยสามพาด", type: "rain", values: Array(14).fill(0) },
  { station_id: "16", name: "อ่างฯห้วยสังเคียบ", type: "rain", values: Array(14).fill(0) },
  { station_id: "WY.01", name: "สถานีชีกลาง", type: "rain", values: Array(14).fill(0) },
  { station_id: "WY.02", name: "สถานีวังยาง", type: "rain", values: Array(14).fill(0) },
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
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "1rem" },
};

const getCellStyle = (index: number) => ({
  padding: "5px",
  backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "1rem" },
});

export default function RainInputTable() {
    const [rows, setRows] = useState(defaultRows);
    const [messages, setMessages] = useState<{ [key: number]: string }>({});
    const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
//   const [loading, setLoading] = useState(true);
const cardData = [
    { title: "ดาวน์โหลดกริดฝนพยากรณ์ (กรมอุตุนิยมวิทยา)", icon: <BeachAccess />, url: `${API_URL}dowload_rain_grid.php` },
    { title: "สร้างไฟล์ input-hms.txt อัตโนมัติ", icon: <WaterDrop />, url: `${API_URL}write_input_txt.php` },
    { title: "สร้างไฟล์ input-hms.dss", icon: <Flood />, url: `${API_URL}write_input_dss.php` },
];

const handleRunPhpFile = async (index: number, url: string) => {
setLoading((prev) => ({ ...prev, [index]: true })); // เริ่มโหลด

try {
    const response = await axios.post(url);

    if (response.data.error) {
    setMessages((prev) => ({ ...prev, [index]: "❌ Run Error" }));
    } else {
    setMessages((prev) => ({ ...prev, [index]: "✅ Run Success" }));
    }
} catch (error) {
    setMessages((prev) => ({ ...prev, [index]: "❌ Error executing PHP script: " + error }));
} finally {
    setLoading((prev) => ({ ...prev, [index]: false })); // หยุดโหลด
}
};

  const generateDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = -6; i <= 7; i++) {
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
    fetch(`${API_URL}write_input_manual.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: rows }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ สร้างไฟล์ input-hms.txt สำเร็จ:", data);
        alert("คำนวณสำเร็จ");
      });
  };

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const [res1, res2, res3] = await Promise.all([
//           fetch(`${API_URL}input_hms.php`).then(res => res.json()),
//           fetch(`${API_URL}filter_rain_grid_api.php`).then(res => res.json()),
//           fetch("http://localhost/wangyang/API/api_flow_hydro3_8day.php").then(res => res.json()),
//         ]);

//         const newRows = defaultRows.map(row => {
//           let values = [...row.values];

//           if (row.type === "rain") {
//             const data = res1[row.station_id] || res2[row.station_id];
//             if (Array.isArray(data)) {
//               values = data.map((v: any) => parseFloat(v) || 0).slice(0, 14);
//             }
//           } else if (row.type === "flow") {
//             const data = res3[row.station_id];
//             if (Array.isArray(data)) {
//               values = data.map((v: any) => parseFloat(v) || 0).slice(0, 7);
//             }
//           }

//           return { ...row, values };
//         });

//         setRows(newRows);
//         setLoading(false);
//       } catch (err) {
//         console.error("❌ ดึงข้อมูลจาก API ล้มเหลว:", err);
//       }
//     };

//     loadData();
//   }, []);

//   if (loading) {
//     return <Typography sx={{ fontFamily: "Prompt", mt: 2 }}><CircularProgress /> กำลังโหลดข้อมูล...</Typography>;
//   }

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
                    color="primary"
                    sx={{ marginTop: 2, width: "100%" }}
                    onClick={() => handleRunPhpFile(index, card.url)}
                    disabled={loading[index]}
                >
                    {loading[index] ? (
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
       <Button variant="contained" color="success" onClick={() => handleRunPhpFile(3, cardData[2].url)} sx={{ mt: 2,mx: 2, fontFamily: "Prompt" }}>
        แปลงไฟล์ input-hms.txt เป็น input-hms.dss
      </Button>
    </Box>
  );
}
