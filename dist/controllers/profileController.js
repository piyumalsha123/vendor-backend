"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const userModel_1 = require("../models/userModel");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getProfile = async (req, res) => {
    try {
        const userPayload = req.user;
        const userId = userPayload.sub || userPayload.id || userPayload.userId;
        if (!userId) {
            return res.status(401).json({ message: "User ID not found in token" });
        }
        const user = await userModel_1.UserModel.findById(userId).select("-password");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userPayload = req.user;
        const userId = userPayload.userId || userPayload.id || userPayload._id || userPayload.sub;
        console.log("Extracted User ID:", userId);
        if (!userId) {
            return res.status(400).json({ message: "Token does not contain user identifier" });
        }
        const user = await userModel_1.UserModel.findById(userId);
        if (!user) {
            console.log("User not found with _id:", userId);
            return res.status(404).json({ message: "User not found" });
        }
        if (req.body.newPassword && req.body.oldPassword) {
            const isMatch = await bcrypt_1.default.compare(req.body.oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Incorrect Old Password!" });
            }
            user.password = await bcrypt_1.default.hash(req.body.newPassword, 10);
        }
        const { name, phone, address } = req.body;
        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        await user.save();
        return res.status(200).json({ message: "Profile updated successfully!" });
    }
    catch (error) {
        return res.status(500).json({ message: "Update failed", error: error.message });
    }
};
exports.updateProfile = updateProfile;
