import React, { useEffect, useRef, useState } from "react";
import ApexCharts from "apexcharts";
import { nowThaiDate } from "../../utility";

declare global {
  interface Window {
    longdo: any;
  }
}
export let longdo: any;
export let map: any;
export let chartId: string;

interface LongdoMapProps {
  id: string;
  mapKey: string;
  JsonPaths: string[];
  topoJsonPaths?: string[];
  rainData?: any;
  flowData?: any;
  eleData?: any;
  wyData?: any;
  callback?: () => void;
}

// Helper function to convert Buddhist Era (BE) year to Common Era (CE) year
const convertBEToCE = (datetimeBE: string): Date | null => {
  const parts = datetimeBE.split(/[\s-:]/);
  if (parts.length < 6) return null;

  let yearBE = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const hour = parseInt(parts[3], 10);
  const minute = parseInt(parts[4], 10);
  const second = parseInt(parts[5], 10);

  if (yearBE >= 2500) {
    yearBE -= 543;
  }

  const date = new Date(yearBE, month - 1, day, hour, minute, second);

  if (isNaN(date.getTime())) {
    console.error("Invalid Date created from:", datetimeBE);
    return null;
  }
  return date;
};


const LongdoMap: React.FC<LongdoMapProps> = ({ mapKey, JsonPaths, rainData, flowData, eleData, wyData }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [JsonDataList, setJsonDataList] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [, setMarkers] = useState<any[]>([]);
  const [aggregatedWyData, setAggregatedWyData] = useState<any>(null);

  // Define stationNameMapping here, or ensure it's accessible
  const stationNameMapping: { [key: string]: string } = {
    "ลานจอดรถเครื่องจักรกลหนัก สชป.6": "สชป.6", 
    "StationB": "station_code_b",
    "โครงการส่งน้ำและบำรุงรักษาชีกลาง": "WY.01",
    "สถานีเขื่อนวังยาง": "WY.02",
    "ณ ด้านเหนือน้ำ บ้านท่าแห": "WY.03",
    "E.66A": "WY.04",
  };


  // Load GeoJSON files
  useEffect(() => {
    const loadJsonFiles = async () => {
      try {
        const JsonDataListPromises = JsonPaths.map(async (path) => {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`Failed to load file: ${path}`);
          const data = await response.json();
          const fileName = path.split('/').pop()?.split('.')[0] || 'unknown';
          return { ...data, name: fileName };
        });

        const JsonDataList = await Promise.all(JsonDataListPromises);
        setJsonDataList(JsonDataList);
        console.log("GeoJSON files loaded successfully:", JsonDataList);
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
      }
    };

    loadJsonFiles();
  }, [JsonPaths]);

  // Aggregate WY data when it's available
  useEffect(() => {
    if (wyData) {
      const transformedWyData: Record<string, {
        rain: Record<string, number>;
        level: Record<string, number>;
        flow: Record<string, number>;
        latestRain: number;
        latestLevel: number;
        latestFlow: number;
      }> = {};

      for (const stationCode in wyData) {
        if (wyData.hasOwnProperty(stationCode) && Array.isArray(wyData[stationCode])) {
          transformedWyData[stationCode] = {
            rain: {},
            level: {},
            flow: {},
            latestRain: 0,
            latestLevel: 0,
            latestFlow: 0,
          };

          let lastRecord: any = null;

          wyData[stationCode].forEach((record: any) => {
            const dateTimeCE = convertBEToCE(record.date);
            if (dateTimeCE) {
              const dateKey = dateTimeCE.toISOString().split('T')[0];

              transformedWyData[stationCode].rain[dateKey] = parseFloat(record.rainfall_sum || '0');
              transformedWyData[stationCode].level[dateKey] = parseFloat(record.water_level || '0');
              transformedWyData[stationCode].flow[dateKey] = parseFloat(record.water_flow || '0');
            }
            lastRecord = record;
          });

          if (lastRecord) {
            transformedWyData[stationCode].latestRain = parseFloat(lastRecord.rainfall_sum || '0');
            transformedWyData[stationCode].latestLevel = parseFloat(lastRecord.water_level || '0');
            transformedWyData[stationCode].latestFlow = parseFloat(lastRecord.water_flow || '0');
          }
        }
      }
      setAggregatedWyData(transformedWyData);
      console.log("Transformed WY Data:", transformedWyData);
    }
  }, [wyData]);

  // Load Longdo Map API script
  useEffect(() => {
    const loadMapScript = () => {
      if (!document.querySelector(`#longdoMapScript`)) {
        const script = document.createElement("script");
        script.src = `https://api.longdo.com/map/?key=${mapKey}`;
        script.id = "longdoMapScript";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
          console.log("Longdo script loaded.");
          if (window.longdo && window.longdo.Map) {
            setIsMapReady(true);
          } else {
            console.error("Longdo object not found in window.");
          }
        };

        script.onerror = () => {
          console.error("Error loading Longdo script.");
        };
      } else {
        if (window.longdo && window.longdo.Map) {
          setIsMapReady(true);
        }
      }
    };

    loadMapScript();
  }, [mapKey]);

  // Initialize map when ready
  useEffect(() => {
    if (isMapReady && mapContainerRef.current) {
      console.log("Longdo Map is ready.");
      initializeMap();
    }
  }, [isMapReady]);

  // Add markers, polygons, lines when data and map are ready
  useEffect(() => {
    if (isMapReady && JsonDataList.length > 0 && aggregatedWyData) {
      console.log("Adding map overlays...");
      if (map) {
        map.location({ lat: 16.20222222, lon: 103.5280556 }, true);
        map.zoom(11, true);
        map.Overlays.clear();
        setMarkers([]);

        addGeoJsonMarkers();
        addGeoJsonPolygons();
        addGeoJsonLines();
      } else {
        console.warn("Map object not initialized when trying to add overlays.");
      }
    }
  }, [JsonDataList, isMapReady, aggregatedWyData, rainData, flowData, eleData]);

  // Map initialization function
  const initializeMap = () => {
    if (!window.longdo) {
      console.error("Map not ready or longdo object not found.");
      return;
    }

    longdo = window.longdo;
    map = new longdo.Map({
      placeholder: mapContainerRef.current,
      language: "th",
      zoom: 6,
      center: { lat: 15.87, lon: 100.99 },
    });
  };

  const addGeoJsonPolygons = () => {
    if (!map) return;

    JsonDataList.forEach((geoJsonData) => {
      if (geoJsonData.name !== "ProjectArea") return;

      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach((feature: any) => {
          const { MBASIN_T, Area } = feature.properties;
          const geometryType = feature.geometry.type;
          const coordinates = feature.geometry.coordinates;

          if (geometryType === "Polygon") {
            const polygonCoordinates = coordinates[0].map((coord: any) => ({
              lat: coord[1],
              lon: coord[0],
            }));
            const polygon = new longdo.Polygon(polygonCoordinates, {
              title: `พื้นที่: ${MBASIN_T}`,
              detail: `<b>ขนาดพื้นที่:</b> ${Area} ตร.กม.`,
              lineColor: "blue",
              lineWidth: 2,
              fillColor: "rgba(0, 255, 255,0.05)",
              visibleRange: { min: 0, max: 12 },
            });
            map.Overlays.add(polygon);
          } else if (geometryType === "MultiPolygon") {
            coordinates.forEach((polygonCoords: any) => {
              const multiPolygonCoordinates = polygonCoords[0].map((coord: any) => ({
                lat: coord[1],
                lon: coord[0],
              }));
              const multiPolygon = new longdo.Polygon(multiPolygonCoordinates, {
                title: `ขอบเขตพื้นที่ศึกษาวังยาง`,
                detail: `<b>ขนาดพื้นที่:</b> ${Area} ตร.กม.<br><b>แม่น้ำ:</b> ${MBASIN_T}`,
                lineWidth: 3,
                lineColor: 'rgba(0, 0, 0, 0.5)',
                fillColor: "rgba(0, 255, 255,0.05)",
                visibleRange: { min: 0, max: 12 },
              });
              map.Overlays.add(multiPolygon);
            });
          }
        });
      }
    });
    console.log("✅ Polygons added to map.");
  };

  const addGeoJsonLines = () => {
    if (!map) return;

    JsonDataList.forEach((geoJsonData) => {
      if (geoJsonData.name !== "River") return;

      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach((feature: any) => {
          const { name_en } = feature.properties;
          const geometryType = feature.geometry.type;
          const coordinates = feature.geometry.coordinates;

          if (geometryType === "LineString") {
            const lineCoordinates = coordinates.map((coord: any) => ({
              lat: coord[1],
              lon: coord[0],
            }));
            const polyline = new longdo.Polyline(lineCoordinates, {
              title: `แม่น้ำ: ${name_en}`,
              lineWidth: 3,
              lineColor: "blue",
              lineStyle: longdo.LineStyle.Solid,
            });
            map.Overlays.add(polyline);
          } else if (geometryType === "MultiLineString") {
            coordinates.forEach((lineCoords: any) => {
              const multiPolylineCoords = lineCoords.map((coord: any) => ({
                lat: coord[1],
                lon: coord[0],
              }));
              const multiPolyline = new longdo.Polyline(multiPolylineCoords, {
                title: `แม่น้ำ: ${name_en}`,
                lineWidth: 3,
                lineColor: "blue",
                lineStyle: longdo.LineStyle.Solid,
              });
              map.Overlays.add(multiPolyline);
            });
          }
        });
      }
    });
    console.log("✅ River lines added to map.");
  };

  const getCommonChartOptions = (
    titleText: string,
    seriesName: string,
    yAxisTitle: string,
    categories: string[],
    type: 'column' | 'line',
    colors: string[],
    data: number[]
  ) => ({
    chart: {
      height: 160,
      fontFamily: 'Prompt',
      zoom: { enabled: false },
      animations: { enabled: false }
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      },
      formatter: function(val: number) {
        return val !== null && !isNaN(val) ? val.toFixed(2) : '-';
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
        dataLabels: {
          position: 'top',
        },
      }
    },
    markers: {
      size: 5,
      strokeColors: '#fff',
      strokeWidth: 2,
      shape: 'circle',
      hover: {
        size: 7,
      }
    },
    title: { text: titleText, align: 'center' },
    series: [{
      name: seriesName,
      type: type,
      data: data
    }],
    yaxis: {
      title: { text: yAxisTitle },
      labels: {
        formatter: function (val: number) {
          return val !== null && !isNaN(val) ? val.toFixed(2) : '';
        }
      }
    },
    xaxis: {
      categories: categories,
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        format: 'dd MMM',
        style: { fontSize: '0.8rem' }
      },
    },
    colors: colors,
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val !== null && !isNaN(val) ? val.toFixed(2) : '-';
        }
      }
    }
  });

  // Function to add Markers from GeoJSON
  const addGeoJsonMarkers = async () => {
    if (!map) {
      console.error("Map not initialized.");
      return;
    }

    let newMarkers: any[] = [];

    const getLatestValueRainHydro = (dataList: any[], stationCode: string, keyName: string): string => {
        // Apply mapping to the stationCode if a mapping exists
        const actualStationCode = stationNameMapping[stationCode] || stationCode;

        if (!Array.isArray(dataList)) return "-";
        const target = dataList.find(item =>
            item.station_code === actualStationCode ||
            item.stationcode === actualStationCode ||
            item.CodeStation === actualStationCode
        );

        if (!target) return "-";

        if (keyName.startsWith('rain_')) {
            const value = target["rain_1_day_ago"];
            return value !== undefined && value !== null ? parseFloat(value).toFixed(2) : "-";
        } else {
            const dateKeys = Object.keys(target).filter(key => /^\d{2}\/\d{2}\/\d{4}$/.test(key));
            const latestDate = dateKeys.sort((a, b) => {
                const [d1, m1, y1] = a.split('/').map(Number);
                const [d2, m2, y2] = b.split('/').map(Number);
                return new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
            })[0];
            const value = target[latestDate];
            return value !== undefined && value !== null ? parseFloat(value).toFixed(2) : "-";
        }
    };

    const getLatestWyValue = (stationCode: string, type: 'rain' | 'level' | 'flow'): string => {
        // Apply mapping to the stationCode if a mapping exists
        const actualStationCode = stationNameMapping[stationCode] || stationCode;

        if (!aggregatedWyData || !aggregatedWyData[actualStationCode]) return "-";
        const data = aggregatedWyData[actualStationCode];
        switch (type) {
            case 'rain': return data.latestRain !== undefined && data.latestRain !== null ? data.latestRain.toFixed(2) : "-";
            case 'level': return data.latestLevel !== undefined && data.latestLevel !== null ? data.latestLevel.toFixed(2) : "-";
            case 'flow': return data.latestFlow !== undefined && data.latestFlow !== null ? data.latestFlow.toFixed(2) : "-";
            default: return "-";
        }
    };

    JsonDataList.forEach((geoJsonData) => {
      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach(async (feature: any) => {
          const { lat, long, Name, CodeStation, Code, River, Basin, Detail, Amphoe, Province } = feature.properties;
          const position = {
            lat: lat || feature.geometry.coordinates[1],
            lon: long || feature.geometry.coordinates[0],
          };

          if (position.lat && position.lon) {
            let iconHtml = "";
            let iconUrl = "";
            let markerTitle = "";
            let markerDetail = "";
            let stationIdForData = ""; // This will be the key used for data lookup

            // ใช้ chartId ที่เป็นเอกลักษณ์สำหรับแต่ละสถานี
            const chartId = `${geoJsonData.name}-${feature.properties.Code || feature.properties.Name || feature.properties.CodeStation}`;
            const buttonContainerId = `button-container-${chartId}`; // ID สำหรับ container ของปุ่ม

            switch (geoJsonData.name) {
              case 'DamStation':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/reservoir_icon.png" style="width:32px; height:32px;"/>
                               <div style="background-color: rgba(255, 255, 255, 0.6); padding:2px; border-radius:5px; font-size: 14px; margin-top: 2px;">
                                ${Name}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/reservoir_icon.png";
                markerTitle = Name;
                markerDetail = `<span style="font-size:0.9rem; font-weight:bold;">ข้อมูลประจำวัน${nowThaiDate() || "วันที่ไม่ทราบ"}<br></span>
                                <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span>
                                <span style="font-size:0.9rem; font-weight:bold; color:blue">${River || "ไม่มีข้อมูล"} ${Basin || "ไม่มีข้อมูล"} ${Detail || "ไม่มีรายละเอียด"}<br> </span>
                                <span style="font-size:0.9rem; font-weight:bold;">ปริมาณกักเก็บ: </span>
                                <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail || "ไม่มีข้อมูล"} ล้าน ลบ.ม.</span>
                                <div id="${buttonContainerId}" style="margin-bottom: 10px;"></div>
                                <div id="${chartId}" style="width: auto; height: auto;"></div>`;
                stationIdForData = Name;
                break;
              case 'RainStation':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/rain_station_icon.png" style="width:32px; height:32px;" />
                               <div style="background-color: rgba(255, 255, 255, 0.6); padding:2px; border-radius:5px; font-size: 14px; margin-top: 2px;">
                                ${Code}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/rain_station_icon.png";
                markerTitle = Code;
                markerDetail = `<span style="font-size:0.9rem; font-weight:bold;">ข้อมูลประจำวัน${nowThaiDate() || "วันที่ไม่ทราบ"}<br></span>
                                <span style="font-size:0.9rem; font-weight:bold;">สถานีวัดน้ำฝน: </span>
                                <span style="font-size:0.9rem; font-weight:bold; color:blue">${Name}</span><br>
                                <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span>
                                <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ${Amphoe} ${Province}<br> </span>
                                <div style="font-size: 0.9rem; line-height: 1.4rem;">
                                    <div><b>📉 ปริมาณน้ำฝน:</b> <span style="color: #1e88e5; font-weight: bold;">${getLatestValueRainHydro(rainData, Name, 'rain_1_day_ago')} มม.</span></div>
                                </div>
                                <div id="${buttonContainerId}" style="margin-bottom: 10px;"></div>
                                <div id="${chartId}" style="width: auto; height: auto;"></div>`;
                stationIdForData = Name; // Use Name for RainStation as it corresponds to station_code in rainData
                break;
              case 'HydroStation':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/flow_station_icon.png" style="width:32px; height:32px;"/>
                               <div style="background-color: rgba(255, 255, 255, 0.6); padding:2px; border-radius:5px; font-size: 14px; margin-top: 2px;">
                                ${CodeStation}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/flow_station_icon.png";
                markerTitle = CodeStation;
                markerDetail = `<span style="font-size:0.9rem; font-weight:bold;">ข้อมูลประจำวัน${nowThaiDate() || "วันที่ไม่ทราบ"}<br></span>
                                <span style="font-size:0.9rem; font-weight:bold;">รหัสสถานีวัดน้ำท่า: </span>
                                <span style="font-size:0.9rem; font-weight:bold; color:blue">${CodeStation}</span><br>
                                <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span>
                                <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ${Amphoe} ${Province}<br> </span>
                                <div style="font-size: 0.9rem; line-height: 1.4rem;">
                                  <div><b>📉 อัตราการไหล:</b> <span style="color: #1e88e5; font-weight: bold;">${getLatestValueRainHydro(flowData, CodeStation, 'flow')} ลบ.ม./วินาที</span></div>
                                </div>
                                <div style="font-size: 0.9rem; line-height: 1.4rem;">
                                  <div><b>📈 ระดับน้ำ:</b> <span style="color: #e53935; font-weight: bold;">${getLatestValueRainHydro(eleData, CodeStation, 'level')} ม.รทก.</span></div>
                                </div>
                                <div id="${buttonContainerId}" style="margin-bottom: 10px;"></div>
                                <div id="${chartId}" style="width: auto; height: auto;"></div>`;
                stationIdForData = CodeStation; // Use CodeStation for HydroStation as it corresponds to stationcode
                break;
              case 'ProjectStation':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/gate_icon.png" style="width:32px; height:32px;"/>
                               <div style="background-color: rgba(255, 255, 255, 0.6); padding:2px; border-radius:5px; font-size: 14px; margin-top: 2px;width:80px;">
                                ${Name}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/gate_icon.png";
                markerTitle = Name;
                // Before displaying, check if the Name has a mapping. If so, use the mapped name for display.
                const displayStationName = stationNameMapping[Name] || Name;
                markerDetail = `<span style="font-size:0.9rem; font-weight:bold;">ข้อมูลประจำวัน${nowThaiDate() || "วันที่ไม่ทราบ"}<br></span>
                                <span style="font-size:0.9rem; font-weight:bold;">สถานีโครงการวังยาง: </span>
                                <span style="font-size:0.9rem; font-weight:bold; color:blue">${displayStationName}</span><br>
                                <div style="font-size: 0.9rem; line-height: 1.4rem;">
                                    <div><b>📉 ปริมาณน้ำฝน:</b> <span style="color: #1e88e5; font-weight: bold;">${getLatestWyValue(Name, 'rain')} มม.</span></div>
                                </div>
                                <div style="font-size: 0.9rem; line-height: 1.4rem;">
                                  <div><b>📈 ระดับน้ำ:</b> <span style="color: #e53935; font-weight: bold;">${getLatestWyValue(Name, 'level')} ม.รทก.</span></div>
                                </div>
                                <div style="font-size: 0.9rem; line-height: 1.4rem;">
                                  <div><b>📊 อัตราการไหล:</b> <span style="color: #008000; font-weight: bold;">${getLatestWyValue(Name, 'flow')} ลบ.ม./วินาที</span></div>
                                </div>
                                <div id="${buttonContainerId}" style="margin-bottom: 10px;"></div>
                                <div id="${chartId}" style="width: auto; height: auto;"></div>`;
                stationIdForData = Name; // Use Name for ProjectStation as it's the key in wyData
                break;
            }

            if (iconHtml) {
              const marker = new longdo.Marker(position, {
                title: `<img src="${iconUrl}" style="width:25px; height:25px; vertical-align:middle; margin-right:5px" />
                        <span style="font-size:1.1rem; font-weight:bold; vertical-align:middle;">
                        ${markerTitle}
                        </span>`,
                detail: markerDetail,
                icon: { html: iconHtml },
                size: { width: 500, height: 'auto' },
                data: {
                  stationType: geoJsonData.name,
                  stationId: stationIdForData, // This is the ID from GeoJSON properties
                  chartId: chartId, // ส่ง chartId ไปด้วย
                  buttonContainerId: buttonContainerId // ส่ง buttonContainerId ไปด้วย
                }
              });

              map.Event.bind("overlayClick", function (overlay: any) {
                if (!overlay.data || !overlay.data.stationId) {
                  return;
                }

                const stationType = overlay.data.stationType;
                const stationGeoJsonId = overlay.data.stationId; // The ID from GeoJSON properties
                const currentChartId = overlay.data.chartId; // ได้รับ chartId จาก data
                const currentButtonContainerId = overlay.data.buttonContainerId; // ได้รับ buttonContainerId จาก data

                // Use the stationNameMapping to get the actual data key
                const actualStationCode = stationNameMapping[stationGeoJsonId] || stationGeoJsonId;

                setTimeout(() => {
                  requestAnimationFrame(() => {
                    const chartContainer = document.getElementById(currentChartId);
                    const buttonContainer = document.getElementById(currentButtonContainerId);

                    if (!chartContainer || !buttonContainer) {
                      console.warn(`❌ Container not found for chart ID: ${currentChartId} or button container ID: ${currentButtonContainerId}`);
                      return;
                    }

                    // ✅ สร้าง CSS class สำหรับปุ่ม ถ้ายังไม่มี
                    if (!document.getElementById('chart-toggle-button-style')) {
                      const style = document.createElement('style');
                      style.id = 'chart-toggle-button-style';
                      style.innerHTML = `
                        .chart-toggle-button {
                          display: inline-block;
                          margin: 4px;
                          padding: 6px 12px;
                          background-color: #f5f5f5;
                          border: 1px solid #888;
                          border-radius: 5px;
                          cursor: pointer;
                          font-size: 0.85rem;
                        }
                        .chart-toggle-button:hover {
                          background-color: #e0e0e0;
                        }
                      `;
                      document.head.appendChild(style);
                    }

                    chartContainer.innerHTML = '';
                    buttonContainer.innerHTML = '';

                    const rainChartDiv = document.createElement('div');
                    const flowChartDiv = document.createElement('div');
                    const eleChartDiv = document.createElement('div');

                    rainChartDiv.style.display = 'none';
                    flowChartDiv.style.display = 'none';
                    eleChartDiv.style.display = 'none';

                    chartContainer.appendChild(rainChartDiv);
                    chartContainer.appendChild(flowChartDiv);
                    chartContainer.appendChild(eleChartDiv);

                    const categories: string[] = [];
                    const today = new Date();
                    for (let i = 6; i >= 0; i--) {
                      const date = new Date(today);
                      date.setDate(today.getDate() - i);
                      categories.push(date.toISOString().split('T')[0]);
                    }

                    // ✅ ใส่ console.log เพื่อตรวจสอบข้อมูล
                    console.log('stationType:', stationType);
                    console.log('actualStationCode:', actualStationCode);

                    if (stationType === 'ProjectStation' && aggregatedWyData && aggregatedWyData[actualStationCode]) {
                      const stationData = aggregatedWyData[actualStationCode];
                      const rainValues: number[] = categories.map(dateKey => stationData.rain[dateKey] || 0);
                      const flowValues: number[] = categories.map(dateKey => stationData.flow[dateKey] || 0);
                      const eleValues: number[] = categories.map(dateKey => stationData.level[dateKey] || 0);

                      if (rainValues.some(val => val > 0)) {
                        const rainToggleButton = document.createElement('button');
                        rainToggleButton.innerText = 'แสดงกราฟน้ำฝน';
                        rainToggleButton.className = 'chart-toggle-button rain';
                        buttonContainer.appendChild(rainToggleButton);
                        new ApexCharts(rainChartDiv, getCommonChartOptions(
                          'ปริมาณน้ำฝน (มม.)', 'ปริมาณน้ำฝน', 'มม.', categories, 'column', ['#1e88e5'], rainValues
                        )).render();
                      }

                      if (flowValues.some(val => val > 0)) {
                        const flowToggleButton = document.createElement('button');
                        flowToggleButton.innerText = 'แสดงกราฟอัตราการไหล';
                        flowToggleButton.className = 'chart-toggle-button flow';
                        buttonContainer.appendChild(flowToggleButton);
                        new ApexCharts(flowChartDiv, getCommonChartOptions(
                          'อัตราการไหล (ลบ.ม./วินาที)', 'อัตราการไหล', 'ลบ.ม./วินาที', categories, 'line', ['#008000'], flowValues
                        )).render();
                      }

                      if (eleValues.some(val => val > 0)) {
                        const eleToggleButton = document.createElement('button');
                        eleToggleButton.innerText = 'แสดงกราฟระดับน้ำ';
                        eleToggleButton.className = 'chart-toggle-button level';
                        buttonContainer.appendChild(eleToggleButton);
                        new ApexCharts(eleChartDiv, getCommonChartOptions(
                          'ระดับน้ำ (ม.รทก.)', 'ระดับน้ำ', 'ม.รทก.', categories, 'line', ['#e53935'], eleValues
                        )).render();
                      }
                    }

                    // ✅ เพิ่ม event click หลังจากสร้างปุ่ม
                    buttonContainer.querySelectorAll('.chart-toggle-button').forEach(button => {
                      button.addEventListener('click', () => {
                        rainChartDiv.style.display = 'none';
                        flowChartDiv.style.display = 'none';
                        eleChartDiv.style.display = 'none';

                        if (button.classList.contains('rain')) rainChartDiv.style.display = 'block';
                        if (button.classList.contains('flow')) flowChartDiv.style.display = 'block';
                        if (button.classList.contains('level')) eleChartDiv.style.display = 'block';
                      });
                    });
                  });
                }, 200);

              });

              newMarkers.push(marker);
              map.Overlays.add(marker);
            }
          }
        });
      }
    });
    setMarkers(newMarkers);
    console.log("✅ Markers added to map successfully.");
  };

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "75vh" }}
    ></div>
  );
};

export default LongdoMap;