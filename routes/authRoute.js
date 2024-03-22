const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middleware/authMiddlewere");
const {
    applyCoupon,
    createOrder,
    createUser,
    deleteUser,
    emptyCart,
    getAllOrders,
    getAllUser,
    getOneUser,
    getOrders,
    getUserCart,
    loginAdmin,
    loginUser,
    logoutUser,
    updateOrderStatus,
    updateUser,
    userCart,
    userUpdateCart,
    createOrderNotUser,
    createAddress,
    getAddress,
    deleteAddress,
    updateAddress,
    getAddressById,
    deleteCartItem,
    getOrderByUserId,
} = require("../controllers/userController");

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.post("/address", authMiddleware, createAddress);
router.post("/cart/applycoupon", authMiddleware, applyCoupon);
router.post("/cart/cash-order", authMiddleware, createOrder);
router.post("/cart/cash-order-no-user", createOrderNotUser);

router.get("/all-user", authMiddleware, isAdmin, getAllUser);
router.get("/get-orders", authMiddleware, getOrders);
router.get("/get-orders/:id", authMiddleware, isAdmin, getOrderByUserId);
router.get("/get-orders-all-user", authMiddleware, isAdmin, getAllOrders);
router.get("/get-user/:id", authMiddleware, getOneUser);
router.get("/cart", authMiddleware, getUserCart);
router.get("/logout", logoutUser);
router.get("/address", authMiddleware, getAddress);
router.get("/address/:id", authMiddleware, getAddressById);

router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete("/delete-cart/:id", authMiddleware, deleteCartItem);
router.delete("/:id", authMiddleware, isAdmin, deleteUser);
router.delete("/address/:id", authMiddleware, deleteAddress);

router.put("/edit-user/:id", authMiddleware, updateUser);
router.put("/update-cart/", authMiddleware, userUpdateCart);
router.put("/update-address/:id", authMiddleware, updateAddress);
router.put(
    "/order/update-order/:id",
    authMiddleware,
    isAdmin,
    updateOrderStatus
);

module.exports = router;
