"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaymentNotification = void 0;
const crypto_1 = __importDefault(require("crypto"));
const orderModel_1 = require("../models/orderModel");
const handlePaymentNotification = async (req, res) => {
    try {
        const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;
        const merchantSecret = process.env.PAYHERE_SECRET;
        const merchantSecretHash = crypto_1.default.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const localMd5sig = crypto_1.default.createHash('md5')
            .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + merchantSecretHash)
            .digest('hex').toUpperCase();
        if (localMd5sig === md5sig && status_code === '2') {
            console.log(`Payment Successful for Order: ${order_id}`);
            const updatedOrder = await orderModel_1.OrderModel.findOneAndUpdate({ orderId: order_id }, { $set: { status: 'paid' } }, { new: true });
            if (!updatedOrder) {
                console.error(`Order ID ${order_id} not found in database.`);
            }
        }
        else {
            console.warn(`Payment verification failed or invalid status for Order: ${order_id}`);
        }
        res.sendStatus(200);
    }
    catch (error) {
        console.error("Payment Notification Error:", error);
        res.sendStatus(500);
    }
};
exports.handlePaymentNotification = handlePaymentNotification;
