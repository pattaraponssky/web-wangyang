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
    }, 200); // รอให้เมนูปิดก่อนค่อยเลื่อน
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
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => handleScrollTo("map")}>แผนที่ตำแหน่งสถานีสำคัญ</MenuItem>
        <MenuItem onClick={() => handleScrollTo("flood-warning")}>เกณฑ์การเฝ้าระวังและเตือนภัย</MenuItem>
        <MenuItem onClick={() => handleScrollTo("forecast-chart")}>ผลการพยากรณ์ปริมาณน้ำท่า</MenuItem>
        <MenuItem onClick={() => handleScrollTo("profile-chart")}>รูปตัดตามยาวแม่น้ำ</MenuItem>
        <MenuItem onClick={() => handleScrollTo("water-level")}>ระดับน้ำแต่ละสถานี</MenuItem>
        <MenuItem onClick={() => handleScrollTo("velocity-chart")}>ความเร็วการไหลของน้ำ</MenuItem>
        <MenuItem onClick={() => handleScrollTo("water-gate")}>ข้อเสนอแนะการเปิด-ปิด ปตร.</MenuItem>
        <MenuItem onClick={() => handleScrollTo("flood-map")}>แผนที่น้ำท่วม</MenuItem>
        <MenuItem onClick={() => handleScrollTo("diagrams-map")}>แผนผังลุ่มแม่น้ำชี</MenuItem>
        <MenuItem onClick={() => handleScrollTo("report-chart")}>รายงานกราฟแสดงระดับน้ำ</MenuItem>
      </Menu>
    </>
  );
};

export default FloatingMenu;
