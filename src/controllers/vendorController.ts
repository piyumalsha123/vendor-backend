import { Request, Response } from "express";
import { OrderModel } from "../models/orderModel";
import { ProductModel } from "../models/productModel";
import { Types } from "mongoose";

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
   const vendorId = req.user?.id || (req as any).user?.sub;

    if (!vendorId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const vendorObjectId = new Types.ObjectId(vendorId);

    const revenueData = await OrderModel.aggregate([
  { $unwind: "$items" },
  { 
    $match: { 
      "items.vendorId": vendorObjectId, 
      "items.status": { $ne: "cancelled" } 
    } 
  },
  { 
    $group: { 
      _id: null, 
      total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } 
    } 
  }
]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    const activeOrders = await OrderModel.countDocuments({
      items: {
        $elemMatch: {
          vendorId: vendorObjectId,
          status: { $in: ["pending", "processing"] }
        }
      }
    });

    const productCount = await ProductModel.countDocuments({ vendorId: vendorObjectId });

const recentOrders = await OrderModel.find({ 
    items: { 
        $elemMatch: { vendorId: vendorObjectId as any } 
    } 
} as any) 
.sort({ createdAt: -1 })
.limit(5)
.populate("customerId", "name"); 

    res.status(200).json({
      totalRevenue,
      activeOrders,
      productCount,
      recentOrders
    });
  } catch (err: any) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};