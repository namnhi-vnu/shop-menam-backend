const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middleware/authMiddlewere");

const {
    createProduct,
    getaProducts,
    getAllProducts,
    updateProduct,
    deleteProduct,
    rating,
    uploadImage,
    getProductCategory,
} = require("../controllers/productController");

const { productImgResize, uploadPhoto } = require("../middleware/uploadImage");
const { models } = require("mongoose");

// const { uploadPhoto, productImgResize } = require("../middleware/uploadImage");

router.put(
    "/upload/:id",
    authMiddleware,
    isAdmin,
    uploadPhoto.array("images", 10),
    productImgResize,
    uploadImage
);
router.post("/", authMiddleware, isAdmin, createProduct);
router.get("/:slug", getaProducts);
router.get("/category/:slug", getProductCategory);
router.get("/", getAllProducts);

router.put("/rating", authMiddleware, rating);
router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);

module.exports = router;
