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
} from "@mui/material";
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
  top: {xs: 115 ,md: 60},
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
      fetch(`${Path_File}output_ras.csv`).then((res) => res.text()),
      fetch(`${Path_File}gate_output.csv`).then((res) => res.text()),
      // fetch("./ras-output/output_ras.csv").then((res) => res.text()),
      // fetch("./ras-output/gate_output.csv").then((res) => res.text()),
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
                  const [datePart, timePart] = dateStr.split(" ");
                  const [day, month, year] = datePart.split("/").map(Number);
                  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${timePart}`;
                };

                const filteredByToday = parsedData.filter((item) => {
                  const iso = convertToISO(item.datetime); // แปลงก่อน
                  return new Date(iso) >= today;
                });

                setData(filteredByToday);
                setLoading(false);
              } catch (err) {
                setError("Error parsing second CSV file");
              }
            }
          },
          skipEmptyLines: true,
        });
      })
      .catch(() => {
        setError("Error loading CSV files");
        setLoading(false);
      });
  }, []);

  

  const uniqueDates = Array.from(new Set(data.map((row) => formatOnlyDate(row.datetime))));
  uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());


  const filteredData =
    selectedDate === "ทั้งหมด"
      ? data
      : data.filter((row) => formatOnlyDate(row.datetime) === selectedDate);

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

        <Select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          displayEmpty
          sx={{
            fontFamily: "Prompt",
            minWidth: 200,
            backgroundColor: "#fff",
            height: 50,
          }}
        >
          <MenuItem value="ทั้งหมด">ทั้งหมด</MenuItem>
          {uniqueDates.map((date, index) => (
            <MenuItem key={index} value={date}>
              {ThaiDate(date)}
            </MenuItem>
          ))}
        </Select>
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
