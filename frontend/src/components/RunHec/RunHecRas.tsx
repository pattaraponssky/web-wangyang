import React, { useState } from "react";
import { Button, Card, CardContent, Typography, Grid } from "@mui/material";
import { BeachAccess, WaterDrop, Cloud, Flood } from "@mui/icons-material";
import axios from "axios"; 
import { API_URL } from "../../utility";

const cardData = [
  { title: "แก้ไขวันที่ช่วงพยากรณ์ (HEC-RAS)",icon: <BeachAccess />, url: `${API_URL}run/ras_change_date.php` },
  { title: "จำลองสถาณการณ์น้ำ (HEC-RAS)",icon: <WaterDrop />, url: `${API_URL}run/ras_compute.php` },
  { title: "ดึงข้อมูลโปรไฟล์ลำน้ำ",icon: <Cloud />, url: `${API_URL}run/ras_output_profiles.php` },
  { title: "ดึงข้อมูลอัตราการไหล",icon: <Flood />, url: `${API_URL}run/ras_output_flow.php` },
  { title: "ดึงข้อมูลประตูระบายน้ำ",icon: <WaterDrop />, url: `${API_URL}run/ras_output_gate.php` },
  { title: "รันสคริปต์ทั้งหมด (HEC-RAS)",icon: <Flood />, url: `${API_URL}run/ras_all.php` },
];

const RunHecRas: React.FC = () => {
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
        ขั้นตอนที่ 3 จำลองสถานการณ์น้ำ (HEC-RAS)
      </Typography>
    <Grid container spacing={3}>

      {cardData.map((card, index) => (
        <Grid item xs={12} sm={12} lg={4} key={index}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom sx={{fontFamily:"Prompt"}}>
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

export default RunHecRas;
