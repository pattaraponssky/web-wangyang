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
      map.location({ lat: 16.217848, lon: 103.616211 }, true);
      map.zoom(11, true);
      console.log("กำหนดตำแหน่งแผนที่เริ่มต้นที่ 16.217848, 103.616211");
      setTimeout(() => addGeoJsonMarkers(), 500); // รอให้ map โหลดก่อน
      setTimeout(() => addTopoJsonMarkers(), 500); // รอให้ map โหลดก่อน
      if (callback) callback();
    } else {
      console.error("ไม่สามารถสร้างแผนที่ได้");
    }
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
          const { lat, long, Res_Name_T, Vol_mcm, SubDistrict_Name_T, District_Name_T, Province_Name_T, Rain_Station_Code, Level_Station_Code, Name } = feature.properties;

          const position = {
            lat: lat || feature.geometry.coordinates[1],
            lon: long || feature.geometry.coordinates[0],
          };

          if (position.lat && position.lon) {
            let iconHtml = "";

            if (geoJsonData.name === 'Reservoir' && Res_Name_T) {
              iconHtml = `
                <div style="text-align:center;">
                  <img src="./images/icons/reservoir_icon.png" style="width:24px; height:24px;"/>
                  <div style="background-color:white; padding:2px; width:150px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                    ${Res_Name_T}
                  </div>
                </div>`;
            } else if (geoJsonData.name === 'Rain_Station' && Rain_Station_Code) {
              iconHtml = `
                <div style="text-align:center;">
                  <img src="./images/icons/rain_station_icon.png" style="width:24px; height:24px;" />
                  <div style="background-color:white; padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                    ${Rain_Station_Code}
                  </div>
                </div>`;
            } else if (geoJsonData.name === 'Level_Station' && Level_Station_Code) {
              iconHtml = `
                <div style="text-align:center;">
                  <img src="./images/icons/flow_station_icon.png" style="width:24px; height:24px;"/>
                  <div style="background-color:white; padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;">
                    ${Level_Station_Code}
                  </div>
                </div>`;
            } else if (geoJsonData.name === 'Regulator' && Name) {
              iconHtml = `<div style="width:24px; height:24px; background-image:url('./images/icons/gate_icon.png'); background-size:cover;"></div>`;
            }

            let iconUrl = "";
              if (Res_Name_T) {
                iconUrl = "./images/icons/reservoir_icon.png";
              } else if (Rain_Station_Code) {
                iconUrl = "./images/icons/rain_station_icon.png";
              } else if (Level_Station_Code) {
                iconUrl = "./images/icons/flow_station_icon.png";
              } else {
                iconUrl = "./images/icons/gate_icon.png";
              }

            if (iconHtml) {
              const marker = new longdo.Marker(position, {
                title: `<img src="${iconUrl}" style="width:25px; height:25px; vertical-align:middle; margin-right:5px" /> 
                        <span style="font-size:1.1rem; font-weight:bold; vertical-align:middle; "> ${Res_Name_T || Rain_Station_Code || Level_Station_Code || Name} </span>`,
                detail: Res_Name_T ? `<span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${SubDistrict_Name_T} ${District_Name_T} ${Province_Name_T}<br> </span> 
                        <span style="font-size:0.9rem; font-weight:bold;">ปริมาณกักเก็บ: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${Vol_mcm} ล้าน ลบ.ม.</span>` 
                        : Rain_Station_Code ? `<span style="font-size:0.9rem; font-weight:bold;">รหัสสถานีวัดน้ำฝน: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue"> ${Rain_Station_Code} </span><br>
                        <span style="font-size:0.9rem; font-weight:bold;">พื้นที่: </span> 
                        <span style="font-size:0.9rem; font-weight:bold; color:blue">${SubDistrict_Name_T} ${District_Name_T} ${Province_Name_T}<br> </span>` 
                        : Level_Station_Code ? `<span style="font-size:0.9rem; font-weight:bold;">รหัสสถานีวัดน้ำท่า: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue"> ${Level_Station_Code} </span><br>
                        <span style="font-size:0.9rem; font-weight:bold;">แม่น้ำ: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue"> ${feature.properties.River_Name_E} </span><br>` 
                        : `<span style="font-size:0.9rem; font-weight:bold;">แม่น้ำ: </span>
                        <span style="font-size:0.9rem; font-weight:bold; color:blue"> ${feature.properties.River||''} </span><br>`
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
                                  detail: 'รายละเอียด', //Popup 
                                  // label: 'ขอบเขตพื้นที่ศึกษาวังยาง',
                                  lineWidth: 3,
                                  lineColor: 'rgba(0, 0, 0, 1)',
                                  fillColor: "rgba(255, 0, 0,0.02)",
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
