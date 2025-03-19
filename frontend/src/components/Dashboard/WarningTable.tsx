import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from "@mui/material";

// ข้อมูลจากตาราง
const warningData = [
  { id: 1, location: "สะพานปากสาน", subdistrict: "แม่สำ", district: "ศรีสัชนาลัย", province: "สุโขทัย", capacity: 942.38, depth: 10.25, leftBank: 80.27, rightBank: 78.96, canalBottom: 68.71, watch: 76.91, alert: 77.93, crisis: 78.96, maxLevel3Days: 74.37 },
  { id: 2, location: "Y.14A", subdistrict: "แม่สำ", district: "ศรีสัชนาลัย", province: "สุโขทัย", capacity: 1781.69, depth: 12.77, leftBank: 77.81, rightBank: 75.60, canalBottom: 62.83, watch: 73.04, alert: 74.32, crisis: 75.60, maxLevel3Days: 67.63 },
  { id: 3, location: "Y.3A", subdistrict: "เมืองสวรรคโลก", district: "สวรรคโลก", province: "สุโขทัย", capacity: 1074.21, depth: 9.35, leftBank: 59.12, rightBank: 61.91, canalBottom: 49.77, watch: 57.25, alert: 58.18, crisis: 59.12, maxLevel3Days: 56.08 },
  { id: 4, location: "Y.33", subdistrict: "บางตาล", district: "ศรีสำโรง", province: "สุโขทัย", capacity: 637.56, depth: 12.65, leftBank: 56.43, rightBank: 56.36, canalBottom: 43.72, watch: 53.84, alert: 55.10, crisis: 56.36, maxLevel3Days: 52.37 },
  { id: 5, location: "สะพานพระร่วง", subdistrict: "ธานี", district: "เมืองสุโขทัย", province: "สุโขทัย", capacity: 598.26, depth: 7.92, leftBank: 48.97, rightBank: 49.57, canalBottom: 41.05, watch: 47.39, alert: 48.18, crisis: 48.97, maxLevel3Days: 48.89 },
  { id: 6, location: "Y.4", subdistrict: "ธานี", district: "เมืองสุโขทัย", province: "สุโขทัย", capacity: 444.22, depth: 9.12, leftBank: 51.57, rightBank: 51.48, canalBottom: 42.36, watch: 46.50, alert: 47.75, crisis: 48.70, maxLevel3Days: null },
];



const FloodWarningTable: React.FC = () => {
  const isSmallScreen = useMediaQuery("(max-width: 600px)"); // เช็คว่าหน้าจอเล็กไหม
  const isMediumScreen = useMediaQuery("(max-width: 900px)"); 
  

  const getCellStyle = (index: number) => ({
    border: "1px solid #ddd",
    backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
    textAlign: "center",
    fontFamily: "Prompt",
    wordWrap: "break-word", // ให้ตัดคำเมื่อข้อความยาวเกิน
    whiteSpace: "normal", // อนุญาตให้ขึ้นบรรทัดใหม่
    overflow: "hidden", 
    textOverflow: "ellipsis", // เพิ่ม ... เมื่อข้อความยาวเกิน
    fontSize: { xs: "0.6rem", sm: "0.7rem" , md: "0.8rem"},
    padding: isSmallScreen ? "4px" : "8px",
  });
  
  
  
  const cellHeaderStyle = {
    border: "1px solid #ddd",
    fontFamily: "Prompt",
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#F0F0F0",
    overflow: "hidden",
    textOverflow: "ellipsis", 
    fontSize: { xs: "0.7rem", sm: "0.8rem" , md: "0.9rem"},
    padding: isSmallScreen ? "4px" : "8px", // ลด padding บนมือถือ
  };
  return (
    <TableContainer
      sx={{
        // marginTop: 3,
        justifySelf: "center",
        maxWidth: "90vw",
        overflowX: "auto", // ให้ Scroll ได้ในมือถือ
        paddingBottom: 3,
        paddingTop: 2,
   
      }}
    >
      <Typography
        variant="h6"
        sx={{ paddingBottom: 2, fontWeight: "bold", fontFamily: "Prompt",color:"#28378B" ,textAlign: "center"}}
      >
       ตำแหน่งสำคัญ เกณฑ์การเฝ้าระวังและเตือนภัยพื้นที่ศึกษาโครงการวังยาง
      </Typography>
      <Table sx={{ minWidth: isSmallScreen ? 333 : 1000, tableLayout: "auto" }}>

        {/* หัวตาราง */}
        <TableHead sx={{clipPath: "none"}}>
          <TableRow>
            <TableCell sx={{...cellHeaderStyle }} rowSpan={2}>
              ลำดับ
            </TableCell>
            <TableCell sx={cellHeaderStyle} rowSpan={2}>
              ตำแหน่งเตือนภัย
            </TableCell>
            {!isSmallScreen && <TableCell sx={cellHeaderStyle} rowSpan={2}>ตำบล</TableCell>}
            {!isSmallScreen && !isMediumScreen && <TableCell sx={cellHeaderStyle} rowSpan={2}>อำเภอ</TableCell>}
            {!isSmallScreen && !isMediumScreen && <TableCell sx={cellHeaderStyle} rowSpan={2}>จังหวัด</TableCell>}
            <TableCell sx={{minWidth:"100px",...cellHeaderStyle}} rowSpan={2}>
              ความจุลำน้ำ<br/>(ลบ.ม./วินาที)
            </TableCell>
            <TableCell sx={{minWidth:"80px",...cellHeaderStyle}} rowSpan={2}>
              ความลึก<br/>(ม.)
            </TableCell>
            <TableCell sx={cellHeaderStyle} rowSpan={2}>
              ตลิ่งซ้าย<br/>(ม.รทก.)
            </TableCell>
            <TableCell sx={cellHeaderStyle} rowSpan={2}>
              ตลิ่งขวา<br/>(ม.รทก.)
            </TableCell>
            <TableCell sx={cellHeaderStyle} rowSpan={2}>
              ท้องคลอง<br/>(ม.รทก.)
            </TableCell>
            <TableCell sx={{...cellHeaderStyle }} colSpan={3}>
              เกณฑ์เฝ้าระวัง (ม.รทก.)
            </TableCell>
            <TableCell sx={{minWidth:"100px",...cellHeaderStyle}} rowSpan={2}>
              ระดับน้ำสูงสุด 3 วัน<br/>(ม.รทก.)
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontFamily: "Prompt", padding: "5px", fontWeight: "bold", textAlign: "center", backgroundColor: "#C6E0B4" }}>
              เฝ้าระวัง
            </TableCell>
            <TableCell sx={{ fontFamily: "Prompt", padding: "5px", fontWeight: "bold", textAlign: "center", backgroundColor: "#FFFF99" }}>
              เตือนภัย
            </TableCell>
            <TableCell sx={{ fontFamily: "Prompt", padding: "5px", fontWeight: "bold", textAlign: "center", backgroundColor: "#FF7C80" }}>
              วิกฤต
            </TableCell>
          </TableRow>
        </TableHead>

        {/* ข้อมูลในตาราง */}
        <TableBody>
          {warningData.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell sx={getCellStyle(index)}>{item.id}</TableCell>
              <TableCell sx={getCellStyle(index)}>{item.location}</TableCell>
              {!isSmallScreen && <TableCell sx={getCellStyle(index)}>{item.subdistrict}</TableCell>}
              {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.district}</TableCell>}
              {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.province}</TableCell>}
              <TableCell sx={getCellStyle(index)}>{item.capacity.toLocaleString()}</TableCell>
              <TableCell sx={getCellStyle(index)}>{item.depth}</TableCell>
              <TableCell sx={getCellStyle(index)}>{item.leftBank}</TableCell>
              <TableCell sx={getCellStyle(index)}>{item.rightBank}</TableCell>
              <TableCell sx={getCellStyle(index)}>{item.canalBottom}</TableCell>
              <TableCell sx={getCellStyle(index)}>{item.watch}</TableCell>
              <TableCell sx={getCellStyle(index)}>{item.alert}</TableCell>
              <TableCell sx={getCellStyle(index)}>{item.crisis}</TableCell>
              <TableCell sx={getCellStyle(index)}>{item.maxLevel3Days !== null ? item.maxLevel3Days : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FloodWarningTable;
