import { Request, Response } from 'express';
import crypto from 'crypto';
import { OrderModel } from '../models/orderModel'; 

export const handlePaymentNotification = async (req: Request, res: Response) => {
    try {
        const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;
        
        // .env එකෙන් Secret එක ලබාගැනීම (ආරක්ෂිත ක්‍රමය)
        const merchantSecret = process.env.PAYHERE_SECRET; 

        // MD5 Hash පරීක්ෂාව
        const merchantSecretHash = crypto.createHash('md5').update(merchantSecret!).digest('hex').toUpperCase();
        const localMd5sig = crypto.createHash('md5')
            .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + merchantSecretHash)
            .digest('hex').toUpperCase();

        // 1. Hash පරීක්ෂාව සහ Status 2 (සාර්ථක) දැයි බැලීම
        if (localMd5sig === md5sig && status_code === '2') {
            console.log(`Payment Successful for Order: ${order_id}`);

            // Database එකේ Status 'paid' ලෙස යාවත්කාලීන කිරීම
            const updatedOrder = await OrderModel.findOneAndUpdate(
                { orderId: order_id }, 
                { $set: { status: 'paid' } },
                { new: true }
            );

            if (!updatedOrder) {
                console.error(`Order ID ${order_id} not found in database.`);
            }
        } else {
            console.warn(`Payment verification failed or invalid status for Order: ${order_id}`);
        }

        // PayHere එකට 200 OK යැවීම අනිවාර්යයි
        res.sendStatus(200);

    } catch (error) {
        console.error("Payment Notification Error:", error);
        res.sendStatus(500); // යම් දෝෂයක් වුවහොත් 500 යවන්න
    }
};