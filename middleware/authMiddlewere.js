const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const userModel = require("../models/userModel.js");

const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;
    if (req?.headers?.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
        try {
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await userModel.findById(decoded?.id);
                req.user = user;
                next();
            }
        } catch (error) {
            throw new Error("Error verifying");
        }
    } else {
        throw new Error("Token not found");
    }
});

// check admin

const isAdmin = asyncHandler(async (req, res, next) => {
    const { phone } = req.user;
    const adminUser = await userModel.findOne({ phone });
    if (adminUser.role !== "admin") res.json({ message: "Bạn không có quyền" });
    next();
});

module.exports = { authMiddleware, isAdmin };
