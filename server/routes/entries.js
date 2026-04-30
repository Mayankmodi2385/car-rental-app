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
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/* ===========================
   CREATE ENTRY (PROTECTED)
=========================== */
router.post(
  "/",
  auth,
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { customerName, carName, startDate, startTime, endDate, pricePerDay, remark } = req.body;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = end - start;
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      const price = parseFloat(pricePerDay) || 0;
      const totalAmount = days * price;

      const entry = await Entry.create({
        customerName: customerName || "",
        carName,
        startDate: start,
        startTime: startTime || "",
        endDate: end,
        pricePerDay: price,
        totalAmount,
        status: "Active",
        remark: remark || "",
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
   UPLOAD DOCUMENTS (PROTECTED)
   ✅ Must come BEFORE /:id to avoid route conflict
=========================== */
router.put(
  "/upload/:id",
  auth,
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updateData = {};

      if (req.files?.aadhar) {
        updateData.aadhar = req.files.aadhar[0].path;
      }

      if (req.files?.license) {
        updateData.license = req.files.license[0].path;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const updated = await Entry.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!updated) return res.status(404).json({ message: "Entry not found" });

      res.json(updated);
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "Upload error" });
    }
  }
);

/* ===========================
   EDIT ENTRY (PROTECTED)
=========================== */
router.patch("/:id", auth, async (req, res) => {
  try {
    const { customerName, carName, startDate, startTime, endDate, pricePerDay, remark } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const price = parseFloat(pricePerDay) || 0;
    const totalAmount = days * price;

    const updated = await Entry.findByIdAndUpdate(
      req.params.id,
      { customerName, carName, startDate: start, startTime, endDate: end, pricePerDay: price, totalAmount, remark: remark || "" },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Entry not found" });
    res.json(updated);
  } catch (err) {
    console.error("EDIT ERROR:", err);
    res.status(500).json({ message: "Error editing entry" });
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

    if (!updated) return res.status(404).json({ message: "Entry not found" });

    res.json(updated);
  } catch (err) {
    console.error("STATUS ERROR:", err);
    res.status(500).json({ message: "Error updating status" });
  }
});

/* ===========================
   DELETE ENTRY (PROTECTED)
=========================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Entry.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Entry not found" });

    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting entry" });
  }
});

module.exports = router;