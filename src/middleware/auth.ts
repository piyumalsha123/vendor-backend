import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserRole } from "../models/userModel";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
 

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token not found" });
  }


  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log("JWT Payload Data:", payload);
    
   
    (req as any).user = payload;
    
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired, please login again!" });
    }
    return res.status(400).json({ message: "Invalid Token" });
  }
};

export const isAdmin = (req: any, res: any, next: any) => {
  console.log("User Roles from Middleware:", req.user?.roles); 

  if (req.user && req.user.roles && Array.isArray(req.user.roles) && req.user.roles.includes(UserRole.ADMIN)) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};

