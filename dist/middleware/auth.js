"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const userModel_1 = require("../models/userModel");
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            message: "Token not found",
        });
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            sub: payload.sub,
            email: payload.email,
            roles: payload.roles || [],
        };
        next();
    }
    catch (err) {
        console.log("AUTH ERROR:", err);
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired",
            });
        }
        return res.status(401).json({
            message: "Invalid token",
        });
    }
};
exports.authenticate = authenticate;
const isAdmin = (req, res, next) => {
    if (req.user &&
        req.user.roles &&
        req.user.roles.includes(userModel_1.UserRole.ADMIN)) {
        next();
    }
    else {
        res.status(403).json({
            message: "Access denied",
        });
    }
};
exports.isAdmin = isAdmin;
