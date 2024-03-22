const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const productCategoryModel = require("../models/prdCategoryModel");

const createCategory = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const newCategory = await productCategoryModel.create(req.body);
        if (!newCategory)
            res.json({ success: false, message: "Thêm mới thất bại" });
        res.json({ success: true, message: "Thành công", newCategory });
    } catch (error) {
        res.json({ success: false, message: "Server error" + error.message });
    }
});

const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const updatedCategory = await productCategoryModel.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
            }
        );
        if (!updatedCategory)
            res.json({ success: false, message: "Lỗi cập nhật" });
        res.json({
            success: true,
            message: "Cập nhật thành công",
            updatedCategory,
        });
    } catch (error) {
        res.json({ message: "Server Error" });
    }
});

const deleteCategory = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const deleteCategory = await productCategoryModel.findByIdAndDelete(id);
        if (!deleteCategory)
            res.json({ success: false, message: "Xoá thất bại" });
        res.json({ success: true, message: "Xoá thành công", deleteCategory });
    } catch (error) {
        res.json({ message: "Server Error" });
    }
});

const getACategory = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const getCategory = await productCategoryModel.findById(id);
        if (!getCategory)
            res.json({ success: false, message: "Category không tồn tại" });
        res.json({ success: true, getCategory });
    } catch (error) {
        res.json({ message: "Server Error" });
    }
});

const getAllCategory = asyncHandler(async (req, res) => {
    try {
        const getAllCategory = await productCategoryModel.find();
        if (!getAllCategory)
            res.json({ success: false, message: "không có category nào" });
        res.json({ success: true, getAllCategory });
    } catch (error) {
        res.json({ message: "Server Error" });
    }
});

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    getACategory,
    getAllCategory,
};
