const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({
  name: String,
  type: String,
  pricePerDay: Number,
  available: Boolean,
});

module.exports = mongoose.model("Car", carSchema);