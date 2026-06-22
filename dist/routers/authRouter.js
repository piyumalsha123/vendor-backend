"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const userModel_1 = require("../models/userModel");
const router = (0, express_1.Router)();
// PUBLIC
router.post("/register", authController_1.createUser);
router.post("/login", authController_1.login);
// PROTECTED
router.get("/me", auth_1.authenticate, authController_1.getMyDetails);
// ADMIN only
router.get("/admin/dashboard", auth_1.authenticate, (0, role_1.requireRole)([userModel_1.UserRole.ADMIN]), (req, res) => {
    res.json({ message: "Welcome to Admin Dashboard!" });
});
// VENDOR only
router.post("/vendor/add-product", auth_1.authenticate, (0, role_1.requireRole)([userModel_1.UserRole.VENDOR]), (req, res) => {
    res.json({ message: "Welcome Vendor! You can add products here." });
});
exports.default = router;
