import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ReactApexChart from 'react-apexcharts';
import { Card, Box, Typography, Grid } from '@mui/material';
import { ApexOptions } from 'apexcharts';
import { Path_File } from '../../utility';


const WaterForecastChart: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const csvFilePath = `${Path_File}ras-output/sta_flow.csv`;
    fetch(csvFilePath)
      .then((response) => response.text())
      .then((csvData) => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const data = result.data;
              
            const now = new Date();
            const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 7, 0, 0).getTime();
            
            const filteredData = data.filter((item: any) => {
              const timestamp = convertToTimestamp(item.DateTime);
              return timestamp && timestamp >= startTime;
            });

            const seriesData = [
              { name: 'E.91', data: filteredData.map((item: any) => [convertToTimestamp(item.DateTime), parseFloat(item['E.91']) || 0]) },
              { name: 'E.1', data: filteredData.map((item: any) => [convertToTimestamp(item.DateTime), parseFloat(item['E.1']) || 0]) },
              { name: 'E.8A', data: filteredData.map((item: any) => [convertToTimestamp(item.DateTime), parseFloat(item['E.8A']) || 0]) },
              { name: 'เขื่อนวังยาง', data: filteredData.map((item: any) => [convertToTimestamp(item.DateTime), parseFloat(item['WY']) || 0]) },
              { name: 'E.66A', data: filteredData.map((item: any) => [convertToTimestamp(item.DateTime), parseFloat(item['E.66A']) || 0]) },
              { name: 'E.87', data: filteredData.map((item: any) => [convertToTimestamp(item.DateTime), parseFloat(item['E.87']) || 0]) },
            ];
  
            setChartData(seriesData);
          },
        });
      })
      .catch((error) => console.error('Error fetching the CSV file:', error));
  }, []);
  

  const convertToTimestamp = (dateTimeStr: string) => {
    if (!dateTimeStr) return null;
    const [day, month, yearAndTime] = dateTimeStr.split('/');
    const [year, time] = yearAndTime.split(' ');
    const formattedDateTime = new Date(`${year}-${month}-${day}T${time}`).getTime();
    return isNaN(formattedDateTime) ? null : formattedDateTime;
  };

  return (
    <Box >
      <Box sx={{display:"flex",flexDirection:"row",justifyContent:"space-between"}}>
        <Typography variant="h6" sx={{ paddingBottom: 2, fontWeight: "bold", fontFamily: "Prompt" ,color:"#28378B"}}>
          ผลการพยากรณ์ปริมาณน้ำท่าตำแหน่งสำคัญ 7 วัน ล่วงหน้า
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: 50, height: 4, backgroundColor: '#1E88E5', mr: 1 }} />
          <Typography sx={{ fontFamily: 'Prompt', mr: 2 }}>ค่าตรวจวัดจริง</Typography>

          <Box sx={{ width: 50, height: 0, borderTop: '4px dashed #66BB6A', mr: 1 }} />
          <Typography sx={{ fontFamily: 'Prompt' }}>ค่าพยากรณ์</Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {chartData &&
          chartData.map((seriesItem: any, index: number) => {
            const normalData = seriesItem.data.slice(0, 169); // ข้อมูลก่อน 72
            const dashedData = seriesItem.data.slice(169); // ข้อมูลตั้งแต่ 72 ขึ้นไป (เส้นปะ)

            const options: ApexOptions = {
              chart: { id: `chart-${index}`, fontFamily: 'Prompt', type: 'line', height: 350 , zoom: {
                enabled: false, // ปิดการซูม
              },},
              title: { text: `สถานีน้ำท่า ${seriesItem.name}`, align: 'center', style: { fontSize: '18px' } },
              stroke: { width: 5, curve: 'smooth', dashArray: [0, 8] }, // [0 = เส้นปกติ, 5 = เส้นปะ]
              xaxis: {
                type: 'datetime',
                labels: { datetimeUTC: false, format: 'dd MMM', style: { fontSize: '1rem' } },
              },
              yaxis: {
                labels: { formatter: (val: any) => Number(val.toFixed(2)).toLocaleString(), style: { fontSize: '1rem' } },
                title: { text: 'อัตราการไหล (ลบ.ม./วินาที)', style: { fontSize: '1rem' } },
              },
              tooltip: {
                x: { format: 'dd MMM yyyy HH:mm' },
                y: { formatter: (val: any) => `${Number(val.toFixed(2)).toLocaleString()} ลบ.ม./วินาที` },
              },
              
              annotations: {
                xaxis: [
                  {
                    x: seriesItem.data[169]?.[0],
                    borderColor: '#FF0000',
                    label: {
                      borderColor: '#000',
                      style: { color: '#fff', background: '#FF0000' ,fontSize:'1rem'},
                      text: 'ผลพยากรณ์',
                    },
                  },
                ],
              },
            };

            return (
              <Grid item xs={12} sm={6} key={index}>
                <Card sx={{ borderRadius: 2, boxShadow: 3, my: 2, paddingTop: '10px' }}>
                  <ReactApexChart
                    options={options}
                    series={[
                      { name: `${seriesItem.name} (ค่าตรวจวัดจริง)`, data: normalData },
                      { name: `${seriesItem.name} (ค่าพยากรณ์)`, data: dashedData }
                    ]}
                    type="line"
                    height={350}
                  />
                </Card>
              </Grid>
            );
          })}
      </Grid>
    </Box>
  );
};

export default WaterForecastChart;
