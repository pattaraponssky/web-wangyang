import React, { useState } from "react";
import Header from "./components/Layout/Header";
import DrawerComponent from "./components/Layout/Drawer";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AboutUs from "./pages/AboutUs"; // ✅ นำเข้า AboutUs
import { Box } from "@mui/material";
import Footer from "./components/Layout/Footer";
import HecRun from "./pages/HecRun";


const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Router>
        <Box display="flex" flexDirection="column" minHeight="100vh" minWidth="100%" sx={{ backgroundColor: "#f0f0f0" }}>
        <Header setOpen={setDrawerOpen} />
        <Box display="flex" flexGrow={1} mt={8}>
          <DrawerComponent open={drawerOpen} setOpen={setDrawerOpen} />
          <Box flex={1} p={2}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/aboutus" element={<AboutUs />} />
              <Route path="/hecrun" element={<HecRun />} />
            </Routes>
          </Box>
        </Box>
        <Footer/>
      </Box>
    </Router>
  );
};

export default App;
