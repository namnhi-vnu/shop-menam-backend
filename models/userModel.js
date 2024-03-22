const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userModel = new Schema(
    {
        firstname: {
            type: String,
        },
        lastname: {
            type: String,
        },
        email: {
            type: String,
            unique: true,
        },
        avatar: {
            type: String,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: "user",
            enum: ["user", "admin", "editor"],
        },
        address: {
            type: String,
        },
        cart: {
            type: Array,
            default: [],
        },
        birthday: {
            type: String,
        },
        gender: {
            type: String,
        },
        orders: {
            type: Array,
            default: [],
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userModel);
