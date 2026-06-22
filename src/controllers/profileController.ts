import { Request, Response } from 'express';
import { UserModel } from "../models/userModel";
import bcrypt from "bcrypt";

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
    const userPayload = (req as any).user;
    const userId = userPayload.userId || userPayload.id || userPayload._id || userPayload.sub;

    console.log("Extracted User ID:", userId);

    if (!userId) {
      return res.status(400).json({ message: "Token does not contain user identifier" });
    }

    const user = await UserModel.findById(userId);
    
    if (!user) {
     console.log("User not found with _id:", userId); 
  return res.status(404).json({ message: "User not found" });
    }

    // 2. මුරපද පරීක්ෂාව (user Object එක භාවිතා කරන්න)
    if (req.body.newPassword && req.body.oldPassword) {
      const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect Old Password!" });
      }
      user.password = await bcrypt.hash(req.body.newPassword, 10);
    }

    // 3. අනෙකුත් දත්ත update කිරීම (user Object එක භාවිතා කරන්න)
    const { name, phone, address } = req.body;
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    // 4. දැන් user එක save කරන්න
    await user.save();
    
    return res.status(200).json({ message: "Profile updated successfully!" });
  } catch (error: any) {
    return res.status(500).json({ message: "Update failed", error: error.message });
  }
};