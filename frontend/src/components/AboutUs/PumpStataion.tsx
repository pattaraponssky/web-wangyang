import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery
} from "@mui/material";

const pumpStationData = [
  {
    dam: "เขื่อนชนบท",
    stations: [
      { name: "สถานีสูบน้ำ P1 ชนบท", pumpType: "Horizontal Split Case.", sizes: ["0.475"], counts: [2] },
      { name: "สถานีสูบน้ำบ้านหนองผือ", pumpType: "Horizontal Split Case.", sizes: ["0.475"], counts: [3] },
      { name: "สถานีสูบน้ำบ้านโพธิ์ไชย", pumpType: "Horizontal Split Case.", sizes: ["0.40", "0.30"], counts: [5, 1] },
      { name: "สถานีสูบน้ำบ้านหนองสีหนาท", pumpType: "Vertical Split Case.", sizes: ["0.30"], counts: [4] }
    ]
  },
  {
    dam: "เขื่อนมหาสารคาม",
    stations: [
      { name: "สถานีสูบน้ำ P1", pumpType: "Vertical Mixed Flow.", sizes: ["3.00"], counts: [2] },
      { name: "สถานีสูบน้ำ P2", pumpType: "Vertical Mixed Flow.", sizes: ["0.40"], counts: [2] }
    ]
  },
  {
    dam: "เขื่อนวังยาง",
    stations: [
      { name: "สถานีสูบน้ำเขื่อนวังยาง", pumpType: "Vertical Mixed Flow.", sizes: ["3.00"], counts: [4] },
      { name: "สถานีสูบน้ำบ้านหนองตอ", pumpType: "Horizontal Split Case.", sizes: ["0.30"], counts: [1] }
    ]
  },
  {
    dam: "เขื่อนร้อยเอ็ด",
    stations: [
      { name: "สถานีสูบน้ำเขื่อนร้อยเอ็ด", pumpType: "Vertical Mixed Flow.", sizes: ["1.65", "0.65"], counts: [3, 2] },
      { name: "สถานีสูบน้ำพนมไพร", pumpType: "Vertical Mixed Flow.", sizes: ["1.60", "0.60"], counts: [2, 2] },
      { name: "สถานีสูบน้ำ MP พนมไพร", pumpType: "Horizontal Split Case.", sizes: ["0.30"], counts: [1] }
    ]
  }
];

const PumpStationTable: React.FC = () => {
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
    padding: isSmallScreen ? "4px" : "8px"
  };

  let rowIndex = 0;

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
        sx={{
          fontWeight: "bold",
          fontFamily: "Prompt",
          color: "#28378B",
          textAlign: "center",
          paddingBottom: 2
        }}
      >
        รายละเอียดสถานีสูบน้ำในพื้นที่โครงการ
      </Typography>
      <Table sx={{ minWidth: isSmallScreen ? 500 : 1000 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerStyle} rowSpan={2}>
              ชื่อเขื่อน/สถานีสูบน้ำ
            </TableCell>
            <TableCell sx={headerStyle} rowSpan={2}>
              ชื่อปั๊ม
            </TableCell>
            <TableCell sx={headerStyle} colSpan={2}>
              ขนาดเครื่องสูบน้ำ
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={headerStyle}>ขนาด (cms.)</TableCell>
            <TableCell sx={headerStyle}>จำนวน (เครื่อง)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pumpStationData.map((dam) => (
            <React.Fragment key={dam.dam}>
              <TableRow>
                <TableCell
                  colSpan={4}
                  sx={{
                    backgroundColor: "#DDEBF7",
                    fontWeight: "bold",
                    fontFamily: "Prompt",
                    textAlign: "left",
                    paddingLeft: 2,
                    border: "1px solid #ccc"
                  }}
                >
                  {dam.dam}
                </TableCell>
              </TableRow>
              {dam.stations.map((station) => {
                const mergedSizes = station.sizes.join(", ");
                const mergedCounts = station.counts.join(", ");
                const row = (
                  <TableRow key={station.name}>
                    <TableCell sx={cellStyle(rowIndex)}>{station.name}</TableCell>
                    <TableCell sx={cellStyle(rowIndex)}>{station.pumpType}</TableCell>
                    <TableCell sx={cellStyle(rowIndex)}>{mergedSizes}</TableCell>
                    <TableCell sx={cellStyle(rowIndex++)}>{mergedCounts}</TableCell>
                  </TableRow>
                );
                return row;
              })}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PumpStationTable;
