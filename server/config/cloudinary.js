const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

console.log("CLOUD:", process.env.CLOUD_NAME);
console.log("KEY:", process.env.API_KEY);
console.log("SECRET:", process.env.API_SECRET);

module.exports = cloudinary;