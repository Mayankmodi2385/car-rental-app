const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); // 🔥 IMPORTANT (you missed this)

const bookingRoutes = require("./routes/bookings");
const carRoutes = require("./routes/cars");
const entryRoutes = require("./routes/entries");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 SERVE UPLOADS (FIXED)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROUTES
app.use("/bookings", bookingRoutes);
app.use("/cars", carRoutes);
app.use("/entries", entryRoutes);

// CONNECT MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// START SERVER
app.listen(5000, () => {
  console.log("Server running on port 5000");
});