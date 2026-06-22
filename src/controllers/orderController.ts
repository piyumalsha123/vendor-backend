import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { OrderModel } from "../models/orderModel";
import { CounterModel } from "../models/counterModel";

import mongoose from "mongoose";
import storeModel from "../models/storeModel";

// export const createOrder = async (req: AuthRequest, res: Response) => {
//   try {
//     const customerId = req.user?.sub || req.user?.id;
//     const { items, totalPrice, shippingAddress, phoneNumber } = req.body;

//     // 1. භාණ්ඩ Vendor අනුව Group කිරීම
//     const groupedItems: any = {};
//     items.forEach((item: any) => {
//         if (!groupedItems[item.vendorId]) groupedItems[item.vendorId] = [];
//         groupedItems[item.vendorId].push(item);
//     });

//     // 2. සෑම Vendor කෙනෙකුටම වෙනම Order එකක් ලෙස Save කිරීම
//     for (const vendorId in groupedItems) {
//         const counter = await CounterModel.findOneAndUpdate(
//             { id: "order_code" }, { $inc: { seq: 1 } }, { new: true, upsert: true }
//         );
//         const orderId = `OD${String(counter.seq).padStart(3, '0')}`;

//         const newOrder = new OrderModel({
//             orderId,
//             customerId,
//             vendorId: vendorId, // මෙය එම Vendor ට පමණක් අදාළ වේ
//             items: groupedItems[vendorId],
//             totalPrice: groupedItems[vendorId].reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0),
//             shippingAddress,
//             phoneNumber,
//             status: "pending"
//         });
//         await newOrder.save();
//     }

//     res.status(201).json({ message: "Orders placed successfully!" });
//   } catch (error) {
//     res.status(500).json({ message: "Error" });
//   }
// };

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.sub || req.user?.id;
    const { items, totalPrice, shippingAddress, phoneNumber } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ message: "No items" });

    // 1. Counter එක update කරලා අලුත් Order ID එක ගන්න
    const counter = await CounterModel.findOneAndUpdate(
        { id: "order_code" }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true }
    );
    const commonOrderId = `OD${String(counter.seq).padStart(3, '0')}`;

    // 2. භාණ්ඩ Vendor අනුව බෙදන්න (Group)
    const groupedItems: any = {};
    items.forEach((item: any) => {
        if (!groupedItems[item.vendorId]) groupedItems[item.vendorId] = [];
        groupedItems[item.vendorId].push(item);
    });

    // 3. සෑම Vendor කෙනෙකුටම වෙනම Document එකක් ලෙස Save කරන්න (මේක තමයි වැදගත්ම තැන)
    const orderPromises = Object.keys(groupedItems).map(async (vendorId) => {
        const vendorItems = groupedItems[vendorId];
        const vendorTotalPrice = vendorItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

        const newOrder = new OrderModel({
            orderId: commonOrderId,
            customerId,
            vendorId: vendorId,
            items: vendorItems,
            totalPrice: vendorTotalPrice,
            shippingAddress,
            phoneNumber,
            status: "pending"
        });
        return await newOrder.save();
    });

    // සියලුම Orders Save වන තෙක් බලා සිටින්න
    await Promise.all(orderPromises);
    
    res.status(201).json({ message: "All items saved successfully!" });
  } catch (error) { 
    console.error("CRITICAL ERROR:", error);
    res.status(500).json({ message: "Failed to place order" }); 
  }
};
// Backend: orderController.ts
export const getVendorOrders = async (req: AuthRequest, res: Response) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.sub || req.user.id);

    const orders = await OrderModel.aggregate([
      // 1. ඇණවුම් අතරින් අදාළ වෙළෙන්දාගේ භාණ්ඩ ඇති ඒවා පමණක් සොයන්න
      { $match: { "items.vendorId": vendorId } },
      
      // 2. අදාළ වෙළෙන්දාගේ භාණ්ඩ පමණක් පෙන්වන පරිදි ඇණවුම පෙරන්න (Filter)
      {
        $project: {
          orderId: 1,
          customerId: 1,
          status: 1,
          items: {
            $filter: {
              input: "$items",
              as: "item",
              cond: { $eq: ["$$item.vendorId", vendorId] }
            }
          },
          // එම වෙළෙන්දාගේ භාණ්ඩවල මුළු මිල පමණක් ගණනය කිරීම
          totalPrice: {
             $reduce: {
                input: { $filter: { input: "$items", as: "item", cond: { $eq: ["$$item.vendorId", vendorId] } } },
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: ["$$this.price", "$$this.quantity"] }] }
             }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({ data: orders });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};


export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const vendorId = req.user?.sub || req.user?.id; // ලොග් වී සිටින Vendor ගේ ID එක

    // යාවත්කාලීන කිරීමේදී vendorId එකත් අනිවාර්යයෙන් පරීක්ෂා කරන්න
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { _id: id, vendorId: vendorId }, // එම ඇණවුම අයිති මෙම Vendor ට පමණක් බව සහතික කිරීම
      { $set: { status: status } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found or unauthorized!" });
    }

    res.json({ message: "Order updated successfully!", data: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// orderController.ts
export const getCustomerOrders = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = new mongoose.Types.ObjectId(req.user?.sub || req.user?.id);
    
    // සියලුම stores ලබා ගැනීම
    const allStores = await storeModel.find({}).lean();
    
    const orders = await OrderModel.aggregate([
      { $match: { customerId: customerId } },
      { $sort: { createdAt: -1 } }
    ]);

    // orders වලට allStoreDetails අරේ එක එකතු කිරීම
    const ordersWithStores = orders.map(order => ({
      ...order,
      allStoreDetails: allStores // මෙය Frontend එකට යවන්න
    }));

    res.json({ data: ordersWithStores });
  } catch (error) { res.status(500).json({ message: "Error" }); }
};

// Backend: orderController.ts
export const cancelOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user?.sub || req.user?.id;

        // deleteMany වෙනුවට updateMany භාවිතා කරන්න
        const result = await OrderModel.updateMany(
            { orderId: orderId, customerId: customerId, status: 'pending' },
            { $set: { status: 'cancelled' } }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: "Only pending orders can be cancelled." });
        }
        
        res.status(200).json({ message: "Order cancelled successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};