const mongoose = require("mongoose");
module.exports = {
  email: { type: String, unique: true },
  password: { type: String },
  token: { type: String },
  created_on: { type: Date, default: Date.now() },
  is_locked: { type: Boolean, default: false },
  role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "roles"
  }
};