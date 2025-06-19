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
  topoJsonPaths?: string[]; // เพิ่ม property นี้
  rainData?: any;
  flowData?: any;
  eleData?: any;
  callback?: () => void;
}

const LongdoMap: React.FC<LongdoMapProps> = ({ mapKey, JsonPaths, rainData, flowData, eleData }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [JsonDataList, setJsonDataList] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [markers, setMarkers] = useState<any[]>([]);
  
  // โหลดไฟล์ GeoJSON
  useEffect(() => {
    const loadJsonFiles = async () => {
      try {
        // console.log("เริ่มโหลดไฟล์ GeoJSON...");
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

  // เมื่อ JsonDataList หรือ topoJsonDataList เปลี่ยน ให้เพิ่ม Marker
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
  }, [JsonDataList, isMapReady]);

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
                title: `ขอบเขตพื้นที่ศึกษาวังสะตือ`,
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
              detail: `<b>ขนาดพื้นที่:</b> ${Area}  ตร.กม.`,
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

    // console.log("✅ Polygon ถูกเพิ่มลงในแผนที่เรียบร้อย");
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

    // console.log("✅ เพิ่มเส้นแม่น้ำลงในแผนที่เรียบร้อย");
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

    const getLatestValue = (dataList: any[], stationCode: string): string => {
      const target = dataList.find(item =>
        item.stationcode === stationCode ||
        item.station_code === stationCode ||
        item.CodeStation === stationCode
      );
      if (!target) return "-";
    
      const dateKeys = Object.keys(target).filter(key => /^\d{2}\/\d{2}\/\d{4}$/.test(key));
      const latestDate = dateKeys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
      return target.hasOwnProperty(latestDate) ? target[latestDate] : "-";
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
            // console.log("chartId:", chartId);  // เพิ่มเพื่อดูว่า chartId ถูกตั้งค่าอย่างถูกต้อง
      
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
                            <div><b>📉 ปริมาณน้ำฝน:</b> <span style="color: #1e88e5; font-weight: bold;">${getLatestValue(rainData, Code) || "-"} มม.</span></div>
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
                        : 
                        `<span style="font-size:0.9rem; font-weight:bold;">ข้อมูลประจำวัน${nowThaiDate() || "วันที่ไม่ทราบ"}<br></span>
                        <span style="font-size:0.9rem; font-weight:bold;">สถานีติดตั้วอุปกรณ์วัดน้ำ: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Name}</span><br>
                        <div style="font-size: 0.9rem; line-height: 1.4rem;">
                            <div><b>📉 ปริมาณน้ำฝน:</b> <span style="color: #1e88e5; font-weight: bold;">${getLatestValue(rainData, Name) || "-"} มม.</span></div>
                        </div>
                        <div style="font-size: 0.9rem; line-height: 1.4rem;">
                          <div><b>📈 ระดับน้ำ:</b> <span style="color: #e53935; font-weight: bold;">${getLatestValue(eleData, Name)} ม.รทก.</span></div>
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
          
              const stationNameMapping: { [key: string]: string } = {
                "ลานจอดรถเครื่องจักรกลหนัก สชป.6": "สชป.6", 
                "StationB": "station_code_b"
              };

              // เพิ่มการสร้างกราฟสองอันแยกกันและแถบเลือก
              map.Event.bind("overlayClick", function (overlay: any) {
                setTimeout(async () => {
                  const overlayElement = overlay.element();
                  const markerText = overlayElement.innerText;
                  const stationCode = stationNameMapping[markerText] || markerText;
              
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
          
                    const rainStation = rainData.find((s: any) => s.station_code === stationCode);
                    const flowStation = flowData.find((station: { stationcode: string; }) => station.stationcode === stationCode);
                    const eleStation = eleData.find((station: { stationcode: string; }) => station.stationcode === stationCode);
                    // ถ้าไม่พบข้อมูลของสถานี ให้ไม่แสดงกราฟ
                    if (!rainStation && !flowStation && !eleStation) {
                      console.warn("❌ ไม่พบข้อมูลของสถานีนี้");
                      return;
                    }
              
                    const dataKeyFlow = flowStation ? Object.keys(flowStation).filter(key => /\d{2}\/\d{2}\/\d{4}/.test(key)) : [];
                    const dataKeyEle = eleStation ? Object.keys(eleStation).filter(key => /\d{2}\/\d{2}\/\d{4}/.test(key)) : [];
                    const flowValues = dataKeyFlow.length > 0 ? dataKeyFlow.slice(-7).map(key => flowStation[key]).reverse() : [];                                               
                    const eleValues = dataKeyEle.length > 0 ? dataKeyEle.slice(-7).map(key => eleStation[key]).reverse() : [];
             

                    const today = new Date();
                    const labelsFlow = [];
                    for (let i = 7; i >= 1; i--) {
                      const date = new Date(today);
                      date.setDate(today.getDate() + 1 - i); // 7 วันก่อน โดยไม่รวมวันปัจจุบัน
                      labelsFlow.push(date.toISOString().split('T')[0]);
                    }
                    const labelsElevation = [];
                    for (let i = 7; i >= 1; i--) {
                      const date = new Date(today);
                      date.setDate(today.getDate() + 1 - i); // 7 วันก่อน โดยไม่รวมวันปัจจุบัน
                      labelsElevation.push(date.toISOString().split('T')[0]);
                    }
              
                    const labelsRain = [];
                    for (let i = 7; i >= 1; i--) {
                      const date = new Date(today);
                      date.setDate(today.getDate() - i); // ลบวันที่ 1 วันทุกครั้ง
                      labelsRain.push(date.toISOString().split('T')[0]); // เก็บแค่วันที่
                    }
              
                    const rainValues = rainStation ? [
                      rainStation.rain_7_days_ago,
                      rainStation.rain_6_days_ago,
                      rainStation.rain_5_days_ago,
                      rainStation.rain_4_days_ago,
                      rainStation.rain_3_days_ago,
                      rainStation.rain_2_days_ago,
                      rainStation.rain_1_day_ago
                    ] : [];
                   
            
                  if (rainValues.length > 0) {
                    chartContainer.appendChild(rainToggleButton);
                    const rainChartOptions = {
                      ...getCommonChartOptions("ปริมาณน้ำฝนย้อนหลัง 7 วัน", "ปริมาณน้ำฝน (มม.)", "ปริมาณน้ำฝน (มม.)", labelsRain, 'column', ['#008FFB']),
                      series: [{ name: "ปริมาณน้ำฝน (มม.)", data: rainValues, type: 'column' }],
                      xaxis: {
                        ...getCommonChartOptions("ปริมาณน้ำฝนย้อนหลัง 7 วัน", "ปริมาณน้ำฝน (มม.)", "ปริมาณน้ำฝน (มม.)", labelsRain, 'column', ['#008FFB']).xaxis,
                        min: new Date(labelsRain[0]).getTime(),
                        max: new Date(labelsRain[labelsRain.length - 1]).getTime(),
                      }
                    };
                    new ApexCharts(rainChartContainer, rainChartOptions).render();
                  }
        
                  if (flowValues.length > 0) {
                    chartContainer.appendChild(flowToggleButton);
                    const flowChartOptions = {
                      ...getCommonChartOptions("ปริมาณน้ำท่าย้อนหลัง 7 วัน", "ปริมาณน้ำท่า (ลบ.ม./วิ)", "อัตราการไหล (ลบ.ม./วินาที)", labelsFlow, 'line', ['#00E396']),
                      series: [{ name: "ปริมาณน้ำท่า (ลบ.ม./วิ)", data: flowValues, type: 'line' }],
                      xaxis: {
                        ...getCommonChartOptions("ปริมาณน้ำท่าย้อนหลัง 7 วัน", "ปริมาณน้ำท่า (ลบ.ม./วิ)", "อัตราการไหล (ลบ.ม./วินาที)", labelsFlow, 'line', ['#00E396']).xaxis,
                        min: new Date(labelsFlow[0]).getTime(),
                        max: new Date(labelsFlow[labelsFlow.length - 1]).getTime(),
                      }
                    };
                    new ApexCharts(flowChartContainer, flowChartOptions).render();
                  }
        
                  if (eleValues.length > 0) {
                    chartContainer.appendChild(eleToggleButton);
                    const eleChartOptions = {
                      ...getCommonChartOptions("ระดับน้ำย้อนหลัง 7 วัน", "ระดับน้ำ (ม.รทก.)", "ระดับน้ำ (ม.รทก.)", labelsElevation, 'line', ['#ffa046']),
                      series: [{ name: "ระดับน้ำ (ม.รทก.)", data: eleValues, type: 'line' }],
                      xaxis: {
                        ...getCommonChartOptions("ระดับน้ำย้อนหลัง 7 วัน", "ระดับน้ำ (ม.รทก.)", "ระดับน้ำ (ม.รทก.)", labelsElevation, 'line', ['#ffa046']).xaxis,
                        min: new Date(labelsElevation[0]).getTime(),
                        max: new Date(labelsElevation[labelsElevation.length - 1]).getTime(),
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
    // console.log("เพิ่ม markers จาก GeoJSON เสร็จเรียบร้อย");
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
          // console.log(`แสดงข้อมูล Marker: ${MBASIN_T}`);
          marker.popup(`<b>พื้นที่:</b> ${MBASIN_T} <br> <b>ขนาดพื้นที่:</b> ${Area} ตร.กม.`);
        };
      });
    });

    // console.log("✅ เพิ่ม Marker จาก TopoJSON เรียบร้อย");
  };

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "75vh" }}
    ></div>
  );
};

export default LongdoMap;
