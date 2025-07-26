import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  Box,
  Button, // Import Button from Material-UI
} from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload"; // Import an icon for the button
import { formatThaiDateForTableGate, Path_File, ThaiDate } from "../../utility";

interface DataWaterLevel {
  datetime: string;
  gate_water_upper: number;
  gate_water_lower: number;
  flow_rate: number;
  gate_open: number;
}

const HeaderCellStyle = {
  position: "sticky",
  top: { xs: 115, md: 60 },
  border: "1px solid #ddd",
  fontFamily: "Prompt",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "rgb(1, 87, 155)",
  color: "white",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "1rem" },
};

const getCellStyle = (index: number) => ({
  border: "1px solid #ddd",
  padding: "5px",
  backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "1rem" },
});

const formatOnlyDate = (datetime: string) => {
  return datetime.split(" ")[0];
};

const WaterLevelTable: React.FC = () => {
  const [data, setData] = useState<DataWaterLevel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("ทั้งหมด");

  useEffect(() => {
    Promise.all([
      fetch(`${Path_File}ras-output/output_ras.csv`).then((res) => res.text()),
      fetch(`${Path_File}ras-output/gate_output.csv`).then((res) => res.text()),
    ])
      .then(([csvText1, csvText2]) => {
        const parsedData: DataWaterLevel[] = [];

        // พาร์สไฟล์ CSV แรก
        Papa.parse(csvText1, {
          complete: (result) => {
            if (result.data.length > 0) {
              try {
                result.data.forEach((row: any) => {
                  const crossSection = parseInt(row[1], 10);
                  const datetime = row[0];
                  const waterSurfaceElevation = parseFloat(row[2]);

                  if (crossSection === 62665 || crossSection === 61985) {
                    let existingData = parsedData.find((d) => d.datetime === datetime);

                    if (!existingData) {
                      existingData = {
                        datetime,
                        gate_water_upper: 0,
                        gate_water_lower: 0,
                        flow_rate: 0,
                        gate_open: 0,
                      };
                      parsedData.push(existingData);
                    }

                    if (crossSection === 62665) {
                      existingData.gate_water_upper = waterSurfaceElevation;
                    } else if (crossSection === 61985) {
                      existingData.gate_water_lower = waterSurfaceElevation;
                    }
                  }
                });
              } catch (err) {
                console.error("Error parsing first CSV file:", err);
                setError("Error parsing first CSV file");
              }
            }
          },
          skipEmptyLines: true,
        });

        // พาร์สไฟล์ CSV ที่สอง
        Papa.parse(csvText2, {
          complete: (result) => {
            if (result.data.length > 0) {
              try {
                result.data.forEach((row: any) => {
                  const datetime = row[0]?.trim();
                  const gateOpen = parseFloat(row[1]);
                  const flowRate = parseFloat(row[2]);

                  let existingData = parsedData.find((d) => d.datetime === datetime);
                  if (existingData) {
                    existingData.gate_open = gateOpen;
                    existingData.flow_rate = flowRate;
                  }
                });
                const today = new Date();
                today.setHours(0, 0, 0, 0); // ตัดเวลาให้เป็น 00:00 ของวันนี้

                // ฟังก์ชันแปลง "19/06/2025 07:00" → "2025-06-19T07:00"
                const convertToISO = (dateStr: string) => {
                  if (!dateStr) return null; // Handle undefined/null dateStr
                  const [datePart, timePart] = dateStr.split(" ");
                  const [day, month, year] = datePart.split("/").map(Number);
                  // Ensure year is 4 digits for Date constructor
                  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${timePart}`;
                };

                const filteredByToday = parsedData.filter((item) => {
                  const iso = convertToISO(item.datetime); // แปลงก่อน
                  return iso && new Date(iso) >= today; // Check if iso is not null
                });

                setData(filteredByToday);
                setLoading(false);
              } catch (err) {
                console.error("Error parsing second CSV file:", err);
                setError("Error parsing second CSV file");
              }
            }
          },
          skipEmptyLines: true,
        });
      })
      .catch((err) => {
        console.error("Error loading CSV files:", err);
        setError("Error loading CSV files");
        setLoading(false);
      });
  }, []);

  const uniqueDates = Array.from(new Set(data.map((row) => formatOnlyDate(row.datetime))));
  // Sort dates in ascending order (oldest to newest) for the dropdown
  uniqueDates.sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    // Note: Month is 0-indexed in Date constructor, so month - 1
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA.getTime() - dateB.getTime();
  });


  const filteredData =
    selectedDate === "ทั้งหมด"
      ? data
      : data.filter((row) => formatOnlyDate(row.datetime) === selectedDate);


  // --- New Export CSV Function ---
  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      alert("ไม่มีข้อมูลให้ส่งออก!");
      return;
    }

    const csvHeaders = [
      "วัน-เวลา",
      "จำนวนบาน",
      "ระยะเปิดบาน (ม.)",
      "ระดับน้ำเหนือ (ม.รทก.)",
      "ระดับน้ำท้าย (ม.รทก.)",
      "อัตราการไหล (ลบ.ม./วินาที)",
    ];

    // Map your filteredData to a format suitable for CSV
    const csvData = filteredData.map((row) => ({
      "วัน-เวลา": formatThaiDateForTableGate(row.datetime),
      "จำนวนบาน": 6, // Hardcoded as per your table
      "ระยะเปิดบาน (ม.)": row.gate_open.toFixed(2),
      "ระดับน้ำเหนือ (ม.รทก.)": row.gate_water_upper.toFixed(2),
      "ระดับน้ำท้าย (ม.รทk.)": row.gate_water_lower.toFixed(2),
      "อัตราการไหล (ลบ.ม./วินาที)": row.flow_rate.toFixed(2),
    }));

    const csv = Papa.unparse({
      fields: csvHeaders,
      data: csvData,
    }, {
      delimiter: ',', // Use comma as delimiter
      header: true,   // Include header row
      skipEmptyLines: true
    });

    const blob = new Blob([csv], { type: "text/csv;charset=TIS-620;" }); // Ensure charset is TIS-620
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const filename = `Gate_Wangyang_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.csv`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up the URL object
  };
  // --- End New Export CSV Function ---


  return (
    <TableContainer
      sx={{
        justifySelf: "center",
        maxWidth: {
          xs: "90%",
          sm: "90%",
          md: "80%",
        },
        overflowX: "auto",
        paddingBottom: 3,
        maxHeight: selectedDate === "ทั้งหมด" ? "90vh" : "auto",
        overflowY: selectedDate === "ทั้งหมด" ? "auto" : "unset",
      }}
    >
      <Box
        sx={{
          backgroundColor: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 1, 
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 2,
          paddingY: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: "Prompt",
            fontWeight: "bold",
            color: "#28378B",
            whiteSpace: "nowrap",
          }}
        >
          {loading
            ? "กำลังโหลดข้อมูล..."
            : error
            ? "เกิดข้อผิดพลาด"
            : "ข้อเสนอแนะการเปิด-ปิดประตูระบายน้ำเขื่อนวังยาง"}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
          <Select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            displayEmpty
            sx={{
              fontFamily: "Prompt",
              minWidth: 200,
              backgroundColor: "#fff",
              height: 50,
              flexGrow: 1, // Allow select to grow on small screens
            }}
          >
            <MenuItem value="ทั้งหมด">ทั้งหมด</MenuItem>
            {uniqueDates.map((date, index) => (
              <MenuItem key={index} value={date}>
                {ThaiDate(date)}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            onClick={handleExportCsv}
            startIcon={<CloudDownloadIcon />}
            sx={{
              fontFamily: "Prompt",
               backgroundColor: "#28aa15", // Example blue color
                  '&:hover': {
                    backgroundColor: "#159311", // Darker blue on hover
                  },
              height: 50,
              whiteSpace: 'nowrap', // Prevent text wrapping
              minWidth: { xs: 'auto', md: '120px' }, // Adjust width for small screens
            }}
            disabled={loading || error !== null || filteredData.length === 0} // Disable if loading, error, or no data
          >
                      Export ข้อมูลเป็น CSV
          </Button>
        </Box>
      </Box>
      <Table aria-label="water-level-table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...HeaderCellStyle, minWidth: { sm: "20%", md: "15%", lg: "auto" } }}>
              วัน-เวลา
            </TableCell>
            <TableCell sx={HeaderCellStyle}>จำนวนบาน</TableCell>
            <TableCell sx={HeaderCellStyle}>ระยะเปิดบาน<br />(ม.)</TableCell>
            <TableCell sx={HeaderCellStyle}>ระดับน้ำเหนือ<br />(ม.รทก.)</TableCell>
            <TableCell sx={HeaderCellStyle}>ระดับน้ำท้าย<br />(ม.รทก.)</TableCell>
            <TableCell sx={HeaderCellStyle}>อัตราการไหล<br />(ลบ.ม./วินาที)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                กำลังโหลดข้อมูล...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {error}
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((row, index) => (
              <TableRow key={index}>
                <TableCell sx={getCellStyle(index)}>
                  {formatThaiDateForTableGate(row.datetime)}
                </TableCell>
                <TableCell sx={getCellStyle(index)}>6</TableCell>
                <TableCell sx={getCellStyle(index)}>{row.gate_open.toFixed(2)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{row.gate_water_upper.toFixed(2)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{row.gate_water_lower.toFixed(2)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{row.flow_rate.toFixed(2)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default WaterLevelTable;