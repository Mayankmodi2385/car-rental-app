const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

// CREATE booking
router.post("/", async (req, res) => {
  const { carName, startDate, endDate, price } = req.body;

  // 🚫 Conflict check
  const conflict = await Booking.findOne({
    carName,
    $or: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      },
    ],
  });

  if (conflict) {
    return res.status(400).json({
      message: "Car already booked for these dates ❌",
    });
  }

  const booking = await Booking.create(req.body);
  res.json(booking);
});

// GET all bookings
router.get("/", async (req, res) => {
  const bookings = await Booking.find();
  res.json(bookings);
});

module.exports = router;