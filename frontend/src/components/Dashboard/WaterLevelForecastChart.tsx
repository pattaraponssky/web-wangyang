import React from 'react'; // No useState or useEffect needed here anymore
import ReactApexChart from 'react-apexcharts';
import { Card, Box, Typography, Grid } from '@mui/material';
import { ApexOptions } from 'apexcharts';
interface ApexChartSeriesData {
  name: string;
  data: [number, number][]; // [timestamp, value]
}

// Define props for WaterLevelForecastChart
interface WaterLevelForecastChartProps {
  chartData: ApexChartSeriesData[] | null; // <-- Now receives processed chart data directly
  stationMapping: Record<string, number>; // Still needs this for mapping names
}

const WaterLevelForecastChart: React.FC<WaterLevelForecastChartProps> = ({ chartData }) => { // Removed setChartData as it's not managed here
  return (
    <Box sx={{mt:2}}>
      <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ paddingBottom: 2, fontWeight: "bold", fontFamily: "Prompt", color: "#28378B" }}>
          ผลการพยากรณ์ระดับน้ำตำแหน่งสำคัญ 7 วัน ล่วงหน้า
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: 50, height: 4, backgroundColor: '#1E88E5', mr: 1 }} />
          <Typography sx={{ fontFamily: 'Prompt', mr: 2 }}>ค่าตรวจวัดจริง</Typography>

          <Box sx={{ width: 50, height: 0, borderTop: '4px dashed #66BB6A', mr: 1 }} />
          <Typography sx={{ fontFamily: 'Prompt' }}>ค่าพยากรณ์</Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {chartData && chartData.length > 0 ? ( // Added check for chartData.length
          chartData.map((seriesItem: ApexChartSeriesData, index: number) => {
            const normalData = seriesItem.data.slice(0, 169); // Assumed actual data points
            const dashedData = seriesItem.data.slice(169); // Assumed forecast data points

            const annotationXValue = seriesItem.data.length > 169 ? seriesItem.data[169][0] : undefined;

            const options: ApexOptions = {
              chart: {
                id: `chart-water-level-standalone-${index}`,
                fontFamily: 'Prompt',
                type: 'line',
                height: 350,
                zoom: { enabled: false },
              },
              title: {
                text: `สถานี ${seriesItem.name}`,
                align: 'center',
                style: { fontSize: '18px' }
              },
              stroke: { width: 5, curve: 'smooth', dashArray: [0, 8] },
              xaxis: {
                type: 'datetime',
                labels: { datetimeUTC: false, format: 'dd MMM', style: { fontSize: '1rem' } },
                title: { text: 'วันที่-เวลา', style: { fontSize: '1rem' } },
              },
              yaxis: {
                labels: { formatter: (val: any) => Number(val.toFixed(2)).toLocaleString(), style: { fontSize: '1rem' } },
                title: { text: 'ระดับน้ำ (ม.รทก.)', style: { fontSize: '1rem' } },
              },
              tooltip: {
                x: { format: 'dd MMM yyyy HH:mm' },
                y: { formatter: (val: any) => `${Number(val.toFixed(2)).toLocaleString()} ม.รทก.` },
              },
              
              annotations: {
                xaxis: annotationXValue
                  ? [
                      {
                        x: annotationXValue,
                        borderColor: '#FF0000',
                        label: {
                          borderColor: '#000',
                          style: { color: '#fff', background: '#FF0000', fontSize: '1rem' },
                          text: 'ผลพยากรณ์',
                        },
                      },
                    ]
                  : [],
              },
              colors: ['#1E88E5', '#66BB6A'],
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
          })
        ) 
        : 
        (
          <Grid item xs={12}>
            <Typography sx={{ fontFamily: 'Prompt',fontSize:"1rem" ,textAlign: 'center', mt: 4 }}>
              กำลังโหลดข้อมูล หรือไม่พบข้อมูลการพยากรณ์ระดับน้ำ
            </Typography>
          </Grid>
        )
        }
      </Grid>
    </Box>
  );
};

export default WaterLevelForecastChart;