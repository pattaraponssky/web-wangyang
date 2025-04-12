import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from "@mui/material";

const damData = [
  {
    name: "เขื่อนชนบท",
    subDistrict: "โนนพระยอม",
    district: "ชนบท",
    province: "ขอนแก่น",
    width: 10.0,
    height: 8.6,
    gateCount: 6,
    capacity: 16,
    benefitArea: 9631
  },
  {
    name: "เขื่อนมหาสารคาม",
    subDistrict: "หนองบัว",
    district: "โกสุมพิสัย",
    province: "มหาสารคาม",
    width: 12.0,
    height: 7.0,
    gateCount: 6,
    capacity: 24,
    benefitArea: 21300
  },
  {
    name: "เขื่อนวังยาง",
    subDistrict: "ลำชี",
    district: "ฆ้องชัย",
    province: "กาฬสินธุ์",
    width: 12.5,
    height: 6.6,
    gateCount: 6,
    capacity: 34,
    benefitArea: 21230
  },
  {
    name: "เขื่อนร้อยเอ็ด",
    subDistrict: "พระธาตุ",
    district: "บ.เชียงขวัญ",
    province: "ร้อยเอ็ด",
    width: 12.5,
    height: 6.0,
    gateCount: 6,
    capacity: 16,
    benefitArea: 79443
  }
];

const GateTable: React.FC = () => {
  const isSmallScreen = useMediaQuery("(max-width: 600px)");

  const cellStyle = (index: number) => ({
    border: "1px solid #ddd",
    backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
    textAlign: "center",
    fontFamily: "Prompt",
    fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
    padding: isSmallScreen ? "4px" : "8px",
    whiteSpace: "normal",
    wordWrap: "break-word"
  });

  const headerStyle = {
    border: "1px solid #ddd",
    backgroundColor: "#F0F0F0",
    fontWeight: "bold",
    fontFamily: "Prompt",
    textAlign: "center",
    fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
    padding: isSmallScreen ? "4px" : "8px",
  };

  return (
    <TableContainer
        sx={{
            maxWidth: "90vw",
            margin: "0 auto", // ✅ จัดกึ่งกลางแนวนอน
            overflowX: "auto",
            paddingY: 3
        }}
        >
      <Typography
        variant="h6"
        sx={{ fontWeight: "bold", fontFamily: "Prompt", color: "#28378B", textAlign: "center", paddingBottom: 2 }}
      >
        รายละเอียดประตูระบายน้ำในพื้นที่โครงการ
      </Typography>
      <Table sx={{ minWidth: isSmallScreen ? 500 : 1000 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerStyle} rowSpan={2}>ชื่อเขื่อน</TableCell>
            <TableCell sx={headerStyle} colSpan={3}>ที่ตั้ง</TableCell>
            <TableCell sx={headerStyle} colSpan={3}>ขนาดเขื่อน</TableCell>
            <TableCell sx={headerStyle} rowSpan={2}>ความจุเขื่อน<br />(ล้าน ลบ.ม.)</TableCell>
            <TableCell sx={headerStyle} rowSpan={2}>พื้นที่รับประโยชน์<br />(ไร่)</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={headerStyle}>ตำบล</TableCell>
            <TableCell sx={headerStyle}>อำเภอ</TableCell>
            <TableCell sx={headerStyle}>จังหวัด</TableCell>
            <TableCell sx={headerStyle}>กว้าง<br />(ม.)</TableCell>
            <TableCell sx={headerStyle}>สูง<br />(ม.)</TableCell>
            <TableCell sx={headerStyle}>จำนวน<br />(บาน)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {damData.map((dam, index) => (
            <TableRow key={dam.name}>
              <TableCell sx={cellStyle(index)}>{dam.name}</TableCell>
              <TableCell sx={cellStyle(index)}>{dam.subDistrict}</TableCell>
              <TableCell sx={cellStyle(index)}>{dam.district}</TableCell>
              <TableCell sx={cellStyle(index)}>{dam.province}</TableCell>
              <TableCell sx={cellStyle(index)}>{dam.width.toFixed(2)}</TableCell>
              <TableCell sx={cellStyle(index)}>{dam.height.toFixed(2)}</TableCell>
              <TableCell sx={cellStyle(index)}>{dam.gateCount}</TableCell>
              <TableCell sx={cellStyle(index)}>{dam.capacity}</TableCell>
              <TableCell sx={cellStyle(index)}>{dam.benefitArea.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GateTable;
