const express = require("express");
const router = express.Router();
const Entry = require("../models/Entry");
const auth = require("../middleware/auth");

const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/* ===========================
   CLOUDINARY STORAGE CONFIG
=========================== */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "car-rental",
    resource_type: "image",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

/* ===========================
   CREATE ENTRY (PROTECTED)
=========================== */
router.post(
  "/",
  auth, // 🔥 PROTECT ROUTE
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("FILES:", req.files);

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

        aadhar: req.files?.aadhar?.[0]?.path || null,
        license: req.files?.license?.[0]?.path || null,
      });

      res.json(entry);
    } catch (err) {
      console.error("CREATE ERROR:", err);
      res.status(500).json({ message: "Error creating entry" });
    }
  }
);

/* ===========================
   GET ALL ENTRIES (PROTECTED)
=========================== */
router.get("/", auth, async (req, res) => {
  try {
    const data = await Entry.find().sort({ startDate: -1 });
    res.json(data);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ message: "Error fetching entries" });
  }
});

/* ===========================
   MARK COMPLETE (PROTECTED)
=========================== */
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await Entry.findByIdAndUpdate(
      req.params.id,
      { status: "Completed" },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("STATUS ERROR:", err);
    res.status(500).json({ message: "Error updating status" });
  }
});

/* ===========================
   UPLOAD DOCUMENTS (PROTECTED)
=========================== */
router.put(
  "/upload/:id",
  auth, // 🔥 PROTECT ROUTE
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("FILES:", req.files);

      const updateData = {};

      if (req.files?.aadhar) {
        updateData.aadhar = req.files.aadhar[0].path;
      }

      if (req.files?.license) {
        updateData.license = req.files.license[0].path;
      }

      const updated = await Entry.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json(updated);
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "Upload error" });
    }
  }
);

module.exports = router;