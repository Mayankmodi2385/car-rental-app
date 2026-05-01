const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bookingRoutes = require("./routes/bookings");
const carRoutes = require("./routes/cars");
const entryRoutes = require("./routes/entries");
const authRoutes = require("./routes/auth");

// Push notifications — loads only if push.js exists
let pushRoutes = null;
let runOverdueCron = null;
try {
  const push = require("./routes/push");
  pushRoutes = push.router;
  runOverdueCron = push.runOverdueCron;
  console.log("✅ Push notifications enabled");
} catch (e) {
  console.log("ℹ️  Push not configured yet:", e.message);
}

const app = express();

// CORS
app.use(cors({
  origin: [
    "https://car-rental-9dze3otf6-mayankmodi7126-9304s-projects.vercel.app",
    "https://car-rental-4vv46ik31-mayankmodi7126-9304s-projects.vercel.app",
    /\.vercel\.app$/,
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ROUTES
app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);
app.use("/cars", carRoutes);
app.use("/entries", entryRoutes);
if (pushRoutes) app.use("/push", pushRoutes);

// Health check
app.get("/", (req, res) => res.json({ status: "DriveKhata API running ✅" }));

// DB + START
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      // Overdue cron every hour — only if push is configured
      if (runOverdueCron) {
        runOverdueCron();
        setInterval(runOverdueCron, 60 * 60 * 1000);
      }
    });
  })
  .catch((err) => console.log("❌ MongoDB Error:", err));