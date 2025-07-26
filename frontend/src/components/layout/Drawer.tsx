import React from "react";
import { Drawer, List, ListItem, ListItemText, Toolbar, Divider } from "@mui/material";
import { Link } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InfoIcon from "@mui/icons-material/Info";
import EqualizerIcon from '@mui/icons-material/Equalizer';
interface DrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DrawerComponent: React.FC<DrawerProps> = ({ open, setOpen }) => {
  // ฟังก์ชันสำหรับปิด Drawer เมื่อคลิกที่เมนู
  const handleItemClick = () => {
    setOpen(false);
  };

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      variant="temporary"
      anchor="left"
      sx={{
        zIndex: (theme) => theme.zIndex.appBar - 1,
        "& .MuiDrawer-paper": {
          width: "260px", // กำหนดขนาด Drawer
          backgroundColor: "#f8f9fa", // สีพื้นหลังแบบ Soft Gray
          color: "#333",
          boxShadow: "4px 0px 15px rgba(0, 0, 0, 0.2)", // เพิ่มเงาให้ดูหรูขึ้น
        },
      }}
    >
      <Toolbar />
      <List>
        {/* เมนูสำหรับ Dashboard */}
        <ListItem
          component={Link}
          to="/website/dashboard"
          onClick={handleItemClick}
          sx={{
            padding: "12px 20px",
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#e3f2fd" },
          }}
        >
          <DashboardIcon sx={{ marginRight: "15px", color: "#1976d2" }} />
          <ListItemText
            primary="สรุปสถานการณ์น้ำ"
            primaryTypographyProps={{
              sx: { fontSize: "1rem", fontWeight: 600, fontFamily: "Prompt, sans-serif" },
            }}
          />
        </ListItem>

        <Divider sx={{ margin: "0", backgroundColor: "rgba(0, 0, 0, 0.1)" }} />

        {/* เมนูสำหรับ HecRun */}     
        <ListItem
          component={Link}
          to="/website/hecrun"
          onClick={handleItemClick}
          sx={{
            padding: "12px 20px",
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#e3f2fd" },
          }}
        >
          <EqualizerIcon sx={{ marginRight: "15px", color: "#1976d2" }} />
          <ListItemText
            primary="Model"
            primaryTypographyProps={{
              sx: { fontSize: "1rem", fontWeight: 600, fontFamily: "Prompt" },
            }}
          />
        </ListItem>
        <Divider sx={{ margin: "0", backgroundColor: "rgba(0, 0, 0, 0.1)" }} />
        {/* เมนูสำหรับ About Us */}
        
        <ListItem
          component={Link}
          to="/website/aboutus"
          onClick={handleItemClick}
          sx={{
            padding: "12px 20px",
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#e3f2fd" },
          }}
        >
          <InfoIcon sx={{ marginRight: "15px", color: "#1976d2" }} />
          <ListItemText
            primary="About us"
            primaryTypographyProps={{
              sx: { fontSize: "1rem", fontWeight: 600, fontFamily: "Prompt" },
            }}
          />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default DrawerComponent;
