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
    return res.status(401).json({
      message: "Token not found",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);

    req.user = {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };

    next();

  } catch (err: any) {
    console.log("AUTH ERROR:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    }

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export const isAdmin = (
  req: any,
  res: any,
  next: any
) => {
  if (
    req.user &&
    req.user.roles &&
    req.user.roles.includes(UserRole.ADMIN)
  ) {
    next();
  } else {
    res.status(403).json({
      message: "Access denied",
    });
  }
};