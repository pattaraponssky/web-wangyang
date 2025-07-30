import React from "react";
import { Paper, Card, CardContent, Typography, Stack, Grid } from "@mui/material";
import { Path_File } from "../../utility";

const cardData = [
  { title: "เขื่อนกั้นน้ํา", value: "3", unit: "แห่ง", image: `${Path_File}images/icons/reservoir_icon.png`, gradient: "linear-gradient(135deg, #64b5f6, #1976d2)" },
  { title: "สถานีวัดน้ำฝน", value: "6", unit: "สถานี", image: `${Path_File}images/icons/rain_station_icon.png`, gradient: "linear-gradient(135deg, #ffd54f, #ff8f00)" },
  { title: "สถานีวัดน้ำท่า", value: "7", unit: "สถานี", image: `${Path_File}images/icons/flow_station_icon.png`, gradient: "linear-gradient(135deg, #4db6ac, #00796b)" },
  { title: "สถานีโครงการ", value: "4", unit: "สถานี", image: `${Path_File}images/icons/gate_icon.png`, gradient: "linear-gradient(135deg, #e57373, #d32f2f)" },
];

const DashboardCards: React.FC = () => {
  return (
    <Grid container spacing={3}>
      {cardData.map((card, index) => (
        <Grid item xs={12} sm={6} lg={3} key={index}>
          <Paper elevation={3} sx={{ borderRadius: 2, padding: 2, background: card.gradient }}>
            <Card sx={{ borderRadius: 2, backgroundColor: "#f5f5f5", color:"#28378B" }}>
              <CardContent>
                <Typography variant="h5" sx={{ fontFamily: "Prompt", color:"#28378B", fontWeight: "bold" }} gutterBottom>
                  {card.title}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <img src={card.image} alt={card.title} style={{ width: "2rem", height: "2rem" }} />
                  <Typography variant="h4" fontWeight={600} sx={{ fontFamily: "Prompt", color:"#28378B" }}>
                    {card.value}
                    <Typography variant="body1" component="span" sx={{ fontSize: "1.2rem", marginLeft: "4px", color:"#28378B" }}>
                      {card.unit}
                    </Typography>
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardCards;
