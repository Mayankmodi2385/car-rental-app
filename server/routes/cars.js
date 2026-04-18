const express = require("express");
const router = express.Router();
const Car = require("../models/Car");

// Add car
router.post("/", async (req, res) => {
  const car = await Car.create(req.body);
  res.json(car);
});

// Get all cars
router.get("/", async (req, res) => {
  const cars = await Car.find();
  res.json(cars);
});

module.exports = router;