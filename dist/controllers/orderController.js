"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.getCustomerOrders = exports.updateOrder = exports.getVendorOrders = exports.createOrder = void 0;
const orderModel_1 = require("../models/orderModel");
const counterModel_1 = require("../models/counterModel");
const mongoose_1 = __importDefault(require("mongoose"));
const storeModel_1 = __importDefault(require("../models/storeModel"));
const createOrder = async (req, res) => {
    try {
        const customerId = req.user?.sub || req.user?.id;
        const { items, totalPrice, shippingAddress, phoneNumber } = req.body;
        if (!items || items.length === 0)
            return res.status(400).json({ message: "No items" });
        const counter = await counterModel_1.CounterModel.findOneAndUpdate({ id: "order_code" }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true });
        const commonOrderId = `OD${String(counter.seq).padStart(3, '0')}`;
        const groupedItems = {};
        items.forEach((item) => {
            if (!groupedItems[item.vendorId])
                groupedItems[item.vendorId] = [];
            groupedItems[item.vendorId].push(item);
        });
        const orderPromises = Object.keys(groupedItems).map(async (vendorId) => {
            const vendorItems = groupedItems[vendorId];
            const vendorTotalPrice = vendorItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            const newOrder = new orderModel_1.OrderModel({
                orderId: commonOrderId,
                customerId,
                vendorId: vendorId,
                items: vendorItems,
                totalPrice: vendorTotalPrice,
                shippingAddress,
                phoneNumber,
                status: "pending"
            });
            return await newOrder.save();
        });
        await Promise.all(orderPromises);
        res.status(201).json({ message: "All items saved successfully!" });
    }
    catch (error) {
        console.error("CRITICAL ERROR:", error);
        res.status(500).json({ message: "Failed to place order" });
    }
};
exports.createOrder = createOrder;
const getVendorOrders = async (req, res) => {
    try {
        const vendorId = new mongoose_1.default.Types.ObjectId(req.user.sub || req.user.id);
        const orders = await orderModel_1.OrderModel.aggregate([
            { $match: { "items.vendorId": vendorId } },
            {
                $lookup: {
                    from: "user_details",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }
            },
            { $unwind: { path: "$customerInfo", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    debug_customerInfo: "$customerInfo"
                }
            },
            {
                $project: {
                    orderId: 1,
                    status: 1,
                    totalPrice: 1,
                    customerId: 1,
                    customerName: "$customerInfo.name",
                    customerEmail: "$customerInfo.email",
                    debug_customerInfo: 1,
                    items: { $filter: { input: "$items", as: "item", cond: { $eq: ["$$item.vendorId", vendorId] } } }
                }
            }
        ]);
        console.log("Orders with Customer Info:", JSON.stringify(orders, null, 2));
        res.status(200).json({ data: orders });
    }
    catch (error) {
        res.status(500).json({ message: "Error" });
    }
};
exports.getVendorOrders = getVendorOrders;
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const vendorId = req.user?.sub || req.user?.id;
        const updatedOrder = await orderModel_1.OrderModel.findOneAndUpdate({ _id: id, vendorId: vendorId }, { $set: { status: status } }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found or unauthorized!" });
        }
        res.json({ message: "Order updated successfully!", data: updatedOrder });
    }
    catch (err) {
        res.status(500).json({ message: "Update failed" });
    }
};
exports.updateOrder = updateOrder;
const getCustomerOrders = async (req, res) => {
    try {
        const customerId = new mongoose_1.default.Types.ObjectId(req.user?.sub || req.user?.id);
        const allStores = await storeModel_1.default.find({}).lean();
        const orders = await orderModel_1.OrderModel.aggregate([
            { $match: { customerId: customerId } },
            { $sort: { createdAt: -1 } }
        ]);
        const ordersWithStores = orders.map(order => ({
            ...order,
            allStoreDetails: allStores
        }));
        res.json({ data: ordersWithStores });
    }
    catch (error) {
        res.status(500).json({ message: "Error" });
    }
};
exports.getCustomerOrders = getCustomerOrders;
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user?.sub || req.user?.id;
        const result = await orderModel_1.OrderModel.updateMany({ orderId: orderId, customerId: customerId, status: 'pending' }, { $set: { status: 'cancelled' } });
        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: "Only pending orders can be cancelled." });
        }
        res.status(200).json({ message: "Order cancelled successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.cancelOrder = cancelOrder;
