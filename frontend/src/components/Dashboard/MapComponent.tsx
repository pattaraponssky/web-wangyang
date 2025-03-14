import React, { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";

declare global {
  interface Window {
    longdo: any;
  }
}

export let longdo: any;
export let map: any;

interface LongdoMapProps {
  id: string;
  mapKey: string;
  JsonPaths: string[];
  topoJsonPaths?: string[];  // เพิ่ม property นี้
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

    if (map) {
      map.location({ lat: 16.2219, lon: 103.34 }, true);
      map.zoom(11, true);
      setTimeout(() => addGeoJsonMarkers(), 500); // รอให้ map โหลดก่อน
      setTimeout(() => addTopoJsonMarkers(), 500); // รอให้ map โหลดก่อน
      setTimeout(() => addGeoJsonPolygons(), 500); // รอให้ map โหลดก่อน
      setTimeout(() => addGeoJsonLines(), 500); // รอให้ map โหลดก่อน
      addGeoJsonLines
      if (callback) callback();
    } else {
      console.error("ไม่สามารถสร้างแผนที่ได้");
    }
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
                const { MBASIN_T,Area } = feature.properties;
                const geometryType = feature.geometry.type;
                const coordinates = feature.geometry.coordinates;

                let polygonCoordinates: any[] = [];

                if (geometryType === "Polygon") {
                    polygonCoordinates = coordinates[0].map((coord: any) => ({
                        lat: coord[1],  // ค่าละติจูด
                        lon: coord[0],  // ค่าลองจิจูด
                    }));
                } else if (geometryType === "MultiPolygon") {
                    coordinates.forEach((polygon: any) => {
                        polygonCoordinates = polygon[0].map((coord: any) => ({
                            lat: coord[1],  // ค่าละติจูด
                            lon: coord[0],  // ค่าลองจิจูด
                        }));

                        // เพิ่มแต่ละ Polygon แยกกัน
                        const multiPolygon = new longdo.Polygon(polygonCoordinates, {
                          title: `ขอบเขตพื้นที่ศึกษาวังยาง`,
                          detail: `<b>ขนาดพื้นที่:</b> ${Area} ตร.กม.<br>
                          <b>แม่น้ำ:</b> ${MBASIN_T}`,
                          // label: 'ขอบเขตพื้นที่ศึกษาวังยาง',
                          lineWidth: 3,
                          lineColor: 'rgba(0, 0, 0, 0.5)',
                          fillColor: "rgba(0, 255, 255,0.05)",
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
                      lat: coord[1],  // ละติจูด
                      lon: coord[0],  // ลองจิจูด
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
          const { lat, long, Name ,CodeStation  ,Code ,River  ,Basin  ,Detail ,Amphoe ,Province} = feature.properties;
          const position = {

            lat: lat || feature.geometry.coordinates[1],
            lon: long || feature.geometry.coordinates[0],
          };

          if (position.lat && position.lon) {
            let iconHtml = "";

            if (geoJsonData.name === 'DAM Station') {
              iconHtml = `
                <div style="text-align:center;">
                  <img src="./images/icons/reservoir_icon.png" style="width:24px; height:24px;"/>
                  <div style="background-color:white; padding:2px; width:100px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                  ${feature.properties.Name}
                  </div>
                </div>`;
            } else if (geoJsonData.name === 'Rain Station') {
              iconHtml = `
                <div style="text-align:center;">
                  <img src="./images/icons/rain_station_icon.png" style="width:24px; height:24px;" />
                  <div style="background-color:white; padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                    ${feature.properties.Code}
                  </div>
                </div>`;
            } else if (geoJsonData.name === 'Hydro Station') {
              iconHtml = `
                <div style="text-align:center;">
                  <img src="./images/icons/flow_station_icon.png" style="width:24px; height:24px;"/>
                  <div style="background-color:white; padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                  ${feature.properties.CodeStation}
                  </div>
                </div>`;
            } else if (geoJsonData.name === 'ProjectStation') {
              iconHtml = `
                <div style="text-align:center;">
                  <img src="./images/icons/gate_icon.png" style="width:24px; height:24px;"/>
                  <div style="background-color:white; width: 80px;padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                  ${feature.properties.Name}
                  </div>
                </div>`;
            }

            let iconUrl = "";
              if (geoJsonData.name === 'DAM Station') {
                iconUrl = "./images/icons/reservoir_icon.png";
              } else if (geoJsonData.name === 'Rain Station') {
                iconUrl = "./images/icons/rain_station_icon.png";
              } else if (geoJsonData.name === 'Hydro Station') {
                iconUrl = "./images/icons/flow_station_icon.png";
              } else {
                iconUrl = "./images/icons/gate_icon.png";
              }

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
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ล้าน ลบ.ม.</span>` 
                        : geoJsonData.name === 'Rain Station' ? `<span style="font-size:0.9rem; font-weight:bold;">สถานีวัดน้ำฝน: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Name}</span><br>
                        <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ${Amphoe} ${Province}<br> </span>` 
                        : geoJsonData.name === 'Hydro Station' ? `<span style="font-size:0.9rem; font-weight:bold;">รหัสสถานีวัดน้ำท่า: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${CodeStation}</span><br>
                        <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Detail} ${Amphoe} ${Province}<br> </span>` 
                        : `<span style="font-size:0.9rem; font-weight:bold;">สถานีติดตั้วอุปกรณ์วัดน้ำ: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue"> ${Name} </span><br>`
                    ,
                icon: { html: iconHtml },
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

      
  // ฟังก์ชันเพิ่ม Marker จาก TopoJSON
  const addTopoJsonMarkers = () => {
    if (!map || JsonDataList.length === 0) {
        console.log("แผนที่ยังไม่ถูกสร้างหรือไม่มีข้อมูล TopoJSON");
        return;
    }
  
    console.log("กำลังเพิ่ม markers จาก TopoJSON...");
    let newMarkers: any[] = []; // เก็บ Marker ใหม่จาก TopoJSON
  
    JsonDataList.forEach((topoJsonData, index) => {
        console.log(`กำลังประมวลผล TopoJSON object ที่ ${index + 1}`);
        
        if (topoJsonData && topoJsonData.objects) {
            Object.values(topoJsonData.objects).forEach((object: any, objectIndex: number) => {
                console.log(`กำลังประมวลผล object ที่ ${objectIndex + 1}`);
                
                if (object.type === 'GeometryCollection') {
                    object.geometries.forEach((geometry: any, geometryIndex: number) => {
                        console.log(`กำลังประมวลผล geometry ที่ ${geometryIndex + 1}`);
                        
                        if (geometry.type === 'Polygon' && geometry.arcs) {
                            console.log("พบ Polygon geometry");
                            
                            // แปลง TopoJSON เป็น GeoJSON
                            const geoJson = feature(topoJsonData, geometry); // แปลง geometry จาก TopoJSON เป็น GeoJSON
                            console.log("Converted GeoJSON:", geoJson); // ตรวจสอบข้อมูล GeoJSON ที่แปลงแล้ว
                            
                            // ตรวจสอบว่า geoJson.properties มี lat และ long
                            const { lat, lon, Name } = geoJson.properties || {};
                            console.log(`Properties - lat: ${lat}, lon: ${lon}, Name: ${Name}`);
  
                            const position = {
                                lat: lat || (Array.isArray(geoJson.geometry.coordinates[0]) && geoJson.geometry.coordinates[0][1]),
                                lon: lon || (Array.isArray(geoJson.geometry.coordinates[0]) && geoJson.geometry.coordinates[0][0]),
                            };
                            
                            if (position.lat && position.lon) {
                                console.log("ตำแหน่งที่ตั้งของ polygon: ", position);
                                
                                // แสดงข้อมูลเป็น Polygon บนแผนที่
                                const polygonCoordinates = Array.isArray(geoJson.geometry.coordinates[0])
                                    ? geoJson.geometry.coordinates[0].map((coord: any) => ({
                                        lat: coord[1],  // ค่าละติจูด
                                        lon: coord[0],  // ค่าลองจิจูด
                                    }))
                                    : [];
                                
                                console.log("Polygon Coordinates: ", polygonCoordinates);
                                
                                const polygon = new longdo.Polygon(polygonCoordinates, {
                                  title: 'ขอบเขตพื้นที่ศึกษาวังยาง', //Popup title
                                  detail: 'โครงการ..รายละเอียด', //Popup 
                                  // label: 'ขอบเขตพื้นที่ศึกษาวังยาง',
                                  lineWidth: 5,
                                  lineColor: 'rgba(25, 25, 112, 1)',
                                  fillColor: "rgba(0, 255, 255,0.02)",
                                  // visibleRange: { min: 7, max: 18 }, // ปรับระยะการมองเห็น
                                });
                                
  
                                console.log("เพิ่ม Polygon ลงในแผนที่");
                                map.Overlays.add(polygon); // เพิ่ม Polygon ลงในแผนที่
                                newMarkers.push(polygon);
                            } else {
                                console.log("ไม่พบตำแหน่ง lat, lon สำหรับ Polygon นี้");
                            }
                        }
                    });
                }
            });
        } else {
            console.log("ไม่พบข้อมูลใน TopoJSON object หรือ object type ไม่ถูกต้อง");
        }
    });
  
    setMarkers(newMarkers); // อัปเดต state
    console.log("เพิ่ม markers จาก TopoJSON เสร็จเรียบร้อย");
};


  

  return <div ref={mapContainerRef} id={id} style={{ width: "100%", height: "500px" }} />;
};

export default LongdoMap;
