const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cartModel = new Schema(
    {
        products: [
            {
                product: {
                    type: mongoose.Types.ObjectId,
                    ref: "Product",
                },
                count: Number,
                price: Number,
                title: String,
                slug: String,
                image: [
                    {
                        public_id: String,
                        url: String,
                    },
                ],
                category: String,
            },
        ],
        cartTotal: Number,
        totalAfterDiscount: Number,
        orderby: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Cart", cartModel);
