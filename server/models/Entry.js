const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  customerName: { type: String, default: "" },
  carName:      { type: String, required: true },
  startDate:    { type: Date,   required: true },
  startTime:    { type: String, default: "" },
  endDate:      { type: Date,   required: true },
  pricePerDay:  { type: Number, default: 0 },
  totalAmount:  { type: Number, default: 0 },
  status:       { type: String, enum: ["Active", "Completed", "Overdue"], default: "Active" },
  remark:       { type: String, default: "" },
  aadhar:       { type: String, default: null },
  license:      { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Entry", entrySchema);