import React from "react";
import { Box } from "@mui/material";
import RunCreateDss from "../components/RunHec/RunCreateDss";
import RunHecHms from "../components/RunHec/RunHecHms";
import RunHecRas from "../components/RunHec/RunHecRas";

const BoxStyle = {
    // maxWidth: "90%",
    margin: "auto",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: 3,
    marginBottom: "20px",
    padding:"20px"
  }

const HecRun: React.FC = () => {
  return (
    <Box sx={{margin: "auto" }}>
    <Box sx={BoxStyle}>
        <RunCreateDss />
      </Box>
      <Box sx={BoxStyle}>
        <RunHecHms />
      </Box>
      <Box sx={BoxStyle}>
        <RunHecRas />
      </Box>
    </Box>
  );
};

export default HecRun;
