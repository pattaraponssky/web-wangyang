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
  Button,
} from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
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
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch(`${Path_File}ras-output/output_ras.csv`).then((res) => res.text()),
      fetch(`${Path_File}ras-output/gate_output.csv`).then((res) => res.text()),
    ])
      .then(([csvText1, csvText2]) => {
        const parsedData: DataWaterLevel[] = [];

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
                today.setHours(0, 0, 0, 0);

                const convertToISO = (dateStr: string) => {
                  if (!dateStr) return null;
                  const [datePart, timePart] = dateStr.split(" ");
                  const [day, month, year] = datePart.split("/").map(Number);
                  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${timePart}`;
                };

                // Filter data from today onwards
                let dataFromToday = parsedData.filter((item) => {
                  const iso = convertToISO(item.datetime);
                  return iso && new Date(iso) >= today;
                });

                // Sort dataFromToday to ensure the first item is truly the earliest
                dataFromToday.sort((a, b) => {
                    const dateA = new Date(convertToISO(a.datetime) || 0); // Use 0 as fallback for invalid dates
                    const dateB = new Date(convertToISO(b.datetime) || 0);
                    return dateA.getTime() - dateB.getTime();
                });


                let finalFilteredData = dataFromToday;

                if (dataFromToday.length > 0) {
                  const firstDateTimeStr = dataFromToday[0].datetime; // e.g., "26/07/2025 00:00"
                  const [datePart, ] = firstDateTimeStr.split(" "); // Get "26/07/2025"
                  
                  // Create the target start time: "DD/MM/YYYY 07:00"
                  const targetStartTimeStr = `${datePart} 07:00`;
                  const targetStartTimeISO = convertToISO(targetStartTimeStr);
                  
                  if (targetStartTimeISO) {
                      const targetDate = new Date(targetStartTimeISO);
                      // Filter again to include only data from targetDate onwards
                      finalFilteredData = dataFromToday.filter(item => {
                          const itemDate = new Date(convertToISO(item.datetime) || 0);
                          return itemDate >= targetDate;
                      });
                  }

                  // Set selectedDate to the first date found (which is the date of the 07:00 data)
                  // Use formatOnlyDate from the first item of finalFilteredData, if available
                  if (finalFilteredData.length > 0) {
                      setSelectedDate(formatOnlyDate(finalFilteredData[0].datetime));
                  } else {
                      // If no data after 07:00, set to "ทั้งหมด" or clear
                      setSelectedDate("ทั้งหมด");
                  }
                } else {
                    setSelectedDate("ทั้งหมด"); // No data from today onwards
                }

                setData(finalFilteredData);
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
  uniqueDates.sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA.getTime() - dateB.getTime();
  });


  const filteredData =
    selectedDate === "ทั้งหมด"
      ? data
      : data.filter((row) => formatOnlyDate(row.datetime) === selectedDate);


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

    const csvData = filteredData.map((row) => ({
      "วัน-เวลา": formatThaiDateForTableGate(row.datetime),
      "จำนวนบาน": 6,
      "ระยะเปิดบาน (ม.)": parseFloat(row.gate_open.toFixed(1)).toFixed(2),
      "ระดับน้ำเหนือ (ม.รทก.)": row.gate_water_upper.toFixed(2),
      "ระดับน้ำท้าย (ม.รทก.)": row.gate_water_lower.toFixed(2),
      "อัตราการไหล (ลบ.ม./วินาที)": row.flow_rate.toFixed(2),
    }));

    const csv = Papa.unparse({
      fields: csvHeaders,
      data: csvData,
    }, {
      delimiter: ',',
      header: true,
      skipEmptyLines: true
    });

    const blob = new Blob([csv], { type: "text/csv;charset=TIS-620;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    let filenameDatePart;
    if (selectedDate === "ทั้งหมด") {
      const now = new Date();
      filenameDatePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    } else {
      const [day, month, year] = selectedDate.split('/');
      filenameDatePart = `${year}${month}${day}`;
    }
    const filename = `Gate_Wangyang_${filenameDatePart}.csv`;

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


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
              flexGrow: 1,
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
               backgroundColor: "#28aa15",
                  '&:hover': {
                    backgroundColor: "#159311",
                  },
              height: 50,
              whiteSpace: 'nowrap',
              minWidth: { xs: 'auto', md: '120px' },
            }}
            disabled={loading || error !== null || filteredData.length === 0}
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
                <TableCell sx={getCellStyle(index)}>{parseFloat(row.gate_open.toFixed(1)).toFixed(2)}</TableCell>
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