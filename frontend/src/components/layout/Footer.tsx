import React from "react";
import { Box, Typography, Container } from "@mui/material";
// import { Link, IconButton } from "@mui/material";
// import { Facebook, Twitter, Instagram, LinkedIn } from "@mui/icons-material";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#fff",
        color: "#000",
        padding: "1.5rem 0",
        textAlign: "center",
        mt: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body1" gutterBottom>
          &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
        </Typography>
        
        {/* <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1 }}>
          <Link href="https://your-privacy-policy-url.com" color="inherit" underline="hover">
            Privacy Policy
          </Link>
          <Link href="https://your-terms-of-service-url.com" color="inherit" underline="hover">
            Terms of Service
          </Link>
        </Box> */}
        
        {/* <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
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
      </Container>
    </Box>
  );
};

export default Footer;
