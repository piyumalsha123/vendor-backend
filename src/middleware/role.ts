import { NextFunction, Request, Response } from "express"
import { UserRole } from "../models/userModel"
import { AuthRequest } from "./auth"

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    
    const hasRole = roles.some((role) => req.user.roles?.includes(role))
    if (!hasRole) {
      // 403 - Forbidden
      return res.status(403).json({
        message: `Require ${roles} role`
      })
    }
    next()
  }
}
