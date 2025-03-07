import React from "react";
import { Typography, Box, Grid } from "@mui/material";
import LongdoMap from "../components/Dashboard/MapComponent"; // นำเข้า LongdoMap
import DashboardCards from "../components/Dashboard/DashboardCards";
import LongProfileChart from "../components/Dashboard/LongProfileChart";
import WaterForecastChart from "../components/Dashboard/WaterForecastChart";
import FloodWarningTable from "../components/Dashboard/WarningTable";
import ImageComponent from "../components/Dashboard/ImageComponent";
import WaterGateTable from "../components/Dashboard/WaterGateTable";
// import RunCreateText from "../components/Dashboard/RunCreateText";
// import RunHecHms from "../components/Dashboard/RunHecHms";
// import RunHecRas from "../components/Dashboard/RunHecRas";
import WaterLevelChart from "../components/Dashboard/WaterLevel";
import FloatingMenu from "../components/Dashboard/selectMenu";
import VelocLineChart from "../components/Dashboard/VelocChart";

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

  const geoJsonPaths = [
    "./data/Reservoir.geojson", 
    "./data/Rain_Station.geojson",
    "./data/Level_Station.geojson",  
    "./data/Regulator.geojson", 
  ];

  const BoxStyle = {
    // padding: "20px",
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
          แผนที่ตำแหน่งสถานีที่สำคัญลุ่มน้ำชี
        </Typography>
        <LongdoMap
        id="longdo-map"
        mapKey={mapKey}
        geoJsonPaths={geoJsonPaths}// ส่งข้อมูล GeoJSON เข้าไป
      />
      
      </Box>
      <Box sx={{marginBlock:"20px"}}>
        <DashboardCards/>
      </Box>
      {/* <Box sx={BoxStyle}}>
        <RunCreateText />
      </Box>
      <Box sx={BoxStyle}>
        <RunHecHms />
      </Box>
      <Box sx={BoxStyle}}>
        <RunHecRas />
      </Box> */}
      <Box sx={BoxStyle} id="flood-warning">
        <FloodWarningTable/>
      </Box>
      <Box sx={{...BoxStyle,padding:"20px"}} id="forecast-chart" >
        <WaterForecastChart />
      </Box>
      <Box sx={BoxStyle} id="profile-chart">
        <LongProfileChart/>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} sm={12}>
          <Box id="water-level" sx={{...BoxStyle,height: {
            xs: "auto",  // สำหรับขนาดจอเล็ก
            sm: "auto",  // สำหรับขนาดจอปานกลาง
            md: "60vh",  // สำหรับขนาดจอใหญ่
          }}} >
          <WaterLevelChart />
          </Box>
        </Grid>
        <Grid item xs={12} md={6} sm={12} >
          <Box id="velocity-chart" sx={BoxStyle}>
            <VelocLineChart />
          </Box>
        </Grid>
      </Grid>
      <Box sx={BoxStyle} id="water-gate">
        <WaterGateTable/>
      </Box>
      <Box sx={BoxStyle} id="flood-map">
        <ImageComponent src="./images/map_flood.jpg" alt="" title={"แผนที่น้ำท่วม"} />
      </Box>
      <FloatingMenu />
    </div>
  );
};

export default Dashboard;
 