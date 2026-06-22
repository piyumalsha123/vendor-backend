"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendorController_1 = require("../controllers/vendorController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/dashboard-stats", auth_1.authenticate, vendorController_1.getDashboardStats);
exports.default = router;
