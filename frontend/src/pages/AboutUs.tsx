import React from "react";
import { Box, Typography, Card, CardContent } from '@mui/material';
import ImageComponent from '../components/Dashboard/ImageComponent';
import GateTable from "../components/AboutUs/GateInfo";
import PumpStationTable from "../components/AboutUs/PumpStataion";

const AboutUs: React.FC = () => {
  return (
    <Box sx={{ padding: "20px", maxWidth: "100%", margin: "auto", backgroundColor: "white", borderRadius: "10px", boxShadow: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: "20px", fontFamily: "Prompt" }}>
        เกี่ยวกับเรา
      </Typography>

      <Typography variant="body1" sx={{ marginBottom: "20px", fontFamily: "Prompt" }}>
        เว็บไซต์นี้ถูกพัฒนาขึ้นเพื่อช่วยให้คุณสามารถติดตามสถานการณ์น้ำและการบริหารจัดการน้ำได้อย่างมีประสิทธิภาพ  
        เพิ่มประสิทธิภาพการควบคุมระยะไกล เพื่อการบริหารจัดการลุ่มน้ำชี เขื่อนระบาย 4 แห่ง โครงการส่งน้ำและบำรุงรักษาชีกลาง 
      </Typography>

      <ImageComponent src="./images/about_us/ประวัติ.jpg" width={'100%'} height={'auto'} alt="" title="ประวิติความเป็นมา"/>

      <Typography variant="h6" sx={{ marginTop: "20px",fontWeight: "bold", fontFamily: "Prompt" }}>
       ที่ตั้งหัวงานโครงการ
      </Typography>

      <Typography variant="body1" sx={{  fontFamily: "Prompt" }}>
        เขื่อนร้อยเอ็ด บ้านดอนวิเวก ต.พระธาตุ อ.เชียงขวัญ จ.ร้อยเอ็ด พิกัด 48 QTU 712879 ระวางที่ 5741 II พื้นที่ชลประทาน 166,573 ไร่ มีขอบเขตรับผิดชอบ แบ่งเป็น ฝ่ายส่งน้ำฯ ออกเป็น 4 ฝ่าย
      </Typography>
      <Box sx={{display:"flex" , flexDirection:{xs:'column',md:'row'}}}>
        <Box sx={{width:{xs:'100%',md:'50%'}}}>
          <ImageComponent src="./images/about_us/ข้อมูลทั่วไป.jpg" width={'100%'} height={'auto'} alt="" title=""/>
        </Box>
        <Box sx={{width:{xs:'100%',md:'50%'}}}>
          <ImageComponent src="./images/about_us/แผนที่.jpg" width={'100%'} height={'auto'} alt="" title=""/>
        </Box>
      </Box>
      <Box sx={{alignItems:"center"}} id="flood-warning">
        <GateTable/>
      </Box>
      <Box sx={{alignItems:"center"}} id="flood-warning">
       <PumpStationTable/>
      </Box>
      <GateTable/>


      <ImageComponent src="./images/about_us/ขอบเขตลุ่มน้ำ.png" width={'100%'} height={'auto'} alt="ขอบเขตลุ่มน้ำ" title="ขอบเขตลุ่มน้ำ"/>
      
      <Box sx={{display:"flex" , flexDirection:{xs:'column',md:'row'}}}>
        <Box sx={{width:{xs:'100%',md:'50%'}}}>
          <ImageComponent src="./images/about_us/แผนที่ตำแหน่งที่ตั้งสำคัญในลุ่มน้ำชี.png" width={'100%'} height={'auto'} alt="แผนที่ตำแหน่งที่ตั้งสำคัญในลุ่มน้ำชี" title="แผนที่ตำแหน่งที่ตั้งสำคัญในลุ่มน้ำชี"/>
        </Box>
        <Box sx={{width:{xs:'100%',md:'50%'}}}>
        <ImageComponent src="./images/about_us/สถานีตะกอน.png" width={'100%'} height={'auto'} alt="สถานีตะกอน" title="สถานีตะกอน"/>
        </Box>
      </Box>
      <Box sx={{display:"flex" , flexDirection:{xs:'column',md:'row'}}}>
        <Box sx={{width:{xs:'100%',md:'50%'}}}>
        <ImageComponent src="./images/about_us/สถานีน้ำฝน.png" width={'100%'} height={'auto'} alt="สถานีน้ำฝน" title="สถานีน้ำฝน"/>
        </Box>
        <Box sx={{width:{xs:'100%',md:'50%'}}}>
        <ImageComponent src="./images/about_us/สถานีน้ำท่า.png" width={'100%'} height={'auto'} alt="สถานีน้ำท่า" title="สถานีน้ำท่า"/>
        </Box>
      </Box>  
     
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
