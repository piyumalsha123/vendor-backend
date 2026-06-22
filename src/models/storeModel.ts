import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  vendorId: mongoose.Types.ObjectId;
  category: string;
  customAttributes: string[];
  deliveryMethods: string[];
  storeName: string;
  phone:string;
  email:string;
  logo: string;
}

const StoreSchema: Schema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  customAttributes: { type: [String], default: [] },
  deliveryMethods: { type: [String], default: [] },
  storeName: { type: String, default: "Cherish Boutique" },
  phone: { type: String },
  email: { type: String },
  logo: { type: String, default: "" }
});

export default mongoose.model<IStore>('Store', StoreSchema);