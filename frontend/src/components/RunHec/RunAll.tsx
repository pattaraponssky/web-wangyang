import React, { useState } from "react";
import { Button, Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";
import { Flood, } from "@mui/icons-material";
import axios from "axios"; 
import { API_URL } from "../../utility";

const cardData = [
  { title: "รันสคริปต์การทำงานทั้งหมด (Run All Model)", color: "#2e7d32", icon: <Flood />, url: `${API_URL}hec_api/run_all.php` },
];

const RunAll: React.FC = () => {
  const [messages, setMessages] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  // ฟังก์ชันรันไฟล์ PHP ตาม URL ของแต่ละ Card
  const handleRunPhpFile = async (index: number, url: string) => {
    setLoading((prev) => ({ ...prev, [index]: true })); // เริ่มโหลด
    try {
      const response = await axios.post(url);

      // ตรวจสอบผลลัพธ์ที่ได้รับจาก PHP
      if (response.data.error) {
        setMessages((prev) => ({ ...prev, [index]: "❌ Run Script Error "}));
        // setMessages((prev) => ({ ...prev, [index]: "❌ Error: " + response.data.error }));
      } else {
        setMessages((prev) => ({ ...prev, [index]: "✅ Run Success"}));
        // setMessages((prev) => ({ ...prev, [index]: "✅ Success: " + response.data.message }));
      }
    } catch (error) {
      setMessages((prev) => ({ ...prev, [index]: "❌ Error executing PHP script: " + error }));
    }finally {
      setLoading((prev) => ({ ...prev, [index]: false })); // หยุดโหลด
    }
  };

  return (
  <div>
       <Typography variant="h5" sx={{ padding: 1, fontWeight: "bold",fontFamily:"Prompt"}}>
        ทำงานจำลองโมเดลทั้งหมด (Run All Model)
      </Typography>
    <Grid container spacing={3}>

      {cardData.map((card, index) => (
         <Grid item xs={12} sm={12} lg={12} key={index}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom sx={{fontFamily:"Prompt"}}>
               {card.icon} {card.title}
              </Typography>
              <Button
                variant="contained"
                sx={{ marginTop: 2,width:"100%", backgroundColor: card.color }}
                onClick={() => handleRunPhpFile(index, card.url)}
                disabled={loading[index]} 
                >
                {loading[index] ? <CircularProgress size={24} color="inherit" /> : "รันคำสั่ง"}
              </Button>
              <Typography variant="body1" sx={{ textAlign:"center",marginTop: 2, color: messages[index]?.includes("Error") ? "red" : "green" }}>
                {messages[index]} {/* แสดงข้อความผลลัพธ์แยกแต่ละ Card */}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </div>
  );
};

export default RunAll;
