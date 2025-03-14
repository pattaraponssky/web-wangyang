import React, { useState } from "react";
import { Button, Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";
import { BeachAccess, WaterDrop, Flood } from "@mui/icons-material";
import { API_URL } from "../../utility";
import axios from "axios";

const cardData = [
  { title: "ดาวน์โหลดกริดฝนพยากรณ์", icon: <BeachAccess />, url: `${API_URL}dowload_rain_grid.php` },
  { title: "สร้างไฟล์ input-hms.txt", icon: <WaterDrop />, url: `${API_URL}write_input_txt.php` },
  { title: "สร้างไฟล์ input-hms.dss", icon: <Flood />, url: `${API_URL}write_input_dss.php` },
];

const RunCreateText: React.FC = () => {
  const [messages, setMessages] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});

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

  return (
    <div>
       <Typography variant="h6" sx={{ padding: 2, fontWeight: "bold", fontFamily:"Prompt"}}>
        ขั้นตอนที่ 1 เตรียมข้อมูลน้ำฝน-น้ำท่า (Hec-Dss)
      </Typography>
    <Grid container spacing={3}>

      {cardData.map((card, index) => (
        <Grid item xs={12} key={index}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom sx={{fontFamily:"Prompt"}}>
               {card.icon} {card.title}
              </Typography>
              <Button
                  variant="contained"
                  color="primary"
                  sx={{ marginTop: 2, width: "100%" }}
                  onClick={() => handleRunPhpFile(index, card.url)}
                  disabled={loading[index]} // ป้องกันการกดซ้ำ
                >
                  {loading[index] ? <CircularProgress size={24} color="inherit" /> : "รันคำสั่ง"}
                </Button>

                <Typography variant="body1" sx={{ textAlign: "center", marginTop: 2, color: messages[index]?.includes("Error") ? "red" : "green" }}>
                  {messages[index]}
                </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </div>
  );
};

export default RunCreateText;
