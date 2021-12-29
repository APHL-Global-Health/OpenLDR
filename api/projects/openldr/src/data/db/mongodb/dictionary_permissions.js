const mongoose = require("mongoose");
module.exports = {
    name: { type: String, required: true, unique: true, trim: true },
    title: { type: String, default:"" },
    role: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "roles"
    }]
};