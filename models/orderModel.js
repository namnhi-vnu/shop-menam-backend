const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderModel = new Schema(
    {
        products: [
            {
                product: {},
                count: Number,
            },
        ],
        paymentMethod: {
            type: String,
            required: true,
            default: "Payment on delivery",
        },
        paymentIntent: {},
        orderStatus: {
            type: String,
            default: "Chờ xử lý",
            enum: [
                "Chờ xử lý",
                "Đã xác nhận",
                "Chờ thanh toán",
                "Chờ giao",
                "Đang giao",
                "Đã giao thành công",
                "Đã bị huỷ",
            ],
        },
        orderDetails: {
            fullname: String,
            phone: String,
            street: String,
            desception: String,
            city: String,
            district: String,
            ward: String,
        },
        orderby: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
        defaultAddress: {
            type: mongoose.Types.ObjectId,
            ref: "Address",
        },
        statusHistory: [
            {
                // Lịch sử trạng thái
                status: String,
                newStatus: String,
                userId: String,
                updatedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Middleware để lưu trạng thái cũ và mới vào statusHistory trước khi cập nhật
orderModel.pre("findOneAndUpdate", async function () {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
        // Lấy trạng thái cũ trước khi cập nhật
        const oldStatus = docToUpdate.orderStatus;

        // Cập nhật trạng thái mới vào đơn hàng
        const update = this.getUpdate();
        if (update && update.orderStatus) {
            docToUpdate.orderStatus = update.orderStatus;
        }

        // Lưu trạng thái cũ và mới vào statusHistory
        docToUpdate.statusHistory.push({
            status: oldStatus,
            newStatus: update.orderStatus,
            userId: docToUpdate.orderby,
            updatedAt: new Date(),
        });
        console.log(docToUpdate.orderby);
        await docToUpdate.save();
    }
});
module.exports = mongoose.model("Order", orderModel);
