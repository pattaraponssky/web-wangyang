import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ReactApexChart from 'react-apexcharts';
import { Card, Box, Typography, Grid } from '@mui/material';
import { ApexOptions } from 'apexcharts';
import { Path_File } from '../../utility';

// Define the structure of the raw data parsed from output_ras.csv
interface RawOutputRasDataItem {
  "Date": string;
  "Cross Section": string;
  "Water_Elevation": string;
}

// Define the structure of processed WaterLevelData for internal use
interface WaterLevelDataItem {
  time: string;
  station: string;
  elevation: number;
}

// Define the format ApexCharts expects for its series data
interface ApexChartSeriesData {
  name: string;
  data: [number, number][]; // [timestamp, value]
}

// Define the station mapping directly in this component
const stationMapping: Record<string, number> = {
  "เขื่อนวังยาง": 62093,
  "เขื่อนร้อยเอ็ด": 1158,
  // "E.8A": 112911,
  // "WY": 62093, 
  // "E.66A": 51452,
  // "E.87": 3636,
};

const WaterLevelForecastChart: React.FC = () => {
  const [chartData, setChartData] = useState<ApexChartSeriesData[] | null>(null);

  // Helper function to convert "dd/mm/yyyy HH:MM" to Unix timestamp
  const convertToTimestamp = (dateTimeStr: string): number | null => {
    // 1. Basic validation: check if string is null, undefined, or empty/whitespace
    const trimmedStr = dateTimeStr?.trim();
    if (!trimmedStr) {
      return null;
    }

    // 2. Split into date and time parts
    const dateTimeParts = trimmedStr.split(' ');
    if (dateTimeParts.length !== 2) {
      // Not in "Date Time" format
      return null;
    }
    const [datePart, timePart] = dateTimeParts;

    // 3. Split date part into day, month, year
    const dateSubParts = datePart.split('/');
    if (dateSubParts.length !== 3) {
      // Not in "dd/mm/yyyy" format
      return null;
    }
    const [dayStr, monthStr, yearStr] = dateSubParts;

    // 4. Convert to numbers and validate
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      // Parts are not valid numbers
      return null;
    }

    // 5. Create a Date object from parts (using ISO format for reliability)
    // Month in JavaScript Date is 0-indexed, so subtract 1
    const dateObj = new Date(year, month - 1, day, parseInt(timePart.split(':')[0], 10), parseInt(timePart.split(':')[1], 10));

    // 6. Validate the created Date object (e.g., "31/02/2025" would be invalid)
    if (isNaN(dateObj.getTime())) {
      return null;
    }

    return dateObj.getTime();
  };

  useEffect(() => {
    const csvFilePath = `${Path_File}ras-output/output_ras.csv`;
    fetch(csvFilePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((csvData) => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(), // Trim headers just in case
          complete: (result) => {
            const rawData: RawOutputRasDataItem[] = result.data as RawOutputRasDataItem[];

            // Set the start time for filtering
            const sevenAmToday = new Date();
            // current date is Tuesday, July 29, 2025
            // So we want data from July 22, 2025 at 07:00:00
            sevenAmToday.setDate(sevenAmToday.getDate() - 7);
            sevenAmToday.setHours(7, 0, 0, 0); // Set to 7:00 AM

            const processedData: WaterLevelDataItem[] = [];

            rawData.forEach((row) => {
              const rawTime = row["Date"]; // No trim here, let convertToTimestamp handle it
              const crossSectionRaw = row["Cross Section"];
              const elevationRaw = row["Water_Elevation"];

              // Perform checks before attempting conversions
              if (rawTime === undefined || crossSectionRaw === undefined || elevationRaw === undefined) {
                  // Skip row if essential data is missing
                  console.warn('Skipping row due to missing essential data:', row);
                  return;
              }

              const time = convertToTimestamp(rawTime);
              const crossSectionNum = Number(crossSectionRaw.trim());
              const elevation = parseFloat(elevationRaw.trim());

              const station = Object.keys(stationMapping).find((key) => stationMapping[key] === crossSectionNum) || "";

              // Only add data if all parts are valid and within the time frame
              if (
                time !== null &&
                station !== "" && // Ensure station is found
                !isNaN(elevation) &&
                time >= sevenAmToday.getTime()
              ) {
                processedData.push({ time: new Date(time).toISOString(), station, elevation });
              } else {
                 console.warn('Skipping invalid or out-of-range data point:', { rawTime, crossSectionRaw, elevationRaw, time, station, elevation });
              }
            });

            // Group and format data for ApexCharts
            const groupedData: { [key: string]: [number, number][] } = {};
            processedData.forEach(item => {
              const timestamp = new Date(item.time).getTime(); // Re-convert from ISO string to timestamp
              if (!isNaN(timestamp)) {
                if (!groupedData[item.station]) {
                  groupedData[item.station] = [];
                }
                groupedData[item.station].push([timestamp, item.elevation]);
              }
            });

            const seriesForChart: ApexChartSeriesData[] = Object.keys(groupedData).map(stationName => ({
              name: stationName,
              data: groupedData[stationName].sort((a, b) => a[0] - b[0])
            })).filter(series => series.data.length > 0);

            console.log('Processed series for chart:', seriesForChart);
            setChartData(seriesForChart);
          },
          error: (err: any) => {
            console.error('PapaParse error:', err);
            setChartData(null);
          }
        });
      })
      .catch((error) => {
        console.error('Error fetching output_ras.csv for waterLevelForecastChart:', error);
        setChartData(null);
      });
  }, []);

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
        {chartData &&
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
          })}
        {!chartData && (
          <Grid item xs={12}>
            <Typography sx={{ fontFamily: 'Prompt', textAlign: 'center', mt: 4 }}>
              กำลังโหลดข้อมูล หรือไม่พบข้อมูลการพยากรณ์ระดับน้ำ
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default WaterLevelForecastChart;