const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middleware/authMiddlewere");
const {
    uploadImages,
    deleteImages,
} = require("../controllers/uploadController");
const { uploadPhoto, productImgResize } = require("../middleware/uploadImage");

router.post(
    "/",
    authMiddleware,
    // isAdmin,
    uploadPhoto.array("images", 10),
    productImgResize,
    uploadImages
);

router.delete("/delete-img/:id", authMiddleware, isAdmin, deleteImages);

module.exports = router;
