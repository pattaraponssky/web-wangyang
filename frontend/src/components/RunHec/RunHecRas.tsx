import React, { useState } from "react";
import { Button, Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";
import { BeachAccess, WaterDrop, Cloud, Flood } from "@mui/icons-material";
import axios from "axios"; 
import { API_URL } from "../../utility";

const cardData = [
  { title: "แก้ไขวันที่ช่วงพยากรณ์ (HEC-RAS)", color: "#1976d2", icon: <BeachAccess />, url: `${API_URL}hec_api/ras_change_date.php` },
  { title: "จำลองสถาณการณ์น้ำ (HEC-RAS)", color: "#1976d2", icon: <WaterDrop />, url: `${API_URL}hec_api/ras_compute.php` },
  { title: "ดึงข้อมูลโปรไฟล์ลำน้ำ", color: "#1976d2", icon: <Cloud />, url: `${API_URL}hec_api/ras_output_profiles.php` },
  { title: "ดึงข้อมูลอัตราการไหล", color: "#1976d2", icon: <Flood />, url: `${API_URL}hec_api/ras_output_flow.php` },
  { title: "ดึงข้อมูลประตูระบายน้ำ", color: "#1976d2", icon: <WaterDrop />, url: `${API_URL}hec_api/ras_output_gate.php` },
  { title: "รันสคริปต์ทั้งหมด (HEC-RAS)", color: "#2e7d32", icon: <Flood />, url: `${API_URL}hec_api/ras_all.php` },
];

const RunHecRas: React.FC = () => {
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
    } finally {
      setLoading((prev) => ({ ...prev, [index]: false })); // หยุดโหลด
    }
  };

  return (
  <div>
       <Typography variant="h6" sx={{ padding: 1, fontWeight: "bold",fontFamily:"Prompt"}}>
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
                sx={{ marginTop: 2,width:"100%" , backgroundColor: card.color}}
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

export default RunHecRas;
