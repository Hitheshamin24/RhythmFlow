const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json())

connectDB();

app.get("/",(req,res)=>{
    res.send("Dance Studio API is running")
})
app.use("/api/auth",require("./routes/authRoutes"))
app.use("/api/students",require("./routes/studentRoutes"))
app.use("/api/attendance",require("./routes/attendenceRoutes"))
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/finance", require("./routes/financeRoutes"));

const PORT=process.env.PORT||5000
app.listen(PORT,()=>{
    console.log(`server running on ${PORT}`)
})