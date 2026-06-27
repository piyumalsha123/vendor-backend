
import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { UserModel, UserRole } from "../models/userModel";
import { CounterModel } from "../models/counterModel";
import { signAccessToken, signRefreshToken } from "../utils/token";
import { AuthRequest } from "../middleware/auth";
import Store from "../models/storeModel";

// ========================= REGISTER =========================
export const createUser = async (req: Request, res: Response) => {
  try {
    console.log("🔥 REGISTER BODY:", req.body);

    const {
      name,
      email,
      password,
      roles,
      storeName,
      phone,
      address,
      category
    } = req.body;

    // ========================= CHECK USER =========================
    const exUser = await UserModel.findOne({ email });

    if (exUser) {
      console.log("❌ User already exists");

      return res.status(400).json({
        message: "User already exists!"
      });
    }

    // ========================= HASH PASSWORD =========================
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    // ========================= ASSIGN ROLES =========================
    const assignRoles = [UserRole.USER];

    if (roles?.includes("VENDOR")) {
      assignRoles.push(UserRole.VENDOR);
    }

    // ========================= GENERATE USER CODE =========================
    const userCounter = await CounterModel.findOneAndUpdate(
      { id: "user_code" },
      { $inc: { seq: 1 } },
      {
        returnDocument: "after",
        upsert: true
      }
    );

    const generatedUserId = `U${String(
      userCounter?.seq || 1
    ).padStart(3, "0")}`;

    // ========================= CREATE USER =========================
    const newUser = new UserModel({
      userId: generatedUserId,
      name,
      email,
      password: hashedPassword,
      roles: assignRoles,
      approved: true,

      // vendor optional details
      storeName: storeName || "",
      phone: phone || "",
      address: address || ""
    });

    const savedUser = await newUser.save();

    console.log("✅ USER SAVED:", savedUser._id);

    // ========================= CREATE STORE ONLY FOR VENDOR =========================
    if (assignRoles.includes(UserRole.VENDOR)) {
      console.log("🏪 Creating vendor store...");

      // store name required for vendor
      if (!storeName) {
        return res.status(400).json({
          message: "Store name is required for vendors"
        });
      }

      const store = await Store.create({
        vendorId: savedUser._id,
        userId: generatedUserId,

        storeName,
        phone: phone || "",
        email,
        address: address || "",

        // category can be empty initially
        category: category || "",

        isActive: true,
        customAttributes: [],
        deliveryMethods: [],
        logo: ""
      });

      console.log("✅ STORE CREATED:", store._id);
    }

    // ========================= RESPONSE =========================
    return res.status(201).json({
      message: "Registration successful!",
      data: {
        id: savedUser._id,
        email: savedUser.email,
        roles: savedUser.roles
      }
    });

  } catch (err: any) {
    console.error("🔥 FULL REGISTER ERROR:", err);

    return res.status(500).json({
      message: "Internal server error!",
      error: err.message
    });
  }
};

// ========================= LOGIN =========================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      console.log("❌ Login failed - user not found");

      return res.status(401).json({
        message: "Invalid credentials!"
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    console.log("🔑 Password valid:", isValid);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid credentials!"
      });
    }

    // ========================= TOKENS =========================
    const accessToken = signAccessToken(user);

    const refreshToken = signRefreshToken(user);

    // ========================= RESPONSE =========================
    return res.status(200).json({
  message: "Login successful",

  data: {
    id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    roles: user.roles,

    storeName: user.storeName,
    phone: user.phone,
    address: user.address,

    accessToken,
    refreshToken
  }
});

  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);

    return res.status(500).json({
      message: "Internal server error while login!"
    });
  }
};

// ========================= GET ME =========================
export const getMyDetails = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const user = await UserModel.findById(req.user.sub)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
  message: "ok",

  data: {
    id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,

    roles: user.roles,

    storeName: user.storeName,
    phone: user.phone,
    address: user.address
  }
});

  } catch (err) {
    console.error("🔥 GET ME ERROR:", err);

    return res.status(500).json({
      message: "Internal server error while fetching user details!"
    });
  }
};

// ========================= GET USER DETAILS =========================
export const getUserDetails = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id)
      .select("name email phone address");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json(user);

  } catch (err) {
    console.error("🔥 GET USER DETAILS ERROR:", err);

    return res.status(500).json({
      message: "Error fetching user details"
    });
  }
};

