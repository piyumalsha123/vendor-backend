import { Document, model, Schema } from "mongoose"

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  VENDOR = "VENDOR"
}

export interface IUser extends Document {
  userId: string
  name: string
  email: string
  password: string
  roles: UserRole[]
  approved: boolean
  storeName?: string
  phone:string
  address:string
}

const userSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.USER]
    },
    approved: { type: Boolean, required: true },
    storeName: { type: String, required: false },
   phone: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
)

export const UserModel = model<IUser>("user_details", userSchema)
