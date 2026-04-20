const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ✅ Only log cloud name (never log API_SECRET in production!)
console.log("✅ Cloudinary connected:", process.env.CLOUD_NAME);

module.exports = cloudinary;