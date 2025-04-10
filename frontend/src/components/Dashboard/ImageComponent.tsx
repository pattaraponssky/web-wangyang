import { Typography } from "@mui/material";
import React, { useRef } from "react";

interface ImageProps {
  src: string;
  alt: string;
  title: string;
  width?: string | number;
  height?: string | number;
  fallbackSrc?: string;
}

const ImageComponent: React.FC<ImageProps> = ({ src, alt, title, width, height, fallbackSrc }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openDialog = () => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  };

  const closeDialog = (e: React.MouseEvent<HTMLDialogElement>) => {
    // ถ้าคลิกที่ dialog แต่ไม่ใช่ที่รูป ให้ปิด dialog
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // ใช้ fallbackSrc ถ้ามี หรือใช้ src เดิมหากไม่มี fallbackSrc
    e.currentTarget.src = fallbackSrc || ""; // ใช้ fallbackSrc หรือค่าเริ่มต้นเป็น string ว่าง
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", fontFamily: "Prompt", maxWidth: "100%" }}>
      <Typography variant="h6" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt", color: "#28378B" }}>
        {title}
      </Typography>
      <img
        src={src}
        alt={alt}
        onClick={openDialog} // คลิกเพื่อเปิดรูปขยาย
        onError={handleError}
        style={{
          width: width ? width : "100%",
          height: height ? height : "auto",
          objectFit: "cover",
          cursor: "pointer", // เปลี่ยนเป็นรูปมือเมื่อ hover
        }}
      />
      
      {/* Dialog แสดงภาพขยาย */}
      <dialog ref={dialogRef} onClick={closeDialog} style={{ border: "none", background: "rgba(0, 0, 0, 0.2)", padding: "20px" }}>
        <img
          src={src}
          alt={alt}
          style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "8px" }}
        />
      </dialog>
    </div>
  );
};

export default ImageComponent;
