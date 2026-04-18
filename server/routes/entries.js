const express = require("express");
const router = express.Router();
const Entry = require("../models/Entry");

const multer = require("multer");

// 📂 STORAGE CONFIG
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// 🚀 CREATE ENTRY (WITH FILE UPLOAD)
router.post(
  "/",
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { carName, startDate, endDate, pricePerDay } = req.body;

      const days =
        (new Date(endDate) - new Date(startDate)) /
        (1000 * 60 * 60 * 24);

      const totalAmount = days * pricePerDay;

      const entry = await Entry.create({
        carName,
        startDate,
        endDate,
        pricePerDay,
        totalAmount,
        status: "Active",

        // ✅ SAFE FILE HANDLING
        aadhar:
          req.files && req.files.aadhar
            ? req.files.aadhar[0].filename
            : null,

        license:
          req.files && req.files.license
            ? req.files.license[0].filename
            : null,
      });

      res.json(entry);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error creating entry" });
    }
  }
);

// 📥 GET ALL ENTRIES
router.get("/", async (req, res) => {
  try {
    const data = await Entry.find().sort({ startDate: -1 });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching entries" });
  }
});

// ✅ MARK COMPLETE
router.put("/:id", async (req, res) => {
  try {
    const updated = await Entry.findByIdAndUpdate(
      req.params.id,
      { status: "Completed" },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating status" });
  }
});

// 📤 UPLOAD DOCUMENTS (FROM TABLE BUTTON)
router.put(
  "/upload/:id",
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updateData = {};

      if (req.files?.aadhar) {
        updateData.aadhar = req.files.aadhar[0].filename;
      }

      if (req.files?.license) {
        updateData.license = req.files.license[0].filename;
      }

      const updated = await Entry.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload error" });
    }
  }
);

module.exports = router;