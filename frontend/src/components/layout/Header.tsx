import React from "react";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

interface HeaderProps {
  setOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setOpen }) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)", // ไล่สีจากน้ำเงินเข้มไปอ่อน
        height: "64px", // ความสูงของ AppBar
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center", // จัดให้ตรงกลาง
          padding: "0 16px", // เพิ่มระยะห่างซ้ายขวาของ Toolbar
        }}
      >
        {/* ไอคอนเมนู */}
        <MenuIcon
          onClick={() => setOpen(true)}
          sx={{
            fontSize: "2rem", // ขนาดของไอคอน
            color: "#fff", // สีของไอคอน
            cursor: "pointer", // เปลี่ยนเคอร์เซอร์เมื่อ Hover
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)", // สีพื้นหลังเมื่อ hover
              borderRadius: "50%", // ทำให้เป็นรูปวงกลมเมื่อ hover
              padding: "4px", // เพิ่ม padding เมื่อ hover
            },
          }}
        />

        {/* ชื่อระบบ */}
        <Typography
          variant="h6"
          sx={{
            paddingLeft: "1rem", // ระยะห่างจากขอบซ้าย
            fontWeight: 600, // น้ำหนักฟอนต์
            color: "#fff", // สีของข้อความ
            fontSize: "1.25rem",
            fontFamily: "Prompt",
          }}
        >
          ระบบพยากรณ์ระดับน้ำวังยาง
        </Typography>

        {/* โลโก้ที่มุมขวา */}
        <Box sx={{ marginLeft: "auto" }}>
          <img
            // src="../images/logo_rid.png" // เปลี่ยนเป็นโลโก้ของคุณ
            src="./images/logo_rid.png" 
            alt="Logo"
            style={{ height: "50px" }} // ปรับขนาดโลโก้ตามต้องการ
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
