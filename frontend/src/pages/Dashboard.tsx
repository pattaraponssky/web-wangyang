import React from "react";
import { Typography, Box, Grid } from "@mui/material";
import LongdoMap from "../components/Dashboard/MapComponent"; // นำเข้า LongdoMap
import DashboardCards from "../components/Dashboard/DashboardCards";
import LongProfileChart from "../components/Dashboard/LongProfileChart";
import WaterForecastChart from "../components/Dashboard/WaterForecastChart";
import FloodWarningTable from "../components/Dashboard/WarningTable";
import ImageComponent from "../components/Dashboard/ImageComponent";
import WaterGateTable from "../components/Dashboard/WaterGateTable";
import WaterLevelChart from "../components/Dashboard/WaterLevel";
import FloatingMenu from "../components/Dashboard/selectMenu";


const Dashboard: React.FC = () => {
  const mapKey = 'e75fee377b3d393b7a32576ce2b0229d'; // กำหนด Map API Key ของ Longdo


  // ดึงวันที่ปัจจุบันในรูปแบบที่ต้องการ
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('th-TH', {
    weekday: 'long', // แสดงวันในสัปดาห์ เช่น จันทร์
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });

  const JsonPaths = [
    "./data/River.geojson",
    "./data/ProjectArea.geojson",
    "./data/DamStation.geojson",
    "./data/HydroStation.geojson",
    "./data/RainStation.geojson",
    "./data/ProjectStation.geojson",
  ];

  const BoxStyle = {
    // maxWidth: "90%",
    margin: "auto",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: 3,
    marginBottom: "20px",
  }
  
  return (
    <div style={{ fontFamily: "Prompt" }}>
      <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt" ,color:"#28378B" }}>
        สรุปสถานการณ์น้ำประจำวันที่ <span style={{color:"#64b5f6"}}>{formattedDate}</span>
      </Typography>
      <Box sx={{ padding: "20px", maxWidth: "100%", margin: "auto", backgroundColor: "white", borderRadius: "10px", boxShadow: 3 ,marginBottom:"20px" }}
      id="map"
      >
        <Typography variant="h6" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt", color:"#28378B" }}>
          แผนที่ตำแหน่งสถานีที่สำคัญพื้นที่ศึกษาโครงการวังยาง
        </Typography>
        <LongdoMap
        id="longdo-map"
        mapKey={mapKey}
        JsonPaths={JsonPaths}// ส่งข้อมูล GeoJSON เข้าไป
      />
      
      </Box>
      <Box sx={{marginBlock:"20px"}}>
        <DashboardCards/>
      </Box>
      <Box sx={{...BoxStyle}} id="flood-warning">
        <FloodWarningTable/>
      </Box>
      <Box sx={{...BoxStyle,padding:"20px"}} id="forecast-chart" >
        <WaterForecastChart />
      </Box>
      <Box sx={BoxStyle} id="profile-chart">
        <LongProfileChart/>
      </Box>
      <Box id="water-level" sx={{...BoxStyle}} >
          <WaterLevelChart />
        </Box>
    
      <Box sx={BoxStyle} id="water-gate">
        <WaterGateTable/>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} sm={12}>
        <Box sx={BoxStyle} id="flood-map">
          <ImageComponent src="./images/map_flood.jpg" alt="" title={"แผนที่น้ำท่วมพื้นที่วังยาง"} />
        </Box>
        </Grid>
        <Grid item xs={12} md={6} sm={12} >
        <Box sx={BoxStyle} id="diagrams-map">
          <ImageComponent src="http://middlechi-omp.rid.go.th/main/wp-content/uploads/2025/04/4.%E0%B8%9C%E0%B8%B1%E0%B8%87%E0%B8%99%E0%B9%89%E0%B8%B3.jpg" fallbackSrc="./images/ผังน้ำชี.jpg" alt="แผนผังลุ่มแม่น้ำชี" title={"แผนผังลุ่มแม่น้ำชี"} />
        </Box>
        <Box sx={BoxStyle} id="report-chart">
          <ImageComponent src="http://middlechi-omp.rid.go.th/main/wp-content/uploads/2025/04/3.3-%E0%B8%81%E0%B8%A3%E0%B8%B2%E0%B8%9F%E0%B9%80%E0%B8%82%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%99%E0%B8%A7%E0%B8%B1%E0%B8%87%E0%B8%A2%E0%B8%B2%E0%B8%87_001.jpg" fallbackSrc="./images/กราฟเขื่อนวังยาง.jpg" height={'100%'} width={'89%'} alt="" title={"รายงานกราฟแสดงระดับน้ำเขื่อนวังยาง"} />
        </Box>
        </Grid>
      </Grid>
      <Box sx={BoxStyle} id="water-gate">
      <ImageComponent src="http://middlechi-omp.rid.go.th/main/wp-content/uploads/2025/04/3.3.1.jpg" fallbackSrc="./images/สรุปเขื่อนวังยาง.jpg" height={'100%'} width={'100%'} alt="" title={"รายงานระดับน้ำเขื่อนวังยาง"} />
      </Box>
      <FloatingMenu />
    </div>
  );
};

export default Dashboard;
 