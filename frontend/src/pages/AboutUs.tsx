import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";

const AboutUs: React.FC = () => {
  return (
    <Box sx={{ padding: "20px", maxWidth: "100%", margin: "auto", backgroundColor: "white", borderRadius: "10px", boxShadow: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: "20px", fontFamily: "Prompt" }}>
        เกี่ยวกับเรา
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: "20px", fontFamily: "Prompt" }}>
        เว็บไซต์นี้ถูกพัฒนาขึ้นเพื่อช่วยให้คุณสามารถติดตามสถานการณ์น้ำและการบริหารจัดการน้ำได้อย่างมีประสิทธิภาพ  
        เรารวบรวมข้อมูลจากแหล่งที่เชื่อถือได้ เพื่อให้คุณได้รับข้อมูลที่ถูกต้องและอัปเดตอยู่เสมอ  
      </Typography>

      <Card sx={{ backgroundColor: "#f5f5f5", borderRadius: "10px", boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: "10px", fontFamily: "Prompt" }}>
            ช่องทางติดต่อ
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "Prompt" }}>
            📍 811 ถ.สามเสน แขวงถนนนครไชยศรี เขตดุสิต กรุงเทพมหานคร 10300
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "Prompt" }}>
            📞 เบอร์ติดต่อ: 02-241-0020 ถึง 29
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "Prompt" }}>
            🌐  www.rid.go.th
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AboutUs;
