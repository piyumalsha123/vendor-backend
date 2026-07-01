import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { OrderModel } from "../models/orderModel";
import { CounterModel } from "../models/counterModel";

import mongoose from "mongoose";
import storeModel from "../models/storeModel";

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.sub || req.user?.id;
    const { items, totalPrice, shippingAddress, phoneNumber } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ message: "No items" });

    const counter = await CounterModel.findOneAndUpdate(
        { id: "order_code" }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true }
    );
    const commonOrderId = `OD${String(counter.seq).padStart(3, '0')}`;

    const groupedItems: any = {};
    items.forEach((item: any) => {
        if (!groupedItems[item.vendorId]) groupedItems[item.vendorId] = [];
        groupedItems[item.vendorId].push(item);
    });

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

    await Promise.all(orderPromises);
    
    res.status(201).json({ message: "All items saved successfully!" });
  } catch (error) { 
    console.error("CRITICAL ERROR:", error);
    res.status(500).json({ message: "Failed to place order" }); 
  }
};
export const getVendorOrders = async (req: AuthRequest, res: Response) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.sub || req.user.id);

    const orders = await OrderModel.aggregate([
      { $match: { "items.vendorId": vendorId } },
      {
        $lookup: {
          from: "user_details",
          localField: "customerId",
          foreignField: "_id",
          as: "customerInfo"
        }
      },
      { $unwind: { path: "$customerInfo", preserveNullAndEmptyArrays: true } },
      
      {
        $addFields: {
          debug_customerInfo: "$customerInfo" 
        }
      },

      {
        $project: {
          orderId: 1,
          status: 1,
          totalPrice: 1,
          customerId: 1,
          customerName: "$customerInfo.name",
          customerEmail: "$customerInfo.email",
          debug_customerInfo: 1, 
          items: { $filter: { input: "$items", as: "item", cond: { $eq: ["$$item.vendorId", vendorId] } } }
        }
      }
    ]);

    console.log("Orders with Customer Info:", JSON.stringify(orders, null, 2)); 
    res.status(200).json({ data: orders });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};


export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const vendorId = req.user?.sub || req.user?.id; 

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { _id: id, vendorId: vendorId }, 
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

export const getCustomerOrders = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = new mongoose.Types.ObjectId(req.user?.sub || req.user?.id);
  
    const allStores = await storeModel.find({}).lean();
    
    const orders = await OrderModel.aggregate([
      { $match: { customerId: customerId } },
      { $sort: { createdAt: -1 } }
    ]);

    const ordersWithStores = orders.map(order => ({
      ...order,
      allStoreDetails: allStores 
    }));

    res.json({ data: ordersWithStores });
  } catch (error) { res.status(500).json({ message: "Error" }); }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user?.sub || req.user?.id;

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

export const deleteOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const customerId = req.user?.sub || req.user?.id;

        // ID එක නිවැරදි දැයි බලන්න
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const result = await OrderModel.deleteOne({ _id: id, customerId: customerId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error: any) {
        // දෝෂය console එකට අරගෙන client එකට යවන්න
        console.error("DELETE ORDER ERROR:", error);
        res.status(500).json({ message: "Server error", details: error.message });
    }
};