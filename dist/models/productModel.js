"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    productId: { type: String, required: true, unique: true },
    vendorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "user_details", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: {
        type: String,
        enum: ['clothing', 'foods', 'flowers', 'crafts', 'other'],
        required: true,
    },
    images: { type: [String], default: [] },
    // variants: { type: Schema.Types.Mixed, default: {} },
    variants: { type: Object },
    variantsMetadata: { type: Object },
    isAvailable: { type: Boolean, default: true },
    paymentMethods: {
        cod: { type: Boolean, default: false },
        bankTransfer: { type: Boolean, default: false },
    },
    deliveryCharge: { type: Number, default: 0 },
}, { timestamps: true });
exports.ProductModel = (0, mongoose_1.model)("products", productSchema);
