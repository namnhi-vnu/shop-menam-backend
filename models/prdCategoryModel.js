const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productCategoryModel = new Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ProductCategory", productCategoryModel);
