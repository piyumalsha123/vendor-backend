"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const orderModel_1 = require("../models/orderModel");
const productModel_1 = require("../models/productModel");
const mongoose_1 = require("mongoose");
const getDashboardStats = async (req, res) => {
    try {
        const vendorId = req.user?.id || req.user?.sub;
        if (!vendorId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        const vendorObjectId = new mongoose_1.Types.ObjectId(vendorId);
        const revenueData = await orderModel_1.OrderModel.aggregate([
            { $unwind: "$items" },
            {
                $match: {
                    "items.vendorId": vendorObjectId,
                    "items.status": { $ne: "cancelled" }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
        const activeOrders = await orderModel_1.OrderModel.countDocuments({
            items: {
                $elemMatch: {
                    vendorId: vendorObjectId,
                    status: { $in: ["pending", "processing"] }
                }
            }
        });
        const productCount = await productModel_1.ProductModel.countDocuments({ vendorId: vendorObjectId });
        const recentOrders = await orderModel_1.OrderModel.find({
            items: {
                $elemMatch: { vendorId: vendorObjectId }
            }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("customerId", "name");
        res.status(200).json({
            totalRevenue,
            activeOrders,
            productCount,
            recentOrders
        });
    }
    catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getDashboardStats = getDashboardStats;
