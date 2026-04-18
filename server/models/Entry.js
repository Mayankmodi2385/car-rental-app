const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  carName: String,
  startDate: Date,
  endDate: Date,
  pricePerDay: Number,
  totalAmount: Number,
  status: String,
  aadhar: String,
  license: String,
});

module.exports = mongoose.model("Entry", entrySchema);