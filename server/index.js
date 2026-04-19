const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bookingRoutes = require("./routes/bookings");
const carRoutes = require("./routes/cars");
const entryRoutes = require("./routes/entries");



const app = express();
app.use(cors());
app.use(express.json());

// 👇 ADD THIS (connect routes)
app.use("/bookings", bookingRoutes);
app.use("/cars", carRoutes);
app.use("/entries", entryRoutes);
app.use("/uploads", express.static("uploads"));


// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});