const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bookingRoutes = require("./routes/bookings");
const carRoutes = require("./routes/cars");
const entryRoutes = require("./routes/entries");
const authRoutes = require("./routes/auth");

const app = express();

// ✅ CORS — allow your Vercel frontend + localhost dev
app.use(cors({
  origin: [
    "https://car-rental-9dze3otf6-mayankmodi7126-9304s-projects.vercel.app",
    "https://car-rental-4vv46ik31-mayankmodi7126-9304s-projects.vercel.app",
    /\.vercel\.app$/,   // covers any future Vercel preview URLs
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ROUTES
app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);
app.use("/cars", carRoutes);
app.use("/entries", entryRoutes);

// Health check
app.get("/", (req, res) => res.json({ status: "DriveKhata API running ✅" }));

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});