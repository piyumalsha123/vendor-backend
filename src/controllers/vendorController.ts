import { Request, Response } from "express";
import { OrderModel } from "../models/orderModel";
import { ProductModel } from "../models/productModel";
import { Types } from "mongoose";

// AuthRequest interface එක middleware එකෙන් user ID එක එන නිසා භාවිතා කරයි
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;

    if (!vendorId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const vendorObjectId = new Types.ObjectId(vendorId);

    // 1. Total Revenue: items array එකේ vendorId එක match වන, 'completed' status එක ඇති ඒවා පමණක් ගණනය කිරීම
    const revenueData = await OrderModel.aggregate([
      { $unwind: "$items" },
      { 
        $match: { 
          "items.vendorId": vendorObjectId, 
          "items.status": "completed" 
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

    // 2. Active Orders: pending හෝ processing status එකේ ඇති items ගණනය කිරීම
    const activeOrders = await OrderModel.countDocuments({
      items: {
        $elemMatch: {
          vendorId: vendorObjectId,
          status: { $in: ["pending", "processing"] }
        }
      }
    });

    // 3. My Products Count: Product model එකේ අදාළ vendorId එක ඇති සියලුම නිෂ්පාදන
    const productCount = await ProductModel.countDocuments({ vendorId: vendorObjectId });

const recentOrders = await OrderModel.find({ 
    items: { 
        $elemMatch: { vendorId: vendorObjectId as any } 
    } 
} as any) // [සැ.යු: මෙය TypeScript එකේ strict checking මඟහැරීමට පාවිච්චි කරන කෙටි ක්‍රමයක්]
.sort({ createdAt: -1 })
.limit(5)
      .select("orderId customerId"); // මෙතැන customerName වෙනුවට అవශ්‍ය fields select කරන්න

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