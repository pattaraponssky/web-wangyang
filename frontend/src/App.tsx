import React, { useState } from "react";
import Header from "./components/layout/Header";
import DrawerComponent from "./components/layout/Drawer";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AboutUs from "./pages/AboutUs"; // ✅ นำเข้า AboutUs
import { Box } from "@mui/material";
import Footer from "./components/layout/Footer";


const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Router>
      <Header setOpen={setDrawerOpen} />
        <Box display="flex" flexDirection="column" minHeight="100vh" minWidth="100%" sx={{ backgroundColor: "#f0f0f0" }}>
        <Box display="flex" flexGrow={1} mt={8}>
          <DrawerComponent open={drawerOpen} setOpen={setDrawerOpen} />
          <Box flex={1} p={2}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/aboutus" element={<AboutUs />} />
            </Routes>
          </Box>
        </Box>
        <Footer/>
      </Box>
    </Router>
  );
};

export default App;
