const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
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
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("sos", (data) => {
    console.log("SOS received:", data);
    io.emit("alert", { message: "SOS Alert!", data });
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
const incidentRoutes = require("./routes/incidentRoutes");
app.use((req, res, next) => {
  req.io = io; 
  next();
});
app.use("/api/incidents", incidentRoutes);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));