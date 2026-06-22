import { Request, Response } from "express";
import { IUser, UserModel, UserRole } from "../models/userModel";
import { CounterModel } from "../models/counterModel";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "../utils/token";
import { AuthRequest } from "../middleware/auth";

// api/v1/auth/register
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, roles , storeName , phone , address} = req.body;
  try {
    const exUser = await UserModel.findOne({ email });
    if (exUser) {
      return res.status(400).json({ message: "User already exists..!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const assignRoles = [UserRole.USER];
    if (roles?.includes("VENDOR") || roles?.includes(UserRole.VENDOR)) assignRoles.push(UserRole.VENDOR);
    if (roles?.includes("ADMIN") || roles?.includes(UserRole.ADMIN)) assignRoles.push(UserRole.ADMIN);

    const isApproved = true;

    const userCounter = await CounterModel.findOneAndUpdate(
      { id: "user_code" },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true } 
    );

    const generatedUserId = `U${String(userCounter?.seq || 1).padStart(3, '0')}`;

    const newUser = new UserModel({
      userId: generatedUserId,
      name,
      email,
      password: hashedPassword,
      roles: Array.from(new Set(assignRoles)),
      approved: isApproved,
      storeName,
      phone,
      address
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "Registration successfully..!",
      data: {
        userId: savedUser.userId,
        name: savedUser.name,
        email: savedUser.email,
        roles: savedUser.roles,
        approved: savedUser.approved,
        id: savedUser._id
      }
    });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "User ID generation error, please try again." });
    }
    res.status(500).json({ message: "Internal server error while creating user..!" });
  }
};

// api/v1/auth/login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user: IUser | null = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials..!" });
    }

    if (user.roles.includes(UserRole.VENDOR) && !user.approved) {
      return res.status(403).json({ message: "Your Vendor account is pending admin approval!" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials..!" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.status(200).json({
      message: "Success",
      data: {
        email: user.email,
        roles: user.roles,
        storeName: user.storeName,
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Internal server error while login..!" });
  }
};

// api/v1/auth/me
export const getMyDetails = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const user = await UserModel.findById(req.user.sub).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      message: "ok", 
      data: { 
        id: user._id, 
        userId: user.userId, 
        email: user.email, 
        roles: user.roles ,
        storeName: user.storeName
      } 
    });
  } catch (err) {
    console.error("GET ME ERROR:", err);
    res.status(500).json({ message: "Internal server error while fetching user details..!" });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
  
    const user = await UserModel.findById(id).select("name email phone address"); 
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};