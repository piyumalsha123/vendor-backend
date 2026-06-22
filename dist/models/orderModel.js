"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = void 0;
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    orderId: { type: String, required: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "user_details", required: true },
    vendorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "user_details", required: true },
    items: [{
            productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "products", required: true },
            vendorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "user_details", required: true },
            title: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            images: [{ type: String }],
            status: { type: String, default: 'pending' },
            selectedVariant: {
                size: String,
                color: String,
                flavor: String
            }
        }],
    totalPrice: { type: Number, required: true },
    shippingAddress: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    status: { type: String, default: 'pending' }
}, { timestamps: true });
exports.OrderModel = (0, mongoose_1.model)("orders", orderSchema);
