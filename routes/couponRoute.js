const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middleware/authMiddlewere");
const {
    createCoupon,
    deleteCoupon,
    getACoupon,
    getAllCoupon,
    updateCoupon,
} = require("../controllers/couponController");

router.post("/", authMiddleware, isAdmin, createCoupon);
router.get("/", authMiddleware, isAdmin, getAllCoupon);
router.put("/:id", authMiddleware, isAdmin, updateCoupon);
router.get("/:id", authMiddleware, isAdmin, getACoupon);
router.delete("/:id", authMiddleware, isAdmin, deleteCoupon);

module.exports = router;
