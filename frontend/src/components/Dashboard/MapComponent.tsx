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
  wyData?: any; // Add wyData to props
  callback?: () => void;
}

const LongdoMap: React.FC<LongdoMapProps> = ({ mapKey, JsonPaths, rainData, flowData, eleData, wyData }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [JsonDataList, setJsonDataList] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [markers, setMarkers] = useState<any[]>([]);
  const [aggregatedWyData, setAggregatedWyData] = useState<any>(null);
  
  const stationNameMapping: { [key: string]: string } = {
                  "ลานจอดรถเครื่องจักรกลหนัก สชป.6": "สชป.6", 
                  "StationB": "station_code_b",
                  "โครงการส่งน้ำและบำรุงรักษาชีกลาง": "WY.01",
                  "สถานีเขื่อนวังยาง": "WY.02",
                  "ณ ด้านเหนือน้ำ บ้านท่าแห": "WY.03",
                  "E.66A": "WY.04",
                };

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
  // โหลดไฟล์ GeoJSON
  useEffect(() => {
    const loadJsonFiles = async () => {
      try {
        const JsonDataListPromises = JsonPaths.map(async (path) => {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`โหลดไฟล์ไม่สำเร็จ: ${path}`);
          return response.json();
        });

        const JsonDataList = await Promise.all(JsonDataListPromises);
        setJsonDataList(JsonDataList);
        console.log("โหลดไฟล์ GeoJSON สำเร็จ:", JsonDataList);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลด GeoJSON:", error);
      }
    };

    loadJsonFiles();
  }, [JsonPaths]);

  // โหลด Longdo Map API
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
          console.log("สคริปต์ Longdo โหลดเสร็จแล้ว");
          if (window.longdo && window.longdo.Map) {
            setIsMapReady(true);
          } else {
            console.error("ไม่พบข้อมูล longdo ใน window");
          }
        };

        script.onerror = () => {
          console.error("เกิดข้อผิดพลาดในการโหลดสคริปต์ Longdo");
        };
      } else {
        if (window.longdo && window.longdo.Map) {
          setIsMapReady(true);
        }
      }
    };

    loadMapScript();
  }, [mapKey]);

  // เมื่อแผนที่โหลดเสร็จ ให้เริ่มต้นใช้งานแผนที่
  useEffect(() => {
    if (isMapReady && mapContainerRef.current) {
      console.log("แผนที่ Longdo พร้อมใช้งานแล้ว");
      initializeMap();
    }
  }, [isMapReady]);

   // Transform wyData when it changes
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

  // เมื่อ JsonDataList, topoJsonDataList หรือ transformedWyData เปลี่ยน ให้เพิ่ม Marker
  useEffect(() => {
    if (isMapReady) {
      console.log("กำลังเพิ่ม markers...");
      map.location({ lat: 16.20222222, lon: 103.5280556 }, true);
      map.zoom(11, true);
      addGeoJsonMarkers();
      addTopoJsonMarkers();
      addGeoJsonPolygons();
      addGeoJsonLines();
    }
  }, [JsonDataList, isMapReady, aggregatedWyData, rainData, flowData, eleData]); // Added data dependencies

  // ฟังก์ชันสร้างแผนที่
  const initializeMap = () => {
    if (!window.longdo) {
      console.error("แผนที่ไม่พร้อมหรือไม่พบข้อมูล longdo");
      return;
    }

    longdo = window.longdo;
    map = new longdo.Map({
      placeholder: mapContainerRef.current,
      language: "th",
    });
  };

  const addGeoJsonPolygons = () => {
    if (!map) {
      console.error("แผนที่ยังไม่ถูกสร้างขึ้น");
      return;
    }

    let newPolygons: any[] = []; // เก็บ Polygon ที่สร้างขึ้น

    JsonDataList.forEach((geoJsonData) => {
      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach((feature: any) => {
          const { MBASIN_T, Area } = feature.properties;
          const geometryType = feature.geometry.type;
          const coordinates = feature.geometry.coordinates;

          let polygonCoordinates: any[] = [];

          if (geometryType === "Polygon") {
            polygonCoordinates = coordinates[0].map((coord: any) => ({
              lat: coord[1], // ค่าละติจูด
              lon: coord[0], // ค่าลองจิจูด
            }));
          } else if (geometryType === "MultiPolygon") {
            coordinates.forEach((polygon: any) => {
              polygonCoordinates = polygon[0].map((coord: any) => ({
                lat: coord[1], // ค่าละติจูด
                lon: coord[0], // ค่าลองจิจูด
              }));

              // เพิ่มแต่ละ Polygon แยกกัน
              const multiPolygon = new longdo.Polygon(polygonCoordinates, {
                title: `ขอบเขตพื้นที่ศึกษาวังยาง`,
                detail: `<b>ขนาดพื้นที่:</b> ${Area} ตร.กม.<br>
                          <b>แม่น้ำ:</b> ${MBASIN_T}`,
                lineWidth: 3,
                lineColor: 'rgba(0, 0, 0, 0.5)',
                fillColor: "rgba(0, 255, 255,0.05)",
                visibleRange: { min: 0, max: 12 },
              });

              map.Overlays.add(multiPolygon);
              newPolygons.push(multiPolygon);
            });
          }

          // ถ้าเป็น Polygon ปกติ (ไม่ใช่ MultiPolygon)
          if (polygonCoordinates.length > 0) {
            const polygon = new longdo.Polygon(polygonCoordinates, {
              title: `พื้นที่: ${MBASIN_T}`,
              detail: `<b>ขนาดพื้นที่:</b> ${Area} ตร.กม.`,
              lineColor: "blue",
              lineWidth: 2,
              fillColor: "rgba(0, 255, 255,0.05)",
              visibleRange: { min: 0, max: 12 },
            });

            map.Overlays.add(polygon);
            newPolygons.push(polygon);
          }
        });
      }
    });
  };

  const addGeoJsonLines = () => {
    if (!map) {
      console.error("แผนที่ยังไม่ถูกสร้างขึ้น");
      return;
    }

    let newPolylines: any[] = []; // เก็บเส้นที่สร้างขึ้น

    JsonDataList.forEach((geoJsonData) => {
      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach((feature: any) => {
          const { name_en } = feature.properties;
          const geometryType = feature.geometry.type;
          const coordinates = feature.geometry.coordinates;

          let lineCoordinates: any[] = [];

          if (geometryType === "LineString") {
            lineCoordinates = coordinates.map((coord: any) => ({
              lat: coord[1], // ละติจูด
              lon: coord[0], // ลองจิจูด
            }));
          } else if (geometryType === "MultiLineString") {
            coordinates.forEach((line: any) => {
              const polylineCoords = line.map((coord: any) => ({
                lat: coord[1],
                lon: coord[0],
              }));

              // เพิ่มแต่ละเส้น MultiLineString แยกกัน
              const multiPolyline = new longdo.Polyline(polylineCoords, {
                title: `แม่น้ำ: ${name_en}`,
                lineWidth: 3, // ความหนาของเส้น
                lineColor: "blue", // สีเส้น
                lineStyle: longdo.LineStyle.Solid, // รูปแบบเส้น (Solid = เส้นทึบ)
              });

              map.Overlays.add(multiPolyline);
              newPolylines.push(multiPolyline);
            });
          }

          // ถ้าเป็น LineString ปกติ (ไม่ใช่ MultiLineString)
          if (lineCoordinates.length > 0) {
            const polyline = new longdo.Polyline(lineCoordinates, {
              title: `แม่น้ำ: ${name_en}`,
              lineWidth: 3,
              lineColor: "blue",
              lineStyle: longdo.LineStyle.Solid,
            });

            map.Overlays.add(polyline);
            newPolylines.push(polyline);
          }
        });
      }
    });
  };

  const getCommonChartOptions = (titleText: string, seriesName: string, yAxisTitle: string, categories: string[], type: 'column' | 'line', colors: string[]) => ({
    chart: {
      height: 160, // Slightly increased height for better visibility
      fontFamily: 'Prompt',
      zoom: { enabled: false },
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
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
      data: [] // Data will be set separately
    }],
    yaxis: {
      title: { text: yAxisTitle },
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
    colors: colors
  });

  // ฟังก์ชันเพิ่ม Marker จาก GeoJSON
  const addGeoJsonMarkers = async () => {
    if (!map) {
      console.error("Map ยังไม่ถูกสร้างขึ้น");
      return;
    }
    // ล้าง Marker เก่าทั้งหมด
    markers.forEach(marker => map.Overlays.remove(marker));
    setMarkers([]); // รีเซ็ต state

    let newMarkers: any[] = []; // เก็บ Marker ใหม่

    const getLatestValueRain = (dataList: any[], stationCode: string): string => {
      if (!Array.isArray(dataList)) return "-";
      const target = dataList.find(item =>
        item.station_code === stationCode
      );

      if (!target) return "-";
      const value = target["rain_1_day_ago"];

      return value !== undefined && value !== null ? value.toString() : "-";
    };

    const getLatestValue = (dataList: any[], stationCode: string): string => {
      const target = dataList.find(item =>
        item.stationcode === stationCode ||
        item.CodeStation === stationCode
      );
      if (!target) return "-";

      const dateKeys = Object.keys(target).filter(key => /^\d{2}\/\d{2}\/\d{4}$/.test(key));
      const latestDate = dateKeys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
      return target.hasOwnProperty(latestDate) ? target[latestDate] : "-";
    };

    const getLatestWyValue = (stationNameFromFeature: string, type: 'rain' | 'level' | 'flow'): string => {

      const mappedStationCode = stationNameMapping[stationNameFromFeature] || stationNameFromFeature;

      if (!aggregatedWyData || !aggregatedWyData[mappedStationCode]) return "-"; // Check against mappedStationCode
      const data = aggregatedWyData[mappedStationCode];
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

            // เลือก icon และ iconUrl ตามประเภทสถานี
            switch (geoJsonData.name) {
              case 'DAM Station':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/reservoir_icon.png" style="width:32px; height:32px;"/>
                               <div style="background-color: rgba(255, 255, 255, 0.6); padding:2px; border-radius:5px; font-size: 14px; margin-top: 2px;">
                                ${feature.properties.Name}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/reservoir_icon.png";
                break;
              case 'Rain Station':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/rain_station_icon.png" style="width:32px; height:32px;" />
                               <div style="background-color: rgba(255, 255, 255, 0.6); padding:2px; border-radius:5px; font-size: 14px; margin-top: 2px;">
                                ${feature.properties.Name}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/rain_station_icon.png";
                break;
              case 'Hydro Station':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/flow_station_icon.png" style="width:32px; height:32px;"/>
                               <div style="background-color: rgba(255, 255, 255, 0.6); padding:2px; border-radius:5px; font-size: 14px; margin-top: 2px;">
                                ${feature.properties.CodeStation}
                              </div>

                            </div>`;
                iconUrl = "./images/icons/flow_station_icon.png";
                break;
              case 'ProjectStation':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/gate_icon.png" style="width:32px; height:32px;"/>
                               <div style="background-color: rgba(255, 255, 255, 0.6); padding:2px; border-radius:5px; font-size: 14px; margin-top: 2px;width:80px;">
                                ${feature.properties.Name}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/gate_icon.png";
                break;
            }

            const chartId = `${geoJsonData.name}-${feature.properties.Code || feature.properties.Name || feature.properties.CodeStation}`;

            if (iconHtml) {
              const marker = new longdo.Marker(position, {
                title: `<img src="${iconUrl}" style="width:25px; height:25px; vertical-align:middle; margin-right:5px" />
                        <span style="font-size:1.1rem; font-weight:bold; vertical-align:middle;">
                        ${
                          geoJsonData.name === 'DAM Station' ? Name :
                            geoJsonData.name === 'Rain Station' ? Code :
                              geoJsonData.name === 'Hydro Station' ? CodeStation :
                                geoJsonData.name === 'ProjectStation' ? Name : ""
                        }
                        </span>`,
                detail: geoJsonData.name === 'DAM Station' ?
                        `<span style="font-size:0.9rem; font-weight:bold;">ข้อมูลประจำวัน${nowThaiDate() || "วันที่ไม่ทราบ"}<br></span>
                        <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${River || "ไม่มีข้อมูล"} ${Basin || "ไม่มีข้อมูล"} ${Detail || "ไม่มีรายละเอียด"}<br> </span>
                        <span style="font-size:0.9rem; font-weight:bold;">ปริมาณกักเก็บ: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail || "ไม่มีข้อมูล"} ล้าน ลบ.ม.</span>

                        <div id="${chartId}" style="width: auto; height: auto;"></div>`
                        : geoJsonData.name === 'Rain Station' ?
                        `<span style="font-size:0.9rem; font-weight:bold;">ข้อมูลประจำวัน${nowThaiDate() || "วันที่ไม่ทราบ"}<br></span>
                        <span style="font-size:0.9rem; font-weight:bold;">สถานีวัดน้ำฝน: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Name}</span><br>
                        <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ${Amphoe} ${Province}<br> </span>
                        <div style="font-size: 0.9rem; line-height: 1.4rem;">
                            <div><b>📉 ปริมาณน้ำฝน:</b> <span style="color: #1e88e5; font-weight: bold;">${getLatestValueRain(rainData, Name) || "-"} มม.</span></div>
                        </div>
                        <div id="${chartId}" style="width: auto; height: auto;"></div>
                        `
                        : geoJsonData.name === 'Hydro Station' ?
                        `<span style="font-size:0.9rem; font-weight:bold;">ข้อมูลประจำวัน${nowThaiDate() || "วันที่ไม่ทราบ"}<br></span>
                        <span style="font-size:0.9rem; font-weight:bold;">รหัสสถานีวัดน้ำท่า: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${CodeStation}</span><br>
                        <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ${Amphoe} ${Province}<br> </span>
                        <div style="font-size: 0.9rem; line-height: 1.4rem;">
                          <div><b>📉 อัตราการไหล:</b> <span style="color: #1e88e5; font-weight: bold;">${getLatestValue(flowData, CodeStation)} ลบ.ม./วินาที</span></div>
                        </div>
                        <div style="font-size: 0.9rem; line-height: 1.4rem;">
                          <div><b>📈 ระดับน้ำ:</b> <span style="color: #e53935; font-weight: bold;">${getLatestValue(eleData, CodeStation)} ม.รทก.</span></div>
                        </div>
                        <div id="${chartId}" style="width: auto; height: auto;"></div>`
                        : // This is for ProjectStation
                        `<span style="font-size:0.9rem; font-weight:bold;">ข้อมูลประจำวัน${nowThaiDate() || "วันที่ไม่ทราบ"}<br></span>
                        <span style="font-size:0.9rem; font-weight:bold;">สถานีติดตั้วอุปกรณ์วัดน้ำ: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Name}</span><br>
                        <div style="font-size: 0.9rem; line-height: 1.4rem;">
                            <div><b>📉 ปริมาณน้ำฝน:</b> <span style="color: #1e88e5; font-weight: bold;">${getLatestWyValue(Name, 'rain')} มม.</span></div>
                        </div>
                        <div style="font-size: 0.9rem; line-height: 1.4rem;">
                          <div><b>📈 ระดับน้ำ:</b> <span style="color: #e53935; font-weight: bold;">${getLatestWyValue(Name, 'level')} ม.รทก.</span></div>
                        </div>
                        <div style="font-size: 0.9rem; line-height: 1.4rem;">
                          <div><b>📊 อัตราการไหล:</b> <span style="color: #008000; font-weight: bold;">${getLatestWyValue(Name, 'flow')} ลบ.ม./วินาที</span></div>
                        </div>
                        <div id="${chartId}" style="width: auto; height: auto;"></div>`,
                icon: { html: iconHtml },
                size: { width: 500, height: 'auto' },
                data: {
                  properties: {
                    CodeStation: geoJsonData.name === 'Hydro Station' ? CodeStation : undefined,
                    Code: geoJsonData.name === 'Rain Station' ? Code : undefined,
                    Name: geoJsonData.name === 'DAM Station' || geoJsonData.name === 'ProjectStation' ? Name : undefined,
                  }
                }
              });

             

              // เพิ่มการสร้างกราฟสองอันแยกกันและแถบเลือก
              map.Event.bind("overlayClick", function (overlay: any) {
                setTimeout(async () => {
                  const overlayElement = overlay.element();
                  const markerText = overlayElement.innerText;
                  let stationCode = stationNameMapping[markerText] || markerText;

                  if (!stationCode) {
                    console.warn("❌ ไม่พบรหัสสถานี");
                    return;
                  }

                  const chartContainer = document.getElementById(chartId);

                  // ถ้า chartContainer ไม่มีอยู่ ให้ไม่แสดงกราฟ
                  if (!chartContainer) return;
                  chartContainer.innerHTML = '';

                  // **สร้างปุ่มกดแสดงกราฟน้ำฝน**
                  const rainToggleButton = document.createElement('button');
                  rainToggleButton.innerText = 'แสดงกราฟน้ำฝน';
                  rainToggleButton.style.margin = '5px';
                  rainToggleButton.style.padding = '5px 10px';
                  rainToggleButton.style.backgroundColor = '#007bff';
                  rainToggleButton.style.color = 'white';
                  rainToggleButton.style.border = 'none';
                  rainToggleButton.style.cursor = 'pointer';
                  rainToggleButton.style.borderRadius = '5px';

                  // **สร้างปุ่มกดแสดงกราฟน้ำท่า**
                  const flowToggleButton = document.createElement('button');
                  flowToggleButton.innerText = 'แสดงกราฟน้ำท่า';
                  flowToggleButton.style.margin = '5px';
                  flowToggleButton.style.padding = '5px 10px';
                  flowToggleButton.style.backgroundColor = '#28a745';
                  flowToggleButton.style.color = 'white';
                  flowToggleButton.style.border = 'none';
                  flowToggleButton.style.cursor = 'pointer';
                  flowToggleButton.style.borderRadius = '5px';

                  const eleToggleButton = document.createElement('button');
                  eleToggleButton.innerText = 'แสดงกราฟระดับน้ำ';
                  eleToggleButton.style.margin = '5px';
                  eleToggleButton.style.padding = '5px 10px';
                  eleToggleButton.style.backgroundColor = '#ffa046';
                  eleToggleButton.style.color = 'white';
                  eleToggleButton.style.border = 'none';
                  eleToggleButton.style.cursor = 'pointer';
                  eleToggleButton.style.borderRadius = '5px';

                  // **สร้าง container สำหรับกราฟ**
                  const rainChartContainer = document.createElement('div');
                  const flowChartContainer = document.createElement('div');
                  const eleChartContainer = document.createElement('div');

                  rainChartContainer.style.display = 'none'; // ซ่อนกราฟน้ำฝนตอนแรก
                  flowChartContainer.style.display = 'none'; // ซ่อนกราฟน้ำท่าตอนแรก
                  eleChartContainer.style.display = 'none'; // ซ่อนกราฟน้ำท่าตอนแรก

                  chartContainer.appendChild(rainChartContainer);
                  chartContainer.appendChild(flowChartContainer);
                  chartContainer.appendChild(eleChartContainer);

                  try {
                    let rainStationData, flowStationData, eleStationData;

                    if (geoJsonData.name === 'ProjectStation' && aggregatedWyData && aggregatedWyData[stationCode]) {
                      rainStationData = aggregatedWyData[stationCode].rain;
                      flowStationData = aggregatedWyData[stationCode].flow;
                      eleStationData = aggregatedWyData[stationCode].level;
                    } else {
                      rainStationData = rainData.find((s: any) => s.station_code === stationCode);
                      flowStationData = flowData.find((station: { stationcode: string; }) => station.stationcode === stationCode);
                      eleStationData = eleData.find((station: { stationcode: string; }) => station.stationcode === stationCode);
                    }

                    // If no data found for the station, don't show charts
                    if (!rainStationData && !flowStationData && !eleStationData) {
                      console.warn("❌ ไม่พบข้อมูลของสถานีนี้");
                      return;
                    }

                    const today = new Date();
                    const labels = [];
                    for (let i = 7; i >= 1; i--) {
                      const date = new Date(today);
                      date.setDate(today.getDate() + 1 - i); // 7 วันก่อน โดยไม่รวมวันปัจจุบัน
                      labels.push(date.toISOString().split('T')[0]);
                    }

                    let rainValues: number[] = [];
                    let flowValues: number[] = [];
                    let eleValues: number[] = [];

                  if (geoJsonData.name === 'ProjectStation' && aggregatedWyData && aggregatedWyData[stationCode]) {
                          const rainDataPoints = aggregatedWyData[stationCode].rain;
                          const flowDataPoints = aggregatedWyData[stationCode].flow;
                          const levelDataPoints = aggregatedWyData[stationCode].level;

                          rainValues = labels.map(date => rainDataPoints[date] !== undefined && rainDataPoints[date] !== null ? rainDataPoints[date] : 0);
                          flowValues = labels.map(date => flowDataPoints[date] !== undefined && flowDataPoints[date] !== null ? flowDataPoints[date] : 0);
                          eleValues = labels.map(date => levelDataPoints[date] !== undefined && levelDataPoints[date] !== null ? levelDataPoints[date] : 0);
                      } else {
                      // Existing logic for other station types
                      rainValues = rainStationData ? [
                        rainStationData.rain_7_days_ago,
                        rainStationData.rain_6_days_ago,
                        rainStationData.rain_5_days_ago,
                        rainStationData.rain_4_days_ago,
                        rainStationData.rain_3_days_ago,
                        rainStationData.rain_2_days_ago,
                        rainStationData.rain_1_day_ago
                      ] : [];
                      const dataKeyFlow = flowStationData ? Object.keys(flowStationData).filter(key => /\d{2}\/\d{2}\/\d{4}/.test(key)) : [];
                      const dataKeyEle = eleStationData ? Object.keys(eleStationData).filter(key => /\d{2}\/\d{2}\/\d{4}/.test(key)) : [];
                      flowValues = dataKeyFlow.length > 0 ? dataKeyFlow.slice(-7).map(key => flowStationData[key]).reverse() : [];
                      eleValues = dataKeyEle.length > 0 ? dataKeyEle.slice(-7).map(key => eleStationData[key]).reverse() : [];
                    }


                    if (rainValues.length > 0 && rainValues.some(val => val !== undefined && val !== null)) {
                      chartContainer.appendChild(rainToggleButton);
                      const rainChartOptions = {
                        ...getCommonChartOptions("ปริมาณน้ำฝนย้อนหลัง 7 วัน", "ปริมาณน้ำฝน (มม.)", "ปริมาณน้ำฝน (มม.)", labels, 'column', ['#008FFB']),
                        series: [{ name: "ปริมาณน้ำฝน (มม.)", data: rainValues, type: 'column' }],
                        xaxis: {
                          ...getCommonChartOptions("ปริมาณน้ำฝนย้อนหลัง 7 วัน", "ปริมาณน้ำฝน (มม.)", "ปริมาณน้ำฝน (มม.)", labels, 'column', ['#008FFB']).xaxis,
                          min: new Date(labels[0]).getTime(),
                          max: new Date(labels[labels.length - 1]).getTime(),
                        }
                      };
                      new ApexCharts(rainChartContainer, rainChartOptions).render();
                    }

                    if (flowValues.length > 0 && flowValues.some(val => val !== undefined && val !== null)) {
                      chartContainer.appendChild(flowToggleButton);
                      const flowChartOptions = {
                        ...getCommonChartOptions("ปริมาณน้ำท่าย้อนหลัง 7 วัน", "ปริมาณน้ำท่า (ลบ.ม./วิ)", "อัตราการไหล (ลบ.ม./วินาที)", labels, 'line', ['#00E396']),
                        series: [{ name: "ปริมาณน้ำท่า (ลบ.ม./วิ)", data: flowValues, type: 'line' }],
                        xaxis: {
                          ...getCommonChartOptions("ปริมาณน้ำท่าย้อนหลัง 7 วัน", "ปริมาณน้ำท่า (ลบ.ม./วิ)", "อัตราการไหล (ลบ.ม./วินาที)", labels, 'line', ['#00E396']).xaxis,
                          min: new Date(labels[0]).getTime(),
                          max: new Date(labels[labels.length - 1]).getTime(),
                        }
                      };
                      new ApexCharts(flowChartContainer, flowChartOptions).render();
                    }

                    if (eleValues.length > 0 && eleValues.some(val => val !== undefined && val !== null)) {
                      chartContainer.appendChild(eleToggleButton);
                      const eleChartOptions = {
                        ...getCommonChartOptions("ระดับน้ำย้อนหลัง 7 วัน", "ระดับน้ำ (ม.รทก.)", "ระดับน้ำ (ม.รทก.)", labels, 'line', ['#ffa046']),
                        series: [{ name: "ระดับน้ำ (ม.รทก.)", data: eleValues, type: 'line' }],
                        xaxis: {
                          ...getCommonChartOptions("ระดับน้ำย้อนหลัง 7 วัน", "ระดับน้ำ (ม.รทก.)", "ระดับน้ำ (ม.รทก.)", labels, 'line', ['#ffa046']).xaxis,
                          min: new Date(labels[0]).getTime(),
                          max: new Date(labels[labels.length - 1]).getTime(),
                        }
                      };
                      new ApexCharts(eleChartContainer, eleChartOptions).render();
                    }

                    // **Event สำหรับปุ่มแสดง/ซ่อนกราฟน้ำฝน**
                    rainToggleButton.addEventListener('click', () => {
                      flowChartContainer.style.display = 'none'; // ซ่อนน้ำท่า
                      eleChartContainer.style.display = 'none'; // ซ่อนน้ำท่า
                      setTimeout(() => {
                        if (rainChartContainer.style.display === 'none') {
                          rainChartContainer.style.display = 'block';
                        } else {
                          rainChartContainer.style.display = 'none';
                        }
                      }, 200); // หน่วงเวลา 100ms
                    });

                    flowToggleButton.addEventListener('click', () => {
                      rainChartContainer.style.display = 'none'; // ซ่อนน้ำฝน
                      eleChartContainer.style.display = 'none';
                      setTimeout(() => {
                        if (flowChartContainer.style.display === 'none') {
                          flowChartContainer.style.display = 'block';
                        } else {
                          flowChartContainer.style.display = 'none';
                        }
                      }, 200); // หน่วงเวลา 100ms
                    });

                    eleToggleButton.addEventListener('click', () => {
                      flowChartContainer.style.display = 'none'; // ซ่อนน้ำท่า
                      rainChartContainer.style.display = 'none';
                      setTimeout(() => {
                        if (eleChartContainer.style.display === 'none') {
                          eleChartContainer.style.display = 'block';
                        } else {
                          eleChartContainer.style.display = 'none';
                        }
                      }, 200); // หน่วงเวลา 100ms
                    });

                  } catch (error) {
                    console.error("❌ ดึงข้อมูลสถานีล้มเหลว:", error);
                  }
                }, 100);
              });
              map.Overlays.add(marker);
              newMarkers.push(marker);
            }
          }
        });
      }
    });

    setMarkers(newMarkers); // อัปเดต state
  };

  const addTopoJsonMarkers = () => {
    if (!map) {
      console.error("Map ยังไม่ถูกสร้างขึ้น");
      return;
    }

    JsonDataList.forEach((geoJsonData) => {
      geoJsonData.features.forEach((feature: any) => {
        const { MBASIN_T, Area } = feature.properties;
        const coordinates = feature.geometry.coordinates[0];

        const marker = new longdo.Marker(
          { lat: coordinates[1], lon: coordinates[0] },
          {
            title: `พื้นที่: ${MBASIN_T}`,
            detail: `<b>ขนาดพื้นที่:</b> ${Area} ตร.กม.`,
          }
        );

        map.Overlays.add(marker);
        marker.onclick = () => {
          marker.popup(`<b>พื้นที่:</b> ${MBASIN_T} <br> <b>ขนาดพื้นที่:</b> ${Area} ตร.กม.`);
        };
      });
    });
  };

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "75vh" }}
    ></div>
  );
};

export default LongdoMap;