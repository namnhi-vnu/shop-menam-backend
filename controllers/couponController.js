const asyncHandler = require("express-async-handler");
const couponModel = require("../models/couponModel");

const createCoupon = asyncHandler(async (req, res) => {
    try {
        const createCoupon = await couponModel.create(req.body);
        if (!createCoupon)
            res.json({
                success: false,
                message: "Tạo thất bại",
            });
        res.json({
            success: true,
            message: "Tạo thành công",
            createCoupon,
        });
    } catch (error) {
        res.json({
            message: "Server Error",
        });
    }
});

const updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const updateCoupon = await couponModel.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!updateCoupon)
            res.json({
                success: false,
                message: "Cập nhật thất bại",
            });
        res.json({
            success: true,
            message: "Sửa thành công",
            updateCoupon,
        });
    } catch (error) {
        res.json({
            message: "Serever Error",
        });
    }
});

const deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const deleteCoupon = await couponModel.findByIdAndDelete(id);
        if (!deleteCoupon)
            res.json({
                success: false,
                message: "Xoá thất bại",
            });
        res.json({
            success: true,
            message: "Xoá thành công",
            deleteCoupon,
        });
    } catch (error) {
        res.json({
            message: "Serever Error",
        });
    }
});

const getACoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const getACoupon = await couponModel.findById(id);
        if (!getACoupon)
            res.json({
                success: false,
                message: "Mã không tồn tại",
            });
        res.json({
            success: true,
            message: "",
            getACoupon,
        });
    } catch (error) {
        res.json({
            message: "Serever Error",
        });
    }
});

const getAllCoupon = asyncHandler(async (req, res) => {
    try {
        const getAllCoupon = await couponModel.find();
        if (!getAllCoupon)
            res.json({
                success: false,
                message: "Bạn chưa tạo mã nào",
            });
        res.json({
            success: true,
            message: "",
            getAllCoupon,
        });
    } catch (error) {
        res.json({
            message: "Serever Error",
        });
    }
});

module.exports = {
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getACoupon,
    getAllCoupon,
};
