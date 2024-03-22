const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productModel = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: String,
            required: true,
        },
        oldPrice: {
            type: String,
        },
        category: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        sold: {
            type: Number,
            default: 0,
        },
        image: [
            {
                public_id: String,
                url: String,
            },
        ],
        color: [],
        tags: [],
        ratings: [
            {
                star: Number,
                comment: String,
                postedby: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
            },
        ],
        totalRating: {
            type: String,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productModel);
