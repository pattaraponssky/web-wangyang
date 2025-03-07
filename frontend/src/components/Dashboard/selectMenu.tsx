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
    const element = document.getElementById(id);
    if (element) {
      const offset = 70; // ระยะที่ต้องการเลื่อนขึ้นเพิ่ม
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    handleClose();
  };
  
  return (
    <>
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 20, right: 20 }}
        onClick={handleClick}
      >
        {anchorEl ? <ExpandLess /> : <ExpandMore />}
      </Fab>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleScrollTo("map")}>แผนที่ตำแหน่งสถานีสำคัญ</MenuItem>
        <MenuItem onClick={() => handleScrollTo("flood-warning")}>เกณฑ์การเฝ้าระวังและเตือนภัย</MenuItem>
        <MenuItem onClick={() => handleScrollTo("forecast-chart")}>ผลการพยากรณ์ปริมาณน้ำท่า</MenuItem>
        <MenuItem onClick={() => handleScrollTo("velocity-chart")}>ความเร็วการไหลของน้ำ</MenuItem>
        <MenuItem onClick={() => handleScrollTo("water-level")}>ภาพหน้าตัดลำน้ำ</MenuItem>
        <MenuItem onClick={() => handleScrollTo("profile-chart")}>รูปตัดตามยาวแม่น้ำ</MenuItem>
        <MenuItem onClick={() => handleScrollTo("water-gate")}>ข้อเสนอแนะการเปิด-ปิด ปตร.</MenuItem>
        <MenuItem onClick={() => handleScrollTo("flood-map")}>แผนที่น้ำท่วม</MenuItem>
      </Menu>
    </>
  );
};

export default FloatingMenu;
