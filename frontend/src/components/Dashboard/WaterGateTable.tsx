import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { formatThaiDate } from "../../utility";

interface DataWaterLevel {
  datetime: string;
  gate_water_upper: number;
  gate_water_lower: number;
  flow_rate: number;
  gate_open: number; // เพิ่มค่า gate_open
}

const HeaderCellStyle = {
  border: "1px solid #ddd",
  fontFamily: "Prompt",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "rgb(1, 87, 155)",
  color: "white",
  fontSize: { xs: "0.7rem", sm: "0.8rem" , md: "1rem"},
};

const getCellStyle = (index: number) => ({
  border: "1px solid #ddd",
  padding: "5px",
  backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.6rem", sm: "0.7rem" , md: "0.8rem"},
});

const WaterLevelTable: React.FC = () => {
  const [data, setData] = useState<DataWaterLevel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("./ras-output/output_profile.csv").then(res => res.text()),
      fetch("./ras-output/output_gate.csv").then(res => res.text()) // โหลดไฟล์ที่สอง
    ])
      .then(([csvText1, csvText2]) => {
        const parsedData: DataWaterLevel[] = [];

        // พาร์สไฟล์ CSV ที่หนึ่ง
        Papa.parse(csvText1, {
          complete: (result) => {
            if (result.data.length > 0) {
              try {
                result.data.forEach((row: any) => {
                  const crossSection = parseInt(row[2], 10);
                  const datetime = row[3];
                  const waterSurfaceElevation = parseFloat(row[4]);
                  const flowRate = parseFloat(row[5]);

                  if (crossSection === 62029 || crossSection === 61985) {
                    let existingData = parsedData.find(d => d.datetime === datetime);

                    if (!existingData) {
                      existingData = { datetime, gate_water_upper: 0, gate_water_lower: 0, flow_rate: 0, gate_open: 0 };
                      parsedData.push(existingData);
                    }

                    if (crossSection === 62029) {
                      existingData.gate_water_upper = waterSurfaceElevation;
                    } else if (crossSection === 61985) {
                      existingData.gate_water_lower = waterSurfaceElevation;
                      existingData.flow_rate = flowRate;
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
                  const datetime = row[0]; // คอลัมน์วันเวลา
                  const gateOpen = parseFloat(row[2]); // ค่าที่ต้องการ
                  
                  let existingData = parsedData.find(d => d.datetime === datetime);
                  if (existingData) {
                    existingData.gate_open = gateOpen; // เพิ่มค่า gate_open
                  }
                });

                setData(parsedData);
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

  return (
    <TableContainer sx={{  justifySelf: "center",
        maxWidth: {
          xs: "90%",
          sm: "90%",
          md: "80%",
        },
        overflowX: "auto", // ให้ Scroll ได้ในมือถือ
        paddingBottom: 3,
        paddingTop: 2,

      }}>
      <Typography variant="h6" gutterBottom sx={{ fontFamily: "Prompt", fontWeight: "bold", color:"#28378B" }}>
        {loading ? "กำลังโหลดข้อมูล..." : error ? "เกิดข้อผิดพลาด" : "ข้อเสนอแนะการเปิด-ปิดประตูระบายน้ำวังยาง"}
      </Typography>

      <Table aria-label="water-level-table">
        <TableHead sx={{backgroundColors:"#99CCFF"}}>
          <TableRow>
            <TableCell sx={{...HeaderCellStyle,minWidth:{sm:"20%",md:"15%",lg:"auto"}}}>วัน-เวลา</TableCell>
            <TableCell sx={HeaderCellStyle}>จำนวนบาน</TableCell>
            <TableCell sx={HeaderCellStyle}>ระยะเปิดบาน<br/>(ม.)</TableCell> {/* เพิ่มคอลัมน์ */}
            <TableCell sx={HeaderCellStyle}>ระดับน้ำเหนือ<br/>(ม.รทก.)</TableCell>
            <TableCell sx={HeaderCellStyle}>ระดับน้ำท้าย<br/>(ม.รทก.)</TableCell>
            <TableCell sx={HeaderCellStyle}>อัตราการไหล<br/>(ลบ.ม./วินาที)</TableCell>
            
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">กำลังโหลดข้อมูล...</TableCell> {/* เปลี่ยน colSpan เป็น 6 */}
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} align="center">{error}</TableCell> {/* เปลี่ยน colSpan เป็น 6 */}
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={index}>
                <TableCell sx={getCellStyle(index)}>{formatThaiDate(row.datetime)}</TableCell>
                <TableCell sx={getCellStyle(index)}>6</TableCell>
                <TableCell sx={getCellStyle(index)}>
                  {parseFloat(row.gate_open.toFixed(2))}
                </TableCell>
                <TableCell sx={getCellStyle(index)}>
                  {parseFloat(row.gate_water_upper.toFixed(2))}
                </TableCell>
                <TableCell sx={getCellStyle(index)}>
                  {parseFloat(row.gate_water_lower.toFixed(2))}
                </TableCell>
                <TableCell sx={getCellStyle(index)}>
                  {parseFloat(row.flow_rate.toFixed(2))}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>


  );
};

export default WaterLevelTable;
