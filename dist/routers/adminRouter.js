"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userModel_1 = require("../models/userModel");
const orderModel_1 = require("../models/orderModel");
const storeModel_1 = __importDefault(require("../models/storeModel"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/stats', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        const users = await userModel_1.UserModel.countDocuments({ roles: { $in: [userModel_1.UserRole.USER] } });
        const vendors = await userModel_1.UserModel.countDocuments({ roles: { $in: [userModel_1.UserRole.VENDOR] } });
        const orders = await orderModel_1.OrderModel.countDocuments();
        res.json({ users, vendors, orders });
    }
    catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
router.put('/vendors/:storeId/toggle-block', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        const store = await storeModel_1.default.findById(req.params.storeId);
        if (!store)
            return res.status(404).json({ message: "Store not found" });
        store.isActive = !store.isActive;
        await store.save();
        res.json({
            message: `Store is now ${store.isActive ? 'Active' : 'Blocked'}`,
            isActive: store.isActive
        });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to update block status" });
    }
});
router.get('/orders', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        const orders = await orderModel_1.OrderModel.find().populate('customerId', 'name email').sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});
router.get('/stores', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        const stores = await storeModel_1.default.find()
            .populate({
            path: 'vendorId',
            select: 'name email phone',
            model: 'user_details'
        })
            .lean();
        res.json(stores || []);
    }
    catch (err) {
        console.error("Store Fetch Error:", err);
        res.status(500).json([]);
    }
});
router.get('/users', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    const users = await userModel_1.UserModel.find({ roles: { $in: [userModel_1.UserRole.USER] } });
    res.json(users);
});
router.get('/users-all', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        const allUsers = await userModel_1.UserModel.find({});
        res.json(allUsers);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
router.put('/users/:userId/toggle-block', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        const user = await userModel_1.UserModel.findById(req.params.userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        user.approved = !user.approved;
        await user.save();
        res.json({ message: `User status updated`, approved: user.approved });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to update user status" });
    }
});
exports.default = router;
