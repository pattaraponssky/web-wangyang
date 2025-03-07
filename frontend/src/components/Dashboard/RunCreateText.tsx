import React, { useState } from "react";
import { Button, Card, CardContent, Typography, Grid } from "@mui/material";
import { BeachAccess, WaterDrop, Cloud, Flood } from "@mui/icons-material";
import axios from "axios"; 

const cardData = [
  { title: "ดาวน์โหลดไฟล์กริดฝน", icon: <BeachAccess />, url: "http://localhost/code-xampp/sukhothai/dowload_rain_grid.php" },
  { title: "สร้าง input-hms.txt",icon: <WaterDrop />, url: "http://localhost/code-xampp/sukhothai/write_input_txt.php" },
  { title: "...",icon: <Cloud />, url: "http://localhost/code-xampp/sukhothai/write_output_txt.php" },
  { title: "รันทั้งหมด",icon: <Flood />, url: "http://localhost/txt_run_all.php" },
];

const RunCreateText: React.FC = () => {
  const [messages, setMessages] = useState<{ [key: number]: string }>({});

  // ฟังก์ชันรันไฟล์ PHP ตาม URL ของแต่ละ Card
  const handleRunPhpFile = async (index: number, url: string) => {
    try {
      const response = await axios.post(url);

      // ตรวจสอบผลลัพธ์ที่ได้รับจาก PHP
      if (response.data.error) {
        setMessages((prev) => ({ ...prev, [index]: "❌ Run Script Error "}));
        // setMessages((prev) => ({ ...prev, [index]: "❌ Error: " + response.data.error }));
      } else {
        setMessages((prev) => ({ ...prev, [index]: "✅ Run Script Success "}));
        // setMessages((prev) => ({ ...prev, [index]: "✅ Success: " + response.data.message }));
      }
    } catch (error) {
      setMessages((prev) => ({ ...prev, [index]: "❌ Error executing PHP script: " + error }));
    }
  };

  return (
  <div>
       <Typography variant="h6" sx={{ padding: 2, fontWeight: "bold",fontFamily:"Prompt"}}>
        ขั้นตอนที่ 1 เตรียมข้อมูลน้ำฝนและน้ำท่า
      </Typography>
    <Grid container spacing={3}>

      {cardData.map((card, index) => (
        <Grid item xs={12} sm={6} lg={3} key={index}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
               {card.icon} {card.title}
              </Typography>
            
              <Button
                variant="contained"
                color="primary"
                sx={{ marginTop: 2,width:"100%" }}
                onClick={() => handleRunPhpFile(index, card.url)}
                >
                รันคำสั่ง
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

export default RunCreateText;
