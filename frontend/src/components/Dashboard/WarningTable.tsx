import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, Button, Box } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'; // Import an icon for the button

// ข้อมูลจากตาราง (คงเดิม)
const warningData = [
  {
    id: 1,
    location: "E.91",
    district: "โกสุมพิสัย",
    province: "มหาสารคาม",
    lowBankElevation: 144.70, // Renamed 'depth' to 'lowBankElevation' for clarity with new header
    leftBank: 152.29,
    rightBank: 152.25,
    canalBottom: 137.95,
    watch: 149.30,
    alert: 150.80,
    crisis: 152.20,
    watchFlow: 1100.0,
    alertFlow: 1450.0,
    crisisFlow: 1800.0,
    maxLevel7Days: ''
  },
  {
    id: 2,
    location: "E.8A",
    district: "เมือง",
    province: "มหาสารคาม",
    lowBankElevation: 144.69, // Renamed
    leftBank: 148.95,
    rightBank: 148.69,
    canalBottom: 132.40,
    watch: 145.40,
    alert: 147.10,
    crisis: 148.60,
    watchFlow: 1350.0,
    alertFlow: 1750.0,
    crisisFlow: 2000.0,
    maxLevel7Days: ''
  },
  {
    id: 3,
    location: "BTH",
    district: "ฆ้องชัย",
    province: "กาฬสินธุ์",
    lowBankElevation: 135.50, // Added a placeholder value, was null
    leftBank: 137.13,
    rightBank: 137.13,
    canalBottom: 134.00, // Added a placeholder value, was null
    watch: 135.60,
    alert: 136.30,
    crisis: 137.10,
    watchFlow: 160.0,
    alertFlow: 300.0,
    crisisFlow: 400.0,
    maxLevel7Days: ''
  },
  {
    id: 4,
    location: "WY",
    district: "ฆ้องชัย",
    province: "กาฬสินธุ์",
    lowBankElevation: 131.20, // Renamed
    leftBank: 142.00,
    rightBank: 142.00,
    canalBottom: 131.20,
    watch: 139.10,
    alert: 140.60,
    crisis: 142.10,
    watchFlow: 560.0,
    alertFlow: 740.0,
    crisisFlow: 855.0,
    maxLevel7Days: ''
  },
  {
    id: 5,
    location: "E.66A",
    district: "จังหาร",
    province: "ร้อยเอ็ด",
    lowBankElevation: 127.03, // Renamed
    leftBank: 141.53,
    rightBank: 143.46,
    canalBottom: 127.03,
    watch: 138.60,
    alert: 140.00,
    crisis: 141.50,
    watchFlow: 410.0,
    alertFlow: 600.0,
    crisisFlow: 750.0,
    maxLevel7Days: ''
  },
  {
    id: 6,
    location: "E.87",
    district: "กมลาไสย",
    province: "กาฬสินธุ์",
    lowBankElevation: 129.49, // Renamed
    leftBank: 139.95,
    rightBank: 139.98,
    canalBottom: 129.49,
    watch: 137.80,
    alert: 138.90,
    crisis: 139.90,
    watchFlow: 700.0,
    alertFlow: 930.0,
    crisisFlow: 1150.0,
    maxLevel7Days: ''
  },
  {
    id: 7,
    location: "RE",
    district: "เชียงขวัญ",
    province: "ร้อยเอ็ด",
    lowBankElevation: 133.00, // Added a placeholder value, was null
    leftBank: 136.38,
    rightBank: 136.38,
    canalBottom: 133.00, // Added a placeholder value, was null
    watch: 133.80,
    alert: 135.10,
    crisis: 136.30,
    watchFlow: 240.0,
    alertFlow: 340.0,
    crisisFlow: 430.0,
    maxLevel7Days: ''
  }
];

interface FloodWarningTableProps {
  maxLevels: Record<string, number>; // Max elevations (ม.รทก.)
  maxFlows: Record<string, number>;   // Max flows (ลบ.ม./วินาที) - NEW PROP
}

const locationMapping = (key: string): string => {
  const map: { [key: string]: string } = {
    "WY": "เขื่อนวังยาง",
    "RE": "เขื่อนร้อยเอ็ด",
    "E.66A": "E.66A (ท้ายน้ำ)",
    "BTH": "บ้านท่าแห (เหนือน้ำ)"
  };
  return map[key] || key; // If key not found in map, return original key
};

const FloodWarningTable: React.FC<FloodWarningTableProps> = ({ maxLevels, maxFlows }) => {
  const isSmallScreen = useMediaQuery("(max-width: 600px)");
  const isMediumScreen = useMediaQuery("(max-width: 900px)");

  // Adjusted getCellStyle to also apply color coding for maxFlow
  const getCellStyle = (
    index: number,
    isMaxCell: boolean = false, // Generic flag for max level/flow cells
    currentValue?: number | null, // The actual value (level or flow)
    watchThreshold?: number,
    alertThreshold?: number,
    crisisThreshold?: number
  ) => {
    let backgroundColor = index % 2 === 0 ? "#FAFAFA" : "#FFF";

    if (isMaxCell && currentValue !== undefined && currentValue !== null && !isNaN(currentValue)) {
      if (crisisThreshold !== undefined && currentValue > crisisThreshold) {
        backgroundColor = "#FF7C80"; // Crisis: Red
      } else if (alertThreshold !== undefined && currentValue > alertThreshold) {
        backgroundColor = "#FFFF99"; // Alert: Yellow
      } else if (watchThreshold !== undefined && currentValue > watchThreshold) {
        backgroundColor = "#C6E0B4"; // Watch: Green
      }
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
    padding: isSmallScreen ? "4px" : "8px",
  };

  const exportToCsv = () => {
    const headers = [
      "ลำดับ",
      "ตำแหน่งเตือนภัย",
      "อำเภอ",
      "จังหวัด",
      "ตลิ่งลุ่มต่ำ (ม.รทก.)",
      "ตลิ่งซ้าย (ม.รทก.)",
      "ตลิ่งขวา (ม.รทก.)",
      "ท้องคลอง (ม.รทก.)",
      "เกณฑ์เฝ้าระวัง (ม.รทก.)",
      "เกณฑ์เตือนภัย (ม.รทก.)",
      "เกณฑ์วิกฤต (ม.รทก.)",
      "เกณฑ์เฝ้าระวัง (ลบ.ม./วินาที)",
      "เกณฑ์เตือนภัย (ลบ.ม./วินาที)",
      "เกณฑ์วิกฤต (ลบ.ม./วินาที)",
      "ผลพยากรณ์สูงสุด 7 วัน (ม.รทก.)", // Max Level
      "ผลพยากรณ์สูงสุด 7 วัน (ลบ.ม./วินาที)" // Max Flow
    ];

    const rows = warningData.map(item => {
      const currentMaxLevel = maxLevels[item.location];
      const currentMaxFlow = maxFlows[item.location]; // Get max flow for this location

      return [
        item.id,
        locationMapping(item.location), // Use mapping for location
        item.district,
        item.province,
        item.lowBankElevation != null ? item.lowBankElevation.toFixed(2) : "-", // Use new field
        item.leftBank != null ? item.leftBank.toFixed(2) : "-",
        item.rightBank != null ? item.rightBank.toFixed(2) : "-",
        item.canalBottom != null ? item.canalBottom.toFixed(2) : "-",
        item.watch != null ? item.watch.toFixed(2) : "-",
        item.alert != null ? item.alert.toFixed(2) : "-",
        item.crisis != null ? item.crisis.toFixed(2) : "-",
        item.watchFlow != null ? item.watchFlow.toFixed(2) : "-", // New flow fields
        item.alertFlow != null ? item.alertFlow.toFixed(2) : "-",
        item.crisisFlow != null ? item.crisisFlow.toFixed(2) : "-",
        currentMaxLevel != null ? currentMaxLevel.toFixed(2) : "-", // Max Level
        currentMaxFlow != null ? currentMaxFlow.toFixed(2) : "-" // Max Flow
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create a Blob with UTF-8 BOM for proper Thai character display in Excel
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "flood_warning_wangyang.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  return (
    <TableContainer
      sx={{
        justifySelf: "center",
        maxWidth: "90vw",
        overflowX: "auto", // Allow horizontal scroll on small screens
        paddingBottom: 3,
        paddingTop: 2,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", fontFamily: "Prompt", color: "#28378B" }}
        >
          ตำแหน่งสำคัญ เกณฑ์การเฝ้าระวังและเตือนภัยพื้นที่ศึกษาโครงการวังยาง
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={exportToCsv}
          startIcon={<CloudDownloadIcon />}
          sx={{
            fontFamily: "Prompt",
            backgroundColor: "#28aa15",
            '&:hover': { backgroundColor: "#159311" },
            whiteSpace: 'nowrap', // Prevent text wrap on button
            minWidth: 'auto', // Allow button to shrink
          }}
        >
          Export ข้อมูลเป็น CSV
        </Button>
      </Box>

      <Table sx={{ minWidth: isSmallScreen ? 600 : 1200, tableLayout: "auto" }}> {/* Increased minWidth for new columns */}
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
              ตลิ่งลุ่มต่ำ<br />(ม.รทก.)
            </TableCell>
            <TableCell sx={{ ...cellHeaderStyle }} colSpan={3}>
              เกณฑ์ระดับน้ำ (ม.รทก.)
            </TableCell>
            <TableCell sx={{ ...cellHeaderStyle }} colSpan={3}>
              เกณฑ์ปริมาณน้ำท่า (ลบ.ม./วินาที)
            </TableCell>
            <TableCell sx={{ minWidth: "100px", ...cellHeaderStyle }} colSpan={2}>
              ผลพยากรณ์สูงสุด 7 วัน
            </TableCell>
          </TableRow>
          <TableRow>
            {/* เกณฑ์ระดับน้ำ (ม.รทก.) */}
            <TableCell sx={{ fontFamily: "Prompt", padding: "5px", fontWeight: "bold", textAlign: "center", backgroundColor: "#C6E0B4" }}>
              เฝ้าระวัง
            </TableCell>
            <TableCell sx={{ fontFamily: "Prompt", padding: "5px", fontWeight: "bold", textAlign: "center", backgroundColor: "#FFFF99" }}>
              เตือนภัย
            </TableCell>
            <TableCell sx={{ fontFamily: "Prompt", padding: "5px", fontWeight: "bold", textAlign: "center", backgroundColor: "#FF7C80" }}>
              วิกฤต
            </TableCell>
            {/* เกณฑ์ปริมาณน้ำท่า (ลบ.ม./วินาที) */}
            <TableCell sx={{ fontFamily: "Prompt", padding: "5px", fontWeight: "bold", textAlign: "center", backgroundColor: "#C6E0B4" }}>
              เฝ้าระวัง
            </TableCell>
            <TableCell sx={{ fontFamily: "Prompt", padding: "5px", fontWeight: "bold", textAlign: "center", backgroundColor: "#FFFF99" }}>
              เตือนภัย
            </TableCell>
            <TableCell sx={{ fontFamily: "Prompt", padding: "5px", fontWeight: "bold", textAlign: "center", backgroundColor: "#FF7C80" }}>
              วิกฤต
            </TableCell>
            {/* ผลพยากรณ์สูงสุด 7 วัน */}
            <TableCell sx={{ ...cellHeaderStyle }}>
              ระดับน้ำ<br />(ม.รทก.)
            </TableCell>
            <TableCell sx={{ ...cellHeaderStyle }}>
              ปริมาณน้ำท่า<br />(ลบ.ม./วินาที)
            </TableCell>
          </TableRow>
        </TableHead>

        {/* ข้อมูลในตาราง */}
        <TableBody>
          {warningData.map((item, index) => {
            const currentMaxLevel = maxLevels[item.location]; // Max elevation for this station
            const currentMaxFlow = maxFlows[item.location];   // Max flow for this station

            return (
              <TableRow key={item.id}>
                <TableCell sx={getCellStyle(index)}>{item.id}</TableCell>
                <TableCell sx={getCellStyle(index)}>{locationMapping(item.location)}</TableCell>
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.district}</TableCell>}
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.province}</TableCell>}
                <TableCell sx={getCellStyle(index)}>{item.lowBankElevation != null ? item.lowBankElevation.toFixed(2) : "-"}</TableCell>

                {/* เกณฑ์ระดับน้ำ (ม.รทก.) */}
                <TableCell sx={getCellStyle(index)}>{item.watch != null ? item.watch.toFixed(2) : "-"}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.alert != null ? item.alert.toFixed(2) : "-"}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.crisis != null ? item.crisis.toFixed(2) : "-"}</TableCell>

                {/* เกณฑ์ปริมาณน้ำท่า (ลบ.ม./วินาที) */}
                <TableCell sx={getCellStyle(index)}>{item.watchFlow != null ? item.watchFlow.toFixed(2) : "-"}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.alertFlow != null ? item.alertFlow.toFixed(2) : "-"}</TableCell>
                <TableCell sx={getCellStyle(index)}>{item.crisisFlow != null ? item.crisisFlow.toFixed(2) : "-"}</TableCell>

                {/* ผลพยากรณ์สูงสุด 7 วัน (ม.รทก.) */}
                <TableCell
                  sx={getCellStyle(
                    index,
                    true, // Flag for max cell
                    currentMaxLevel,
                    item.watch,
                    item.alert,
                    item.crisis
                  )}
                >
                  {currentMaxLevel != null ? currentMaxLevel.toFixed(2) : "-"}
                </TableCell>

                {/* ผลพยากรณ์สูงสุด 7 วัน (ลบ.ม./วินาที) */}
                <TableCell
                  sx={getCellStyle(
                    index,
                    true, // Flag for max cell
                    currentMaxFlow, // Pass max flow value
                    item.watchFlow, // Pass flow thresholds
                    item.alertFlow,
                    item.crisisFlow
                  )}
                >
                  {currentMaxFlow != null ? currentMaxFlow.toFixed(2) : "-"}
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