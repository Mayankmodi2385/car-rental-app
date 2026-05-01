const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subscription: { type: Object, required: true }, // full web push subscription object
}, { timestamps: true });

// One subscription per user (upsert on save)
pushSubscriptionSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);