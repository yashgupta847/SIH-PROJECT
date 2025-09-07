const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const path = require("path");
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", require("./routes/authRoutes"));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
app.set( "view engine" , "ejs");
app.use(express.static(path.join(__dirname, "public")));
io.on("connection", (socket) => {
  //console.log("New client connected:", socket.id);
  socket.on("sos", (data) => {
    io.emit("alert", { message: "SOS Alert!", data });
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
  // socket.on("Send-location" , (data)=>{
  //    io.emit("Received-location" , {id:socket.id , ...data});
  // });
});
const incidentRoutes = require("./routes/incidentRoutes");
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use("/api/incidents", incidentRoutes);
app.get("/maps" , (req , res)=>{
    res.render("index");
})
app.get("/api/ors-key", (req, res) => {
  res.json({ key: process.env.ORS_API_KEY });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));