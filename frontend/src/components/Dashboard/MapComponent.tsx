import React, { useEffect, useRef, useState } from "react";

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
  geoJsonPaths: string[];
  callback?: () => void;
}

const LongdoMap: React.FC<LongdoMapProps> = ({ id, mapKey, geoJsonPaths, callback }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [geoJsonDataList, setGeoJsonDataList] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [markers, setMarkers] = useState<any[]>([]);

  // โหลดไฟล์ GeoJSON
  useEffect(() => {
    const loadGeoJsonFiles = async () => {
      try {
        const geoJsonDataListPromises = geoJsonPaths.map(async (path) => {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`โหลดไฟล์ไม่สำเร็จ: ${path}`);
          return response.json();
        });

        const geoJsonDataList = await Promise.all(geoJsonDataListPromises);
        setGeoJsonDataList(geoJsonDataList);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลด GeoJSON:", error);
      }
    };

    loadGeoJsonFiles();
  }, [geoJsonPaths]);

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
      initializeMap();
    }
  }, [isMapReady]);

  // เมื่อ geoJsonDataList เปลี่ยน ให้เพิ่ม Marker
  useEffect(() => {
    if (isMapReady) {
      addGeoJsonMarkers();
    }
  }, [geoJsonDataList, isMapReady]);

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
      setTimeout(() => addGeoJsonMarkers(), 500); // รอให้ map โหลดก่อน
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

    geoJsonDataList.forEach((geoJsonData) => {
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

            if (iconHtml) {
              const marker = new longdo.Marker(position, {
                title: Res_Name_T || Rain_Station_Code || Level_Station_Code || Name,
                detail: Res_Name_T ? `อ่างเก็บน้ำ: ${Res_Name_T}<br>พื้นที่: ${SubDistrict_Name_T}<br> ${District_Name_T}<br> ${Province_Name_T}<br>ปริมาณกักเก็บ: ${Vol_mcm} ล้าน ลบ.ม.`
                        : Rain_Station_Code ? `รหัสสถานีวัดน้ำฝน: ${Rain_Station_Code} <br>พื้นที่: ${SubDistrict_Name_T}<br>${District_Name_T} ${Province_Name_T}`
                        : Level_Station_Code ? `รหัสสถานีวัดน้ำท่า: ${Level_Station_Code}<br>แม่น้ำ: ${feature.properties.River_Name_E}`
                        : `แม่น้ำ: ${feature.properties.River}`,
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
  };

  return <div ref={mapContainerRef} id={id} style={{ width: "100%", height: "500px" }} />;
};

export default LongdoMap;
