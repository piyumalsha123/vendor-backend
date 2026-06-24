"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userModel_1 = require("../models/userModel");
const orderModel_1 = require("../models/orderModel");
const productModel_1 = require("../models/productModel");
const storeModel_1 = __importDefault(require("../models/storeModel"));
// Middleware ගොනු නිවැරදිව import කරගන්න
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 1. Dashboard Stats (Admin පමණක් සඳහා)
router.get('/stats', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        const users = await userModel_1.UserModel.countDocuments({ role: 'user' });
        const vendors = await userModel_1.UserModel.countDocuments({ role: 'vendor' });
        const orders = await orderModel_1.OrderModel.countDocuments();
        res.json({ users, vendors, orders });
    }
    catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
// 2. Product Moderation (Admin පමණක් සඳහා)
router.delete('/products/:id', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        await productModel_1.ProductModel.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});
// 3. Vendor Block/Unblock (Admin පමණක් සඳහා)
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
// 4. Order Overview (Admin පමණක් සඳහා)
router.get('/orders', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        const orders = await orderModel_1.OrderModel.find()
            .populate('customerId', 'name email') // පාරිභෝගිකයාගේ විස්තර පෙන්වීමට
            .sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});
// 5. Order Status Update (Admin පමණක් සඳහා)
router.put('/orders/:id/status', auth_1.authenticate, auth_1.isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await orderModel_1.OrderModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ message: "Order status updated", order });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to update order status" });
    }
});
exports.default = router;
