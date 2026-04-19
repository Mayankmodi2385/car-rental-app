const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const bookingRoutes = require("./routes/bookings");
const carRoutes = require("./routes/cars");
const entryRoutes = require("./routes/entries");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 ABSOLUTE UPLOAD PATH
const uploadPath = path.resolve(__dirname, "uploads");

console.log("UPLOAD FOLDER:", uploadPath);

// 🔥 SERVE FILES FROM EXACT SAME PATH
app.use("/uploads", express.static(uploadPath));

// ROUTES
app.use("/bookings", bookingRoutes);
app.use("/cars", carRoutes);
app.use("/entries", entryRoutes);

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});