const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["https://dncr.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Dance Studio API is running");
});
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/attendance", require("./routes/attendenceRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/finance", require("./routes/financeRoutes"));
app.use("/api/batches", require("./routes/batchRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/studio", require("./routes/studioRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
