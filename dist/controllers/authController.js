"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDetails = exports.getMyDetails = exports.login = exports.createUser = void 0;
const userModel_1 = require("../models/userModel");
const counterModel_1 = require("../models/counterModel");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const token_1 = require("../utils/token");
// api/v1/auth/register
const createUser = async (req, res) => {
    const { name, email, password, roles, storeName, phone, address } = req.body;
    try {
        const exUser = await userModel_1.UserModel.findOne({ email });
        if (exUser) {
            return res.status(400).json({ message: "User already exists..!" });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const assignRoles = [userModel_1.UserRole.USER];
        if (roles?.includes("VENDOR") || roles?.includes(userModel_1.UserRole.VENDOR))
            assignRoles.push(userModel_1.UserRole.VENDOR);
        if (roles?.includes("ADMIN") || roles?.includes(userModel_1.UserRole.ADMIN))
            assignRoles.push(userModel_1.UserRole.ADMIN);
        const isApproved = true;
        const userCounter = await counterModel_1.CounterModel.findOneAndUpdate({ id: "user_code" }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true });
        const generatedUserId = `U${String(userCounter?.seq || 1).padStart(3, '0')}`;
        const newUser = new userModel_1.UserModel({
            userId: generatedUserId,
            name,
            email,
            password: hashedPassword,
            roles: Array.from(new Set(assignRoles)),
            approved: isApproved,
            storeName,
            phone,
            address
        });
        const savedUser = await newUser.save();
        res.status(201).json({
            message: "Registration successfully..!",
            data: {
                userId: savedUser.userId,
                name: savedUser.name,
                email: savedUser.email,
                roles: savedUser.roles,
                approved: savedUser.approved,
                id: savedUser._id
            }
        });
    }
    catch (err) {
        console.error("REGISTER ERROR:", err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "User ID generation error, please try again." });
        }
        res.status(500).json({ message: "Internal server error while creating user..!" });
    }
};
exports.createUser = createUser;
// api/v1/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel_1.UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials..!" });
        }
        if (user.roles.includes(userModel_1.UserRole.VENDOR) && !user.approved) {
            return res.status(403).json({ message: "Your Vendor account is pending admin approval!" });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials..!" });
        }
        const accessToken = (0, token_1.signAccessToken)(user);
        const refreshToken = (0, token_1.signRefreshToken)(user);
        res.status(200).json({
            message: "Success",
            data: {
                email: user.email,
                roles: user.roles,
                storeName: user.storeName,
                accessToken,
                refreshToken
            }
        });
    }
    catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ message: "Internal server error while login..!" });
    }
};
exports.login = login;
// api/v1/auth/me
const getMyDetails = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const user = await userModel_1.UserModel.findById(req.user.sub).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "ok",
            data: {
                id: user._id,
                userId: user.userId,
                email: user.email,
                roles: user.roles,
                storeName: user.storeName
            }
        });
    }
    catch (err) {
        console.error("GET ME ERROR:", err);
        res.status(500).json({ message: "Internal server error while fetching user details..!" });
    }
};
exports.getMyDetails = getMyDetails;
const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel_1.UserModel.findById(id).select("name email phone address");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (err) {
        res.status(500).json({ message: "Error" });
    }
};
exports.getUserDetails = getUserDetails;
