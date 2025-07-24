import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from "@mui/material";

// ข้อมูลจากตาราง (คงเดิม)
const warningData = [
  {
    id: 1, location: "E.91", district: "โกสุมพิสัย", province: "มหาสารคาม",
    depth: 14.30, leftBank: 152.29, rightBank: 152.25, canalBottom: 137.95,
    watch: 149.30, alert: 150.80, crisis: 152.20, maxLevel7Days: 140.74
  },
  {
    id: 2, location: "E.1", district: "โกสุมพิสัย", province: "มหาสารคาม",
    depth: 13.06, leftBank: 148.79, rightBank: 148.99, canalBottom: 135.73,
    watch: 146.10, alert: 147.40, crisis: 148.70, maxLevel7Days: ''
  },
  {
    id: 3, location: "E.8A", district: "เมือง", province: "มหาสารคาม",
    depth: 16.29, leftBank: 148.95, rightBank: 148.69, canalBottom: 132.40,
    watch: 145.40, alert: 147.00, crisis: 148.00, maxLevel7Days: ''
  },
  {
    id: 4, location: "WY", district: "ฆ้องชัย", province: "กาฬสินธุ์",
    depth: 10.80, leftBank: 142.00, rightBank: 142.00, canalBottom: 131.20,
    watch: 137.00, alert: 138.00, crisis: 139.00, maxLevel7Days: 137.31
  },
  {
    id: 5, location: "E.66A", district: "จังหาร", province: "ร้อยเอ็ด",
    depth: 14.50, leftBank: 141.53, rightBank: 143.46, canalBottom: 127.03,
    watch: 138.60, alert: 140.00, crisis: 141.50, maxLevel7Days: 131.40
  },
  {
    id: 6, location: "E.87", district: "กมลาไสย", province: "กาฬสินธุ์",
    depth: 10.46, leftBank: 139.95, rightBank: 139.98, canalBottom: 129.49,
    watch: 137.80, alert: 138.90, crisis: 139.90, maxLevel7Days: 132.13
  }
];

interface FloodWarningTableProps {
  maxLevels: Record<string, number>;
}

const FloodWarningTable: React.FC<FloodWarningTableProps> = ({ maxLevels }) => {
  const isSmallScreen = useMediaQuery("(max-width: 600px)"); // เช็คว่าหน้าจอเล็กไหม
  const isMediumScreen = useMediaQuery("(max-width: 900px)");

  // ปรับปรุง getCellStyle ให้รับค่าเพิ่มเติมสำหรับกำหนดสีพื้นหลัง
  const getCellStyle = (
    index: number,
    isMaxLevelCell: boolean = false, // เพิ่ม flag เพื่อระบุว่าเป็นช่อง maxLevels
    currentMaxLevel?: number, // ระดับน้ำสูงสุด 7 วัน
    watchLevel?: number, // เกณฑ์เฝ้าระวัง
    alertLevel?: number, // เกณฑ์เตือนภัย
    crisisLevel?: number // เกณฑ์วิกฤต
  ) => {
    let backgroundColor = index % 2 === 0 ? "#FAFAFA" : "#FFF"; // สีพื้นหลังเริ่มต้น

    if (isMaxLevelCell && currentMaxLevel !== undefined && currentMaxLevel !== null) {
      if (crisisLevel !== undefined && currentMaxLevel > crisisLevel) {
        backgroundColor = "#FF7C80"; // วิกฤต: แดง
      } else if (alertLevel !== undefined && currentMaxLevel > alertLevel) {
        backgroundColor = "#FFFF99"; // เตือนภัย: เหลือง
      } else if (watchLevel !== undefined && currentMaxLevel > watchLevel) {
        backgroundColor = "#C6E0B4"; // เฝ้าระวัง: เขียว
      }
      // ถ้าไม่เกินเกณฑ์ใดๆ หรือข้อมูลไม่ถูกต้อง ก็ใช้สีพื้นหลังปกติ (จาก index % 2)
    }

    return {
      border: "1px solid #ddd",
      backgroundColor: backgroundColor,
      textAlign: "center",
      fontFamily: "Prompt",
      wordWrap: "break-word",
      whiteSpace: "normal",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
      padding: isSmallScreen ? "4px" : "8px",
    };
  };

  const cellHeaderStyle = {
    border: "1px solid #ddd",
    fontFamily: "Prompt",
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#F0F0F0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
    padding: isSmallScreen ? "4px" : "8px", // ลด padding บนมือถือ
  };

  return (
    <TableContainer
      sx={{
        justifySelf: "center",
        maxWidth: "90vw",
        overflowX: "auto", // ให้ Scroll ได้ในมือถือ
        paddingBottom: 3,
        paddingTop: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{ paddingBottom: 2, fontWeight: "bold", fontFamily: "Prompt", color: "#28378B" }}
      >
        ตำแหน่งสำคัญ เกณฑ์การเฝ้าระวังและเตือนภัยพื้นที่ศึกษาโครงการวังยาง
      </Typography>
      <Table sx={{ minWidth: isSmallScreen ? 333 : 1000, tableLayout: "auto" }}>
        {/* หัวตาราง */}
        <TableHead sx={{ clipPath: "none" }}>
          <TableRow>
            <TableCell sx={{ ...cellHeaderStyle }} rowSpan={2}>
              ลำดับ
            </TableCell>
            <TableCell sx={cellHeaderStyle} rowSpan={2}>
              ตำแหน่งเตือนภัย
            </TableCell>
            {!isSmallScreen && !isMediumScreen && <TableCell sx={cellHeaderStyle} rowSpan={2}>อำเภอ</TableCell>}
            {!isSmallScreen && !isMediumScreen && <TableCell sx={cellHeaderStyle} rowSpan={2}>จังหวัด</TableCell>}

            <TableCell sx={{ minWidth: "80px", ...cellHeaderStyle }} rowSpan={2}>
              ความลึก<br />(ม.)
            </TableCell>
            <TableCell sx={cellHeaderStyle} rowSpan={2}>
              ตลิ่งซ้าย<br />(ม.รทก.)
            </TableCell>
            <TableCell sx={cellHeaderStyle} rowSpan={2}>
              ตลิ่งขวา<br />(ม.รทก.)
            </TableCell>
            <TableCell sx={cellHeaderStyle} rowSpan={2}>
              ท้องคลอง<br />(ม.รทก.)
            </TableCell>
            <TableCell sx={{ ...cellHeaderStyle }} colSpan={3}>
              เกณฑ์เฝ้าระวัง (ม.รทก.)
            </TableCell>
            <TableCell sx={{ minWidth: "100px", ...cellHeaderStyle }} rowSpan={2}>
              ระดับน้ำสูงสุด 7 วัน<br />(ม.รทก.)
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
          {warningData.map((item, index) => {
            const currentMaxLevel = maxLevels[item.location]; // ดึงค่าระดับน้ำสูงสุด 7 วันสำหรับตำแหน่งปัจจุบัน

            return (
              <TableRow key={item.id}>
                <TableCell sx={getCellStyle(index)}>{item.id}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.location}</TableCell>
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.district}</TableCell>}
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.province}</TableCell>}
                <TableCell sx={getCellStyle(index)}>{item.depth.toFixed(2)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.leftBank.toFixed(2)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.rightBank.toFixed(2)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.canalBottom.toFixed(2)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.watch.toFixed(2)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.alert.toFixed(2)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.crisis.toFixed(2)}</TableCell>
                <TableCell
                  sx={getCellStyle(
                    index,
                    true, // ตั้งเป็น true เพื่อให้ getCellStyle รู้ว่าเป็นช่อง maxLevels
                    currentMaxLevel,
                    item.watch,
                    item.alert,
                    item.crisis
                  )}
                >
                  {currentMaxLevel != null ? currentMaxLevel.toFixed(2) : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FloodWarningTable;