"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDetails = exports.getMyDetails = exports.login = exports.createUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userModel_1 = require("../models/userModel");
const counterModel_1 = require("../models/counterModel");
const token_1 = require("../utils/token");
const storeModel_1 = __importDefault(require("../models/storeModel"));
// ========================= REGISTER =========================
const createUser = async (req, res) => {
    try {
        console.log("🔥 REGISTER BODY:", req.body);
        const { name, email, password, roles, storeName, phone, address, category } = req.body;
        // ========================= CHECK USER =========================
        const exUser = await userModel_1.UserModel.findOne({ email });
        if (exUser) {
            console.log("❌ User already exists");
            return res.status(400).json({
                message: "User already exists!"
            });
        }
        // ========================= HASH PASSWORD =========================
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // ========================= ASSIGN ROLES =========================
        const assignRoles = [userModel_1.UserRole.USER];
        if (roles?.includes("VENDOR")) {
            assignRoles.push(userModel_1.UserRole.VENDOR);
        }
        // ========================= GENERATE USER CODE =========================
        const userCounter = await counterModel_1.CounterModel.findOneAndUpdate({ id: "user_code" }, { $inc: { seq: 1 } }, {
            returnDocument: "after",
            upsert: true
        });
        const generatedUserId = `U${String(userCounter?.seq || 1).padStart(3, "0")}`;
        // ========================= CREATE USER =========================
        const newUser = new userModel_1.UserModel({
            userId: generatedUserId,
            name,
            email,
            password: hashedPassword,
            roles: assignRoles,
            approved: true,
            // vendor optional details
            storeName: storeName || "",
            phone: phone || "",
            address: address || ""
        });
        const savedUser = await newUser.save();
        console.log("✅ USER SAVED:", savedUser._id);
        // ========================= CREATE STORE ONLY FOR VENDOR =========================
        if (assignRoles.includes(userModel_1.UserRole.VENDOR)) {
            console.log("🏪 Creating vendor store...");
            // store name required for vendor
            if (!storeName) {
                return res.status(400).json({
                    message: "Store name is required for vendors"
                });
            }
            const store = await storeModel_1.default.create({
                vendorId: savedUser._id,
                userId: generatedUserId,
                storeName,
                phone: phone || "",
                email,
                address: address || "",
                // category can be empty initially
                category: category || "",
                isActive: true,
                customAttributes: [],
                deliveryMethods: [],
                logo: ""
            });
            console.log("✅ STORE CREATED:", store._id);
        }
        // ========================= RESPONSE =========================
        return res.status(201).json({
            message: "Registration successful!",
            data: {
                id: savedUser._id,
                email: savedUser.email,
                roles: savedUser.roles
            }
        });
    }
    catch (err) {
        console.error("🔥 FULL REGISTER ERROR:", err);
        return res.status(500).json({
            message: "Internal server error!",
            error: err.message
        });
    }
};
exports.createUser = createUser;
// ========================= LOGIN =========================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel_1.UserModel.findOne({ email });
        if (!user) {
            console.log("❌ Login failed - user not found");
            return res.status(401).json({
                message: "Invalid credentials!"
            });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        console.log("🔑 Password valid:", isValid);
        if (!isValid) {
            return res.status(401).json({
                message: "Invalid credentials!"
            });
        }
        // ========================= TOKENS =========================
        const accessToken = (0, token_1.signAccessToken)(user);
        const refreshToken = (0, token_1.signRefreshToken)(user);
        // ========================= RESPONSE =========================
        return res.status(200).json({
            message: "Login successful",
            data: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                email: user.email,
                roles: user.roles,
                storeName: user.storeName,
                phone: user.phone,
                address: user.address,
                accessToken,
                refreshToken
            }
        });
    }
    catch (err) {
        console.error("🔥 LOGIN ERROR:", err);
        return res.status(500).json({
            message: "Internal server error while login!"
        });
    }
};
exports.login = login;
// ========================= GET ME =========================
const getMyDetails = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const user = await userModel_1.UserModel.findById(req.user.sub)
            .select("-password");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        return res.status(200).json({
            message: "ok",
            data: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                email: user.email,
                roles: user.roles,
                storeName: user.storeName,
                phone: user.phone,
                address: user.address
            }
        });
    }
    catch (err) {
        console.error("🔥 GET ME ERROR:", err);
        return res.status(500).json({
            message: "Internal server error while fetching user details!"
        });
    }
};
exports.getMyDetails = getMyDetails;
// ========================= GET USER DETAILS =========================
const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel_1.UserModel.findById(id)
            .select("name email phone address");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        return res.status(200).json(user);
    }
    catch (err) {
        console.error("🔥 GET USER DETAILS ERROR:", err);
        return res.status(500).json({
            message: "Error fetching user details"
        });
    }
};
exports.getUserDetails = getUserDetails;
