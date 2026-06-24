"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBlockStatus = void 0;
const storeModel_1 = __importDefault(require("../models/storeModel"));
const checkBlockStatus = async (req, res, next) => {
    const store = await storeModel_1.default.findOne({ vendorId: req.user._id });
    if (store && !store.isActive) {
        return res.status(403).json({ message: "Your store has been blocked by Admin." });
    }
    next();
};
exports.checkBlockStatus = checkBlockStatus;
