const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middleware/authMiddlewere");

const {
    createCategory,
    updateCategory,
    getACategory,
    getAllCategory,
    deleteCategory,
} = require("../controllers/prdCategoryController");

router.post("/", authMiddleware, isAdmin, createCategory);
router.put("/:id", authMiddleware, isAdmin, updateCategory);
router.delete("/:id", authMiddleware, isAdmin, deleteCategory);
router.get("/:id", getACategory);
router.get("/", getAllCategory);

module.exports = router;
