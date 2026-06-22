import { Request, Response } from 'express';
import crypto from 'crypto';
import { OrderModel } from '../models/orderModel'; 

export const handlePaymentNotification = async (req: Request, res: Response) => {
    try {
        const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;
        
      
        const merchantSecret = process.env.PAYHERE_SECRET; 

        const merchantSecretHash = crypto.createHash('md5').update(merchantSecret!).digest('hex').toUpperCase();
        const localMd5sig = crypto.createHash('md5')
            .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + merchantSecretHash)
            .digest('hex').toUpperCase();

        if (localMd5sig === md5sig && status_code === '2') {
            console.log(`Payment Successful for Order: ${order_id}`);

            
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

    
        res.sendStatus(200);

    } catch (error) {
        console.error("Payment Notification Error:", error);
        res.sendStatus(500); 
    }
};