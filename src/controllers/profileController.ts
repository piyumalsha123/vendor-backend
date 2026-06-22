import { Request, Response } from 'express';
import { UserModel } from "../models/userModel";

// Custom Request interface එකක් හදාගන්න (middleware එකෙන් එන user සඳහා)
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userPayload = (req as any).user;
    
    // මෙතනදී 'sub' යන්න භාවිතා කරන්න
    const userId = userPayload.sub || userPayload.id || userPayload.userId;

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in token" });
    }

    const user = await UserModel.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { name, phone, address } = req.body;
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      { name, phone, address },
      { new: true }
    ).select("-password");
    
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};