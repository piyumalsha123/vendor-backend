import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  vendorId: mongoose.Types.ObjectId;
  userId: string;
  category: string;
  isActive: boolean;
  customAttributes: string[];
  deliveryMethods: string[];
  storeName: string;
  phone:string;
  email:string;
  address: string;
  logo: string;
}

const StoreSchema: Schema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'user_details', required: true },
  category: { type: String, required: true },
  userId: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  customAttributes: { type: [String], default: [] },
  deliveryMethods: { type: [String], default: [] },
  storeName: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  logo: { type: String, default: "" }
});

export default mongoose.model<IStore>('Store', StoreSchema);