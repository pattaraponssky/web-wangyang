import React from "react";
import { Box, Grid } from "@mui/material";
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
    <Grid container spacing={2}>
      <Grid item xs={12} md={6} sm={12}>
        <Box sx={BoxStyle}>
          <RunCreateDss />
        </Box>
      </Grid>
      <Grid item xs={12} md={6} sm={12}>
        <Box sx={BoxStyle}>
          <RunHecHms />
        </Box>
      </Grid>
    </Grid>
      <Box sx={BoxStyle}>
        <RunHecRas />
      </Box>
    </Box>
  );
};

export default HecRun;
