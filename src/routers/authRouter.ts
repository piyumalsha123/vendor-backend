import { Router } from "express"
import { createUser, getMyDetails, login } from "../controllers/authController"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { UserRole } from "../models/userModel"

const router = Router()

// PUBLIC
router.post("/register", createUser)
router.post("/login", login)

// PROTECTED
router.get("/me", authenticate, getMyDetails)

// ADMIN only
router.get("/admin/dashboard", authenticate, requireRole([UserRole.ADMIN]), (req, res) => {
  res.json({ message: "Welcome to Admin Dashboard!" })
})

// VENDOR only
router.post("/vendor/add-product", authenticate, requireRole([UserRole.VENDOR]), (req, res) => {
  res.json({ message: "Welcome Vendor! You can add products here." })
})

export default router
