import { Typography } from '@mui/material';
import React from 'react';

interface ImageProps {
  src: string;
  alt: string;
  title: string; // เพิ่ม prop สำหรับชื่อหัวข้อ
  width?: string | number; // ความกว้างของรูป
  height?: string | number; // ความสูงของรูป
}

const ImageComponent: React.FC<ImageProps> = ({ src, alt, width, height }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px',fontFamily:"Prompt", maxWidth:"100%"}}>
      <Typography variant="h6" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt", color:"#28378B" }}>
          แผนที่น้ำท่วมพื้นที่วังยาง
        </Typography>
      <img
        src={src}
        alt={alt}
        style={{
          width: width ? width : '70vw', // ถ้าไม่กำหนดความกว้างจะใช้ 60% โดยอัตโนมัติ
          height: height ? height : 'auto', // ถ้าไม่กำหนดความสูงจะใช้ auto โดยอัตโนมัติ
          objectFit: 'cover', // ให้รูปไม่ยืดหรือบิดเบี้ยว
        }}
      />
    </div>
  );
};

export default ImageComponent;
