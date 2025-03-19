import React, { useEffect, useRef, useState } from "react";
import ApexCharts from "apexcharts";

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
  callback?: () => void;
}

const LongdoMap: React.FC<LongdoMapProps> = ({ id, mapKey, JsonPaths, callback }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [JsonDataList, setJsonDataList] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [markers, setMarkers] = useState<any[]>([]);

  // โหลดไฟล์ GeoJSON
  useEffect(() => {
    const loadJsonFiles = async () => {
      try {
        console.log("เริ่มโหลดไฟล์ GeoJSON...");
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
      addTopoJsonMarkers(); // เพิ่มการแสดงผลจาก TopoJSON
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

    console.log("✅ Polygon ถูกเพิ่มลงในแผนที่เรียบร้อย");
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

    console.log("✅ เพิ่มเส้นแม่น้ำลงในแผนที่เรียบร้อย");
  };

  // ฟังก์ชันเพิ่ม Marker จาก GeoJSON
  const addGeoJsonMarkers = () => {
  if (!map) {
      console.error("Map ยังไม่ถูกสร้างขึ้น");
      return;
    }

    // ล้าง Marker เก่าทั้งหมด
    markers.forEach(marker => map.Overlays.remove(marker));
    setMarkers([]); // รีเซ็ต state

    let newMarkers: any[] = []; // เก็บ Marker ใหม่

    JsonDataList.forEach((geoJsonData) => {
      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach((feature: any) => {
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
                              <img src="./images/icons/reservoir_icon.png" style="width:24px; height:24px;"/>
                              <div style="background-color:white; padding:2px; width:100px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                                ${feature.properties.Name}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/reservoir_icon.png";
                break;
              case 'Rain Station':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/rain_station_icon.png" style="width:24px; height:24px;" />
                              <div style="background-color:white; padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                                ${feature.properties.Name}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/rain_station_icon.png";
                break;
              case 'Hydro Station':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/flow_station_icon.png" style="width:24px; height:24px;"/>
                              <div style="background-color:white; padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                                ${feature.properties.CodeStation}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/flow_station_icon.png";
                break;
              case 'ProjectStation':
                iconHtml = `<div style="text-align:center;">
                              <img src="./images/icons/gate_icon.png" style="width:24px; height:24px;"/>
                              <div style="background-color:white; width: 80px;padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                                ${feature.properties.Name}
                              </div>
                            </div>`;
                iconUrl = "./images/icons/gate_icon.png";
                break;
            }

            const chartId = `${geoJsonData.name}-${feature.properties.Code || feature.properties.Name || feature.properties.CodeStation}`;
            console.log("chartId:", chartId);  // เพิ่มเพื่อดูว่า chartId ถูกตั้งค่าอย่างถูกต้อง

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
                detail: geoJsonData.name === 'DAM Station' ? `<span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${River} ${Basin} ${Detail}<br> </span> 
                        <span style="font-size:0.9rem; font-weight:bold;">ปริมาณกักเก็บ: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ล้าน ลบ.ม.</span> 
                        <div id="${chartId}" style="width: auto; height: auto; padding-top: 20px;"></div>` 
                  : geoJsonData.name === 'Rain Station' ? `<span style="font-size:0.9rem; font-weight:bold;">สถานีวัดน้ำฝน: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Name}</span><br>
                        <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ${Amphoe} ${Province}<br> </span>
                        <div id="${chartId}" style="width: auto; height: auto; padding-top: 20px;"></div>` 
                  : geoJsonData.name === 'Hydro Station' ? `<span style="font-size:0.9rem; font-weight:bold;">รหัสสถานีวัดน้ำท่า: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${CodeStation}</span><br>
                        <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ${Amphoe} ${Province}<br> </span>
                        <div id="${chartId}" style="width: auto; height: auto; padding-top: 20px;"></div>` 
                  : `<span style="font-size:0.9rem; font-weight:bold;">สถานีติดตั้วอุปกรณ์วัดน้ำ: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue"> ${Name} </span><br>
                        <div id="${chartId}" style="width: auto; height: auto; padding-top: 20px;"></div>` ,
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
                  // เพิ่มการจับคู่ตามที่ต้องการ
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
                    const rainChartContainer = document.createElement('div');
                    const flowChartContainer = document.createElement('div');
           
                    // เพิ่มกราฟทั้งสองกราฟลงใน chartContainer
                    chartContainer.appendChild(rainChartContainer);
                    chartContainer.appendChild(flowChartContainer);
                
                    try {
                      const [rainData, flowData] = await Promise.all([
                        fetch("http://localhost/code-xampp/API/api_rain_hydro3.php").then(res => res.json()),
                        fetch("http://localhost/code-xampp/API/api_flow_hydro3.php").then(res => res.json())
                      ]);
                
                      console.log("rainData:", rainData);
                      console.log("flowData:", flowData);
                
                      const rainStation = rainData.find((s: any) => s.station_code === stationCode);
                      const flowStation = flowData.find((station: { stationcode: string; }) => station.stationcode === stationCode);
                
                      // ถ้าไม่พบข้อมูลของสถานี ให้ไม่แสดงกราฟ
                      if (!rainStation && !flowStation) {
                        console.warn("❌ ไม่พบข้อมูลของสถานีนี้");
                        return;
                      }
                
                      const today = new Date();
                      const labels = [];
                      for (let i = 7; i >= 1; i--) {
                        const date = new Date(today);
                        date.setDate(today.getDate() + 1 - i);
                        labels.push(date.toISOString().split('T')[0]);
                      }
                
                      const rainValues = rainStation ? [
                        rainStation.rain_6_days_ago,
                        rainStation.rain_5_days_ago,
                        rainStation.rain_4_days_ago,
                        rainStation.rain_3_days_ago,
                        rainStation.rain_2_days_ago,
                        rainStation.rain_1_day_ago
                      ] : [];
                
                      const dateKeys = Object.keys(flowStation).filter(key => /\d{2}\/\d{2}\/\d{4}/.test(key));
                      const flowValues = dateKeys.length > 0 ? dateKeys.slice(-7).map(key => flowStation[key]).reverse() : [];
                
                      // ถ้ามีข้อมูลน้ำฝน, แสดงกราฟน้ำฝน
                      if (rainValues.length > 0) {
                        const rainChart = new ApexCharts(rainChartContainer, {
                          chart: {
                            height: 200,
                            fontFamily: 'Prompt',
                            zoom: { enabled: false },
                          },
                          title: { text: "ปริมาณน้ำฝนย้อนหลัง 7 วัน", align: 'center' },
                          series: [{
                            name: "ปริมาณน้ำฝน (มม.)",
                            data: rainValues,
                            type: 'column'
                          }],
                          xaxis: {
                            categories: labels,
                            type: 'datetime',
                            min: new Date(labels[0]).getTime(),
                            max: new Date(labels[labels.length - 1]).getTime(),
                            labels: {
                              datetimeUTC: false,
                              format: 'dd MMM',
                              style: { fontSize: '0.8rem' }
                            },
                          },
                          colors: ['#008FFB']
                        });
                        rainChart.render();
                      } else {
                        rainChartContainer.style.display = 'none'; // ซ่อนกราฟน้ำฝนถ้าไม่มีข้อมูล
                      }
                
                      // ถ้ามีข้อมูลน้ำท่า, แสดงกราฟน้ำท่า
                      if (flowValues.length > 0) {
                        const flowChart = new ApexCharts(flowChartContainer, {
                          chart: {
                            height: 200,
                            fontFamily: 'Prompt',
                            zoom: { enabled: false },
                          },
                          title: { text: "ปริมาณน้ำท่าย้อนหลัง 7 วัน", align: 'center' },
                          series: [{
                            name: "ปริมาณน้ำท่า (ลบ.ม./วิ)",
                            data: flowValues,
                            type: 'line'
                          }],
                          xaxis: {
                            categories: labels,
                            type: 'datetime',
                            min: new Date(labels[0]).getTime(),
                            max: new Date(labels[labels.length - 1]).getTime(),
                            labels: {
                              datetimeUTC: false,
                              format: 'dd MMM',
                              style: { fontSize: '0.8rem' }
                            },
                          },
                          colors: ['#00E396']
                        });
                        flowChart.render();
                      } else {
                        flowChartContainer.style.display = 'none'; // ซ่อนกราฟน้ำท่าถ้าไม่มีข้อมูล
                      }
                
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
    console.log("เพิ่ม markers จาก GeoJSON เสร็จเรียบร้อย");
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
          console.log(`แสดงข้อมูล Marker: ${MBASIN_T}`);
          marker.popup(`<b>พื้นที่:</b> ${MBASIN_T} <br> <b>ขนาดพื้นที่:</b> ${Area} ตร.กม.`);
        };
      });
    });

    console.log("✅ เพิ่ม Marker จาก TopoJSON เรียบร้อย");
  };

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "600px" }}
    ></div>
  );
};

export default LongdoMap;
