const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  carName: String,
  startDate: Date,
  endDate: Date,
  price: Number,
});

module.exports = mongoose.model("Booking", bookingSchema);