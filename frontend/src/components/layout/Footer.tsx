import React from "react";
import { Box, Typography, Container, Grid, Link, IconButton } from "@mui/material";
import { Facebook, Twitter, Instagram, LinkedIn, LocationOn, Web } from "@mui/icons-material";

const footerStyles = {
  fontFamily: "Prompt",
  fontSize: "1.1rem",
};

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        fontFamily: "Prompt",
        // background: "linear-gradient(to bottom, #adf6fe, #1976D2)", // ไล่สีจากฟ้าอ่อน (บน) ไปเข้ม (ล่าง)
        backgroundImage: "url(./images/bg_footer.jpg)", // ใส่ภาพพื้นหลัง
        color: "#fff", // เปลี่ยนสีตัวอักษรให้เป็นสีขาวเพื่อให้ตัดกับพื้นหลัง
        padding: "1rem 0",
        textAlign: "center",
        mt: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Left Section - Address */}
          <Grid item xs={12} sm={6}>
            {/* Header with Icon */}
            <Typography variant="h6" sx={{ ...footerStyles, fontWeight: "600" }} gutterBottom>
              <LocationOn sx={{ verticalAlign: "middle", marginRight: "8px",   }} /> กรมชลประทาน
            </Typography>

            <Typography variant="body1" sx={footerStyles}>
              811 ถ.สามเสน แขวงถนนนครไชยศรี เขตดุสิต กรุงเทพมหานคร 10300
            </Typography>
            <Typography variant="body1" sx={footerStyles}>
              สายด่วน 1460 ชลประทาน บริการประชาชน
            </Typography>
            <Typography variant="body1" sx={footerStyles}>
              ตู้ปณ. 1460 ปณฝ. บางกระบือ เขตดุสิต กทม. 10301
            </Typography>
      
          </Grid>

          {/* Right Section - Contact */}
          <Grid item xs={12} sm={6}>
            {/* Header with Icon */}
            {/* <Typography variant="h6" sx={{ ...footerStyles, fontWeight: "600" }} gutterBottom>
              <Web sx={{ verticalAlign: "middle", marginRight: "8px" }} /> ช่องทางติดต่อ
            </Typography> */}

            <Typography variant="body1" sx={footerStyles}>
              <Link
                href="http://www.rid.go.th"
                target="_blank"
                rel="noopener noreferrer"
       
                sx={{ verticalAlign: "middle", marginRight: "8px" ,fontWeight: 600, color: "#fff", textDecoration: "none" }}
              >
                🌐 www.rid.go.th
              </Link>
            </Typography>
            <Typography variant="body1" gutterBottom sx={footerStyles}>
              เบอร์ติดต่อ: 02-241-0020 ถึง 29
            </Typography>
            {/* Social Media Icons */}
            {/* <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1 }}>
              <IconButton href="https://facebook.com" color="inherit" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton href="https://twitter.com" color="inherit" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton href="https://instagram.com" color="inherit" aria-label="Instagram">
                <Instagram />
              </IconButton>
              <IconButton href="https://linkedin.com" color="inherit" aria-label="LinkedIn">
                <LinkedIn />
              </IconButton>
            </Box> */}

            <Typography variant="body2" sx={{ marginTop: "1rem", color: "#ddd" }}>
              &copy; {new Date().getFullYear()} กรมชลประทาน. All rights reserved.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;
