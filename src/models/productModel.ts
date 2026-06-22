import { Document, model, Schema, Types } from "mongoose";

export interface IProduct extends Document {
  productId: string;
  vendorId: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: 'clothing' | 'foods' | 'flowers' | 'crafts' | 'other';
  images: string[];
  variants: any;
  variantsMetadata:any;
  isAvailable: boolean;
  paymentMethods: {
    cod: boolean;
    bankTransfer: boolean;
  };
  deliveryCharge: number;
}

const productSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "user_details", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: {
      type: String,
      enum: ['clothing', 'foods', 'flowers', 'crafts', 'other'],
      required: true,
    },
    images: { type: [String], default: [] },
    // variants: { type: Schema.Types.Mixed, default: {} },
    variants: { type: Object },
    variantsMetadata: { type: Object },
    isAvailable: { type: Boolean, default: true },
    paymentMethods: {
      cod: { type: Boolean, default: false },
      bankTransfer: { type: Boolean, default: false },
    },
    deliveryCharge: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProductModel = model<IProduct>("products", productSchema);