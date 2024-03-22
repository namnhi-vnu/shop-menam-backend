const fs = require("fs");
const asyncHandler = require("express-async-handler");

const {
    cloudinaryUploadImg,
    cloudinaryDeleteImg,
} = require("../utils/cloudinary");

const uploadImages = asyncHandler(async (req, res) => {
    try {
        const uploader = (file) => cloudinaryUploadImg(file.path, "images");

        const files = req.files;

        // Sử dụng Promise.all để tải lên đồng thời các tập tin
        const uploadTasks = files.map(async (file) => {
            const newpath = await uploader(file);

            try {
                await fs.promises.unlink(file.path);
            } catch (err) {
                console.error("Error deleting file:", err);
            }
            return newpath;
        });

        const urls = await Promise.all(uploadTasks);

        res.json({ success: true, urls });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

const deleteImages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = cloudinaryDeleteImg(id, "images");
        res.json({
            message: "Deleted",
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

module.exports = { uploadImages, deleteImages };
