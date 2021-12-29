const mongoose = require("mongoose");
module.exports = {
    name: { type: String, required: true, unique: true, trim: true },
    title: { type: String, default:"" },
    permissions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "permissions"
        }
    ],
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }]
};