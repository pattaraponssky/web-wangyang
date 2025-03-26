import React, { useState } from "react";
import { Fab, Menu, MenuItem } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

const FloatingMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleScrollTo = (id: string) => {
    handleClose(); // ปิดเมนูก่อนที่จะเลื่อน
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100); // รอให้เมนูปิดก่อนค่อยเลื่อน
  };

  return (
    <>
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}
        onClick={handleClick}
      >
        {anchorEl ? <ExpandLess /> : <ExpandMore />}
      </Fab>
      <Menu  anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem sx={{fontFamily:"Prompt"}} onClick={() => handleScrollTo("map")}>แผนที่ตำแหน่งสถานีสำคัญ</MenuItem>
        <MenuItem sx={{fontFamily:"Prompt"}} onClick={() => handleScrollTo("flood-warning")}>เกณฑ์การเฝ้าระวังและเตือนภัย</MenuItem>
        <MenuItem sx={{fontFamily:"Prompt"}} onClick={() => handleScrollTo("forecast-chart")}>ผลการพยากรณ์ปริมาณน้ำท่า</MenuItem>
        <MenuItem sx={{fontFamily:"Prompt"}} onClick={() => handleScrollTo("profile-chart")}>รูปตัดตามยาวแม่น้ำ</MenuItem>
        <MenuItem sx={{fontFamily:"Prompt"}} onClick={() => handleScrollTo("water-level")}>ระดับน้ำแต่ละสถานี</MenuItem>
        <MenuItem sx={{fontFamily:"Prompt"}} onClick={() => handleScrollTo("water-gate")}>ข้อเสนอแนะการเปิด-ปิด ปตร.</MenuItem>
        <MenuItem sx={{fontFamily:"Prompt"}} onClick={() => handleScrollTo("flood-map")}>แผนที่น้ำท่วม</MenuItem>
        <MenuItem sx={{fontFamily:"Prompt"}} onClick={() => handleScrollTo("diagrams-map")}>แผนผังลุ่มแม่น้ำชี</MenuItem>
        <MenuItem sx={{fontFamily:"Prompt"}} onClick={() => handleScrollTo("report-chart")}>รายงานกราฟแสดงระดับน้ำ</MenuItem>
      </Menu>
    </>
  );
};

export default FloatingMenu;
