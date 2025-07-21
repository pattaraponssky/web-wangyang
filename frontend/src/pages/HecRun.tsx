import React from "react";
import { Box, } from "@mui/material";
import RunHecHms from "../components/RunHec/RunHecHms";
import RunHecRas from "../components/RunHec/RunHecRas";
import RainInputTable from "../components/RunHec/InputTable";
import RunGate from "../components/RunHec/RunGate";
import RunAll from '../components/RunHec/RunAll';

const BoxStyle = {
    // maxWidth: "90%",
    margin: "auto",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: 3,
    marginBottom: "20px",
    padding:"20px"
  }

const Hecrun: React.FC = () => {
  return (
    <Box sx={{margin: "auto" }}>
        <Box sx={BoxStyle}>
          <RunAll/>
       </Box>
       <Box sx={BoxStyle}>
          <RainInputTable/>
       </Box>
      {/* <Grid container spacing={2}>
        <Grid item xs={12} md={6} sm={12}>
          <Box sx={BoxStyle}>
            <RunCreateDss />
          </Box>
        </Grid>
        <Grid item xs={12} md={6} sm={12}>
        </Grid>
      </Grid> */}
      <Box sx={BoxStyle}>
          <RunHecHms />
      </Box>
      <Box sx={BoxStyle}>
        <RunHecRas />
      </Box>
      <Box sx={BoxStyle}>
        <RunGate />
      </Box>
    </Box>
  );
};

export default Hecrun;
