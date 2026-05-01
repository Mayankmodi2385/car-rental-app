const express = require("express");
const router = express.Router();
const webpush = require("web-push");
const auth = require("../middleware/auth");
const PushSubscription = require("../models/PushSubscription");
const Entry = require("../models/Entry");

// Configure web-push with your VAPID keys (set in .env)
webpush.setVapidDetails(
  `mailto:${process.env.EMAIL_USER}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/* ===========================
   SAVE PUSH SUBSCRIPTION
   Called when user grants notification permission
=========================== */
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ message: "No subscription provided" });

    // Upsert — replace existing subscription for this user
    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id },
      { userId: req.user.id, subscription },
      { upsert: true, new: true }
    );

    res.json({ message: "Subscribed to push notifications" });
  } catch (err) {
    console.error("SUBSCRIBE ERROR:", err);
    res.status(500).json({ message: "Error saving subscription" });
  }
});

/* ===========================
   CHECK & SEND OVERDUE ALERTS
   Called by a cron job every hour OR on app open
=========================== */
router.post("/check-overdue", auth, async (req, res) => {
  try {
    const now = new Date();

    // Find all Active entries where endDate has passed
    const overdueEntries = await Entry.find({
      status: "Active",
      endDate: { $lt: now },
    });

    if (overdueEntries.length === 0) {
      return res.json({ message: "No overdue rentals", sent: 0 });
    }

    // Get this user's push subscription
    const sub = await PushSubscription.findOne({ userId: req.user.id });
    if (!sub) return res.json({ message: "No subscription found", sent: 0 });

    // Build notification payload
    const payload = JSON.stringify({
      title: `🚨 ${overdueEntries.length} Overdue Rental${overdueEntries.length > 1 ? "s" : ""}!`,
      body: overdueEntries
        .map((e) => `${e.carName}${e.customerName ? ` — ${e.customerName}` : ""} (due ${new Date(e.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`)
        .join("\n"),
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "overdue-alert",        // replaces previous notification instead of stacking
      renotify: true,
      url: "/",
    });

    await webpush.sendNotification(sub.subscription, payload);

    res.json({ message: "Notification sent", sent: overdueEntries.length });
  } catch (err) {
    console.error("PUSH ERROR:", err);
    res.status(500).json({ message: "Error sending notification" });
  }
});

/* ===========================
   SERVER-SIDE CRON
   Runs every hour — sends overdue alerts to ALL users
=========================== */
async function runOverdueCron() {
  try {
    const now = new Date();
    const overdueEntries = await Entry.find({
      status: "Active",
      endDate: { $lt: now },
    });

    if (overdueEntries.length === 0) return;

    // Get all subscriptions
    const allSubs = await PushSubscription.find();

    for (const sub of allSubs) {
      const payload = JSON.stringify({
        title: `🚨 ${overdueEntries.length} Overdue Rental${overdueEntries.length > 1 ? "s" : ""}!`,
        body: overdueEntries
          .map((e) => `${e.carName}${e.customerName ? ` — ${e.customerName}` : ""} (due ${new Date(e.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`)
          .join("\n"),
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "overdue-alert",
        renotify: true,
        url: "/",
      });

      try {
        await webpush.sendNotification(sub.subscription, payload);
        console.log(`✅ Push sent to user ${sub.userId}`);
      } catch (err) {
        // Subscription expired — remove it
        if (err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
          console.log(`🗑 Removed expired subscription for user ${sub.userId}`);
        }
      }
    }
  } catch (err) {
    console.error("CRON ERROR:", err);
  }
}

module.exports = { router, runOverdueCron };