import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import ReactApexChart from "react-apexcharts";
import { Box, Button, CardContent, MenuItem, Select, Typography} from "@mui/material";
import { formatThaiDay } from "../../utility";
import { ArrowBack, ArrowForward } from "@mui/icons-material";

interface waterData {
  CrossSection: number;
  Date: string | null;
  WaterLevel: number;
}
interface Props {
  waterData: waterData[];
}

const LongProfileChart: React.FC<Props> = ({ waterData }) => {
  const [data, setData] = useState<{ Ground: number; LOB: number; ROB: number; KM: number; WaterLevel?: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const dates = [...new Set(waterData.map((d) => d.Date?.split(" ")[0]))].sort();
  const currentIndex = dates.indexOf(selectedDate ?? "");

  useEffect(() => {
    // โหลดไฟล์ CSV หลัก
   
    fetch("./data/longProfile.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          complete: (result) => {
            const rawData: any[] = result.data;
            const parsedData = rawData.slice(1).map((row: any) => ({
              Ground: parseFloat(row[0]) || 0,
              LOB: parseFloat(row[1]) || 0,
              ROB: parseFloat(row[2]) || 0,
              KM: parseFloat(row[3]) || 0, 
            }));
            setData(parsedData);
          },
          header: false,
          skipEmptyLines: true,
        });
      })
      .catch((error) => console.error("Error loading CSV:", error));
  }, []);

  
  useEffect(() => {
    if (waterData.length > 0) {
      const firstDateTime = [...new Set(waterData.map((d) => d.Date))].sort()[0];
      if (firstDateTime) {
        const [datePart, timePart] = firstDateTime.split(" ");
        setSelectedDate(datePart);
        setSelectedTime(timePart);
      }
    }
  }, [waterData]); // ตัด selectedDate, selectedTime ออก
  
  

  const uniqueDays = [...new Set(waterData.map(d => d.Date?.split(" ")[0]))].sort();
  const uniqueTimes = [...new Set(
    waterData
      .filter(d => d.Date?.startsWith(selectedDate || ""))
      .map(d => d.Date?.split(" ")[1])
  )].sort();

  // ฟังก์ชันที่จะทำการกรองข้อมูลตาม selectedNO
  const fullSelectedDateTime = selectedDate && selectedTime ? `${selectedDate} ${selectedTime}` : null;
  const filteredwaterData = waterData.filter((d) => d.Date === fullSelectedDateTime);
  filteredwaterData.reverse();


  useEffect(() => {
    if (!selectedDate || !selectedTime || waterData.length === 0 || data.length === 0) return;
  
    const fullSelectedDateTime = `${selectedDate} ${selectedTime}`;
    const filteredwaterData = [...waterData.filter((d) => d.Date === fullSelectedDateTime)].reverse();
  
    const maxKM = Math.max(...data.map((d) => d.KM));
    const minKM = Math.min(...data.map((d) => d.KM));
    const waterDataLength = filteredwaterData.length;
  
    setData((prevData) =>
      prevData.map((d) => {
        const normalized = (d.KM - minKM) / (maxKM - minKM);
        const waterIndex = Math.round((1 - normalized) * (waterDataLength - 1));
        const waterLevel = filteredwaterData[waterIndex]?.WaterLevel ?? null;
        return { ...d, WaterLevel: waterLevel };
      })
    );
  }, [selectedDate, selectedTime, waterData, data.length]);
  

 


  const chartOptions = {
    chart: {
      type: "line" as "line",
      toolbar: { show: false },
      fontFamily: 'Prompt',
      zoom: {
        enabled: true, // ปิดการซูม
      },
    },
    xaxis: {
      type: "numeric" as "numeric",
      categories: data.map((d) => d.KM), // ใช้ค่า KM เป็นแกน X
      labels: {
      },
      title: {
        text: 'ระยะทาง (กม.)',
      },
    },
    yaxis: {
      labels: {
        formatter: function (val: any) {
          return Number(Number(val).toFixed(2)).toLocaleString();
        },
        style: {
          fontSize: '1rem',
        },
      },
      title: {
        text: 'ระดับ (ม.ทรก.)',
        style: {
          fontSize: '1rem',
        },
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      y: {
        formatter: function (val: number) {
          return Number(val).toFixed(2).toLocaleString() + " ม.ทรก.";
        },
      },
      x: {
        formatter: function (val: number) {
          return `ระยะทาง: ${val.toFixed(2)} กม.`; // แสดงระยะทาง KM
        },
      },
    },
    
    annotations: {
      xaxis: [        
        {
          x: 140, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
          x2: 200, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
          borderColor: '#FF0000', // สีของเส้นขอบ
          fillColor: '#FF0000', // สีพื้นหลังของพื้นที่
          opacity: 0.1, // ความโปร่งใส
          label: {
            // text: "พื้นที่ที่ต้องการไฮไลต์",
            style: {
              color: '#ffffff',
              background: '#FF0000',
              fontSize: '12px',
            },
          },
        },
        {
          x: 0, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
          x2: 140, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
          borderColor: 'blue', // สีของเส้นขอบ
          fillColor: 'blue', // สีพื้นหลังของพื้นที่
          opacity: 0.1, // ความโปร่งใส
          label: {
            // text: "พื้นที่ที่ต้องการไฮไลต์",
            style: {
              color: '#ffffff',
              background: '#FF0000',
              fontSize: '12px',
            },
          },
        },
              {
                  x: 125, // ตำแหน่ง x
                  borderColor: '#000',
                  borderWidth: 0,
                  label: {                
                      borderColor: '#66B2FF',
                      position: "bottom", // ✅ ทำให้ข้อความชิดด้านล่าง                      
                      style: {
                          fontSize: '1.15rem',
                          color: '#fff',
                          background: '#66B2FF',
                      },
                      text: 'สถานีสนามเขื่อนวังยาง',
                  }
              },
              {
                  x: 200,
                  borderColor: '#000',
                  borderWidth: 0,
                  label: {                     
                      position: "bottom", // ✅ ทำให้ข้อความชิดด้านล่าง
                      style: {
                          fontSize: '15px',
                          color: '#fff',
                          background: '#66B2FF',                          
                      },
                      text: 'สถานีหลัก คบ.ชีกลาง / เขื่อนร้อยเอ็ด',
                  }
              }
      ],
      yaxis: [
        
        {
          x: 140, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
          x2: 200, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
          borderColor: '#E5CCFF', // สีของเส้นขอบ
          fillColor: '#E5CCFF', // สีพื้นหลังของพื้นที่
          opacity: 0, // ความโปร่งใส
        },
        {
          x: 0, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
          x2: 140, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
          borderColor: 'red', // สีของเส้นขอบ
          fillColor: 'red', // สีพื้นหลังของพื้นที่
          opacity: 0.1, // ความโปร่งใส
        },
      ],
    
    points: [ // นำมาไว้ใน annotations
        {
          x: 170, // ตำแหน่งในแกน X
          y: 155, // ค่าของ Y
          marker: {
            size: 0, // ทำให้จุดใหญ่ขึ้นเพื่อมองเห็นง่าย
          },
          label: {
            show: true,
            style: {
              fontSize: '1rem',
              fontWeight: 'bold', // ทำให้ตัวหนา
              color: '#000',
            },
            text: 'จ.ร้อยเอ็ด', // ข้อความที่ต้องการแสดง
          },
        },
        {
          x: 70, // ตำแหน่งในแกน X
          y: 155, // ค่าของ Y
          marker: {
            size: 0, // ทำให้จุดใหญ่ขึ้นเพื่อมองเห็นง่าย
          },
          label: {
            show: true,
            style: {
              fontSize: '1rem',
              fontWeight: 'bold', // ทำให้ตัวหนา
              color: '#000',
            },
            text: 'จ.มหาสารคาม', // ข้อความที่ต้องการแสดง
          },
        },
        {
          x: 0, // วันที่สำหรับแสดงจุด annotation
          y: 138, // ค่าของ Y สำหรับแสดงจุด annotation
          marker: {
              size: 4,
              fillColor: 'red',
              strokeColor: 'red',
              radius: 2,
              cssClass: 'apexcharts-custom-class'
          },
          label: {
              show: true,
              offsetY: 35,
              offsetX: 25,
              style: {
                  fontSize: '1rem',
                  color: '#fff',
                  background: '#FF0033',
              },
              text: 'E.91' // ข้อความสำหรับจุด annotation
          }
        },
        {
          x: 39, // วันที่สำหรับแสดงจุด annotation
          y: 135, // ค่าของ Y สำหรับแสดงจุด annotation
          marker: {
              size: 4,
              fillColor: 'red',
              strokeColor: 'red',
              radius: 2,
              cssClass: 'apexcharts-custom-class'
          },
          label: {
              show: true,
              offsetY: 40,
              offsetX: 0,
              style: {
                  fontSize: '1rem',
                  color: '#fff',
                  background: '#FF0033',
              },
              text: 'E.1' // ข้อความสำหรับจุด annotation
          }
       },
       {
        x: 72, // วันที่สำหรับแสดงจุด annotation
        y: 132, // ค่าของ Y สำหรับแสดงจุด annotation
        marker: {
            size: 4,
            fillColor: 'red',
            strokeColor: 'red',
            radius: 2,
            cssClass: 'apexcharts-custom-class'
        },
        label: {
            show: true,
            offsetY: 40,
            offsetX: 10,
            style: {
                fontSize: '1rem',
                color: '#fff',
                background: '#FF0033',
            },
            text: 'E.8A' // ข้อความสำหรับจุด annotation
        }
      },
      {
        x: 119, // วันที่สำหรับแสดงจุด annotation
        y: 128, // ค่าของ Y สำหรับแสดงจุด annotation
        marker: {
            size: 4,
            fillColor: 'red',
            strokeColor: 'red',
            radius: 2,
            cssClass: 'apexcharts-custom-class'
        },
        label: {
            show: true,
            offsetY: 45,
            offsetX: -30,
            style: {
                fontSize: '1rem',
                color: '#fff',
                background: '#FF0033',

            },
            text: 'สถานีสนามบ้านท่าแห' // ข้อความสำหรับจุด annotation
        }
      },
      {
        x: 146, // วันที่สำหรับแสดงจุด annotation
        y: 128, // ค่าของ Y สำหรับแสดงจุด annotation
        marker: {
            size: 4,
            fillColor: 'red',
            strokeColor: 'red',
            radius: 2,
            cssClass: 'apexcharts-custom-class'
        },
        label: {
            show: true,
            offsetY: 45,
            offsetX: 0,
            style: {
                fontSize: '1rem',
                color: '#fff',
                background: '#FF0033',
            },
            text: 'สถานีสนาม E.66A' // ข้อความสำหรับจุด annotation
        }
      },
      {
          x: 184, // วันที่สำหรับแสดงจุด annotation
          y: 124.5, // ค่าของ Y สำหรับแสดงจุด annotation
          marker: {
              size: 4,
              fillColor: 'red',
              strokeColor: 'red',
              radius: 2,
              cssClass: 'apexcharts-custom-class'
          },
          label: {
              show: true,
              offsetY: 40,
              offsetX: -70,
              style: {
                  fontSize: '1rem',
                  color: '#fff',
                  background: '#FF0033',
              },
              text: 'จุดบรรจบคลองปาว' // ข้อความสำหรับจุด annotation
          }
      },
      {
        x: 20, // ตำแหน่งในแกน X
        y: 120, // ค่าของ Y
        marker: { size: 0 }, // ซ่อน marker
        label: {
          show: true,
          style: {
            color: '#skyblue',
            fontSize: '1rem',
            fontWeight: 'bold',
          },
          text: '→→→ ทิศทางน้ำไหล →→→', // ใช้ลูกศร →  
          offsetY: -20, // ขยับขึ้น
          offsetX: 10, 
        },
      },
      ],
    },
    stroke: {
      width: [2, 0, 5, 5],
      curve: "monotoneCubic" as "monotoneCubic",
      dashArray: [0, 0, 8, 8],
    },
    colors: ["#007bff","#744111", "red", "green" ],
    fill: {
      
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        opacityFrom: 0.9,
        opacityTo: 0.2,
        stops: [0, 100],
        colorStops: [
          [
            { offset: 0, color: "#007bff", opacity: 1 }, // สีดำด้านบน
            { offset: 100, color: "#007bff", opacity: 0.5 }, // สีเทาด้านล่าง
          ],
          [
            { offset: 0, color: "##744111", opacity: 1 }, // สีดำด้านบน
            { offset: 100, color: "##744111", opacity: 0.2 }, // สีเทาด้านล่าง
          ],
        ],
      },
    },
  };
  

  const chartSeries = useMemo(() => {
    return [
      { name: "Water Level (ระดับผิวน้ำ)", type: "area", data: data.map((d) => d.WaterLevel ?? null) },
      { name: "Ground (ท้ายคลอง)", type: "area", data: data.map((d) => d.Ground) },
      { name: "LOB (ตลิ่งซ้าย)", data: data.map((d) => d.LOB) },
      { name: "ROB (ตลิ่งขวา)", data: data.map((d) => d.ROB) },
    ];
  }, [data]);


  return (
      <CardContent >
        {/* ชื่อหัวข้อกราฟ */}
        <Typography variant="h6" gutterBottom sx={{ fontFamily: "Prompt", fontWeight: "bold", color:"#28378B" }}>
           รูปตัดตามยาวแม่น้ำพื้นที่ศึกษาโครงการวังยาง (เขื่อนมหาสารคาม - เขื่อนร้อยเอ็ด)
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
            {/* ปุ่มเลื่อนไปวันก่อนหน้า */}
            <Button
              variant="contained"
              onClick={() => setSelectedDate(dates[currentIndex - 1] ?? '')}
              disabled={currentIndex <= 0}
              sx={{
                fontFamily: "Prompt",
                fontSize: { xs: "0.8rem", sm: "1rem" },
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#115293" },
                borderRadius: "20px",
                paddingX: "16px",
                width: { xs: "100%", sm: "auto" }, // ให้ปุ่มเต็มหน้าจอในขนาดเล็ก
                mb: { xs: 2, sm: 0 }, // เพิ่ม margin-bottom ในขนาดหน้าจอเล็ก
              }}
            >
              <ArrowBack sx={{ fontSize: "1.5rem" }} />
              ย้อนกลับ
            </Button>

            {/* Dropdown เลือกวันที่ */}
           <Select
              value={selectedDate || ""}
              onChange={(e) => {
                setSelectedDate(e.target.value);
      
              }}
              sx={{
                fontFamily: "Prompt",
                width: { xs: "40%", sm: "auto" }, // ขยาย Select ให้เต็มหน้าจอในขนาดเล็ก
              }}
            >
               {uniqueDays.map((day) => (
                  <MenuItem key={day} value={day}>
                    {formatThaiDay(day || "")}
                  </MenuItem>
                ))}
            </Select>

            <Select
              value={selectedTime || ""}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={!selectedDate}
              sx={{
                fontFamily: "Prompt",
                width: { xs: "40%", sm: "auto" }, // ขยาย Select ให้เต็มหน้าจอในขนาดเล็ก
              }}
            >
              {uniqueTimes.map((time) => (
                <MenuItem key={time} value={time}>
                  {time}
                </MenuItem>
              ))}
            </Select>


            {/* ปุ่มเลื่อนไปวันถัดไป */}
            <Button
              variant="contained"
              onClick={() => setSelectedDate(dates[currentIndex + 1] ?? '')}
              disabled={currentIndex >= dates.length - 1}
              sx={{
                fontFamily: "Prompt",
                fontSize: { xs: "0.8rem", sm: "1rem" },
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#115293" },
                borderRadius: "20px",
                paddingX: "16px",
                width: { xs: "100%", sm: "auto" }, // ให้ปุ่มเต็มหน้าจอในขนาดเล็ก
                mb: { xs: 2, sm: 0 }, // เพิ่ม margin-bottom ในขนาดเล็ก
              }}
            >
              ถัดไป
              <ArrowForward sx={{ fontSize: "1.5rem" }} />
            </Button>
          </Box>
 

        <Box>
          <ReactApexChart options={chartOptions} series={chartSeries} type="line" height={600} />
        </Box>
      </CardContent>
  );
}
export default LongProfileChart;
