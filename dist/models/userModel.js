"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.UserRole = void 0;
const mongoose_1 = require("mongoose");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["USER"] = "USER";
    UserRole["VENDOR"] = "VENDOR";
})(UserRole || (exports.UserRole = UserRole = {}));
const userSchema = new mongoose_1.Schema({
    userId: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: {
        type: [String],
        enum: Object.values(UserRole),
        default: [UserRole.USER]
    },
    approved: { type: Boolean, required: true },
    storeName: { type: String, required: false },
    phone: { type: String, required: true },
    address: { type: String, required: true },
}, { timestamps: true });
exports.UserModel = (0, mongoose_1.model)("user_details", userSchema);
