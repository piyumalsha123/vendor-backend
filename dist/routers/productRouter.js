"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const userModel_1 = require("../models/userModel");
const role_1 = require("../middleware/role");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Vendor-only routes
router.post("/save", auth_1.authenticate, (0, role_1.requireRole)([userModel_1.UserRole.VENDOR]), productController_1.createProduct);
router.put("/update/:id", auth_1.authenticate, (0, role_1.requireRole)([userModel_1.UserRole.VENDOR]), productController_1.updateProduct);
router.delete("/delete/:id", auth_1.authenticate, (0, role_1.requireRole)([userModel_1.UserRole.VENDOR]), productController_1.deleteProduct);
// AI Suggestion 
router.post("/ai/suggest", auth_1.authenticate, (0, role_1.requireRole)([userModel_1.UserRole.VENDOR]), productController_1.getAiSuggestions);
// Public/All user routes
router.get('/my-products', auth_1.authenticate, productController_1.getMyProducts);
router.get('/public-products', productController_1.getAllPublicProducts);
router.get('/', productController_1.getProducts);
exports.default = router;
