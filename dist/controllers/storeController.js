"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsByVendor = exports.getStoreById = exports.updateStorePhone = exports.getStoreSettings = exports.createStore = exports.checkStore = exports.saveStoreSettings = void 0;
const storeModel_1 = __importDefault(require("../models/storeModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const productModel_1 = require("../models/productModel");
const userModel_1 = require("../models/userModel");
const saveStoreSettings = async (req, res) => {
    try {
        const { storeName, phone, email, address, customAttributes, category, deliveryMethods, logo } = req.body;
        const userId = req.user?.sub;
        const updateData = {
            storeName, phone, email, address, category,
            customAttributes: Array.isArray(customAttributes) ? customAttributes : [],
            deliveryMethods: Array.isArray(deliveryMethods) ? deliveryMethods : [],
            vendorId: new mongoose_1.default.Types.ObjectId(userId),
            userId: userId
        };
        if (logo)
            updateData.logo = logo;
        const updatedStore = await storeModel_1.default.findOneAndUpdate({ userId: userId }, { $set: updateData }, { upsert: true, new: true } // 'new: true' පාවිච්චි කරන්න
        );
        res.status(200).json(updatedStore);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.saveStoreSettings = saveStoreSettings;
const checkStore = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const store = await storeModel_1.default.findOne({ userId: userId });
        if (store) {
            return res.json({
                hasStore: true,
                category: store.category,
                logo: store.logo,
                settings: {
                    storeName: store.storeName,
                    phone: store.phone,
                    email: store.email,
                    address: store.address,
                    deliveryMethods: store.deliveryMethods || [],
                    customAttributes: store.customAttributes || []
                }
            });
        }
        return res.json({ hasStore: false });
    }
    catch (err) {
        return res.status(500).json({ error: "Server Error" });
    }
};
exports.checkStore = checkStore;
const createStore = async (req, res) => {
    try {
        const { storeName, category, phone, logo, email, address } = req.body;
        const userId = req.user?.sub || req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized - No userId" });
        }
        const newStore = new storeModel_1.default({
            vendorId: new mongoose_1.default.Types.ObjectId(userId),
            userId,
            storeName: storeName || "My Store",
            category,
            phone,
            logo,
            email,
            address
        });
        await newStore.save();
        return res.status(201).json({
            success: true,
            store: newStore
        });
    }
    catch (err) {
        console.error("🔥 CREATE STORE ERROR:", err);
        return res.status(500).json({
            error: "Server Error",
            details: err.message
        });
    }
};
exports.createStore = createStore;
const getStoreSettings = async (req, res) => {
    try {
        const store = await storeModel_1.default.findOne({ userId: req.user?.sub });
        if (!store)
            return res.status(404).json({ message: "Store not found" });
        res.status(200).json(store);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getStoreSettings = getStoreSettings;
const updateStorePhone = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const { phone } = req.body;
        const updatedStore = await storeModel_1.default.findOneAndUpdate({ userId: userId }, { $set: { phone: phone } }, { new: true });
        res.status(200).json({ success: true, store: updatedStore });
    }
    catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
};
exports.updateStorePhone = updateStorePhone;
const getStoreById = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const store = await storeModel_1.default.findOne({ vendorId: vendorId }).lean();
        if (!store)
            return res.status(404).json({ message: "Store not found" });
        const vendor = await userModel_1.UserModel.findById(vendorId);
        const storeData = {
            ...store,
            email: store.email || (vendor ? vendor.email : "N/A"),
            // මෙතැනදී ප්‍රධාන වෙනස:
            phone: store.phone && store.phone.trim() !== "" ? store.phone : (vendor ? vendor.phone : "No Phone")
        };
        res.status(200).json(storeData);
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
exports.getStoreById = getStoreById;
const getProductsByVendor = async (req, res) => {
    try {
        const { vendorId } = req.query;
        console.log("Requested VendorID:", vendorId);
        if (!vendorId || typeof vendorId !== 'string') {
            return res.status(400).json({ error: "Invalid Vendor ID" });
        }
        const products = await productModel_1.ProductModel.find({ vendorId: vendorId });
        res.status(200).json(products);
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
exports.getProductsByVendor = getProductsByVendor;
