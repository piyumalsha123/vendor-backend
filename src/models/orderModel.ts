import { Document, model, Schema } from "mongoose";

// අලුතින් Item interface එකක් හදමු
interface IOrderItem {
    productId: Schema.Types.ObjectId;
    vendorId: Schema.Types.ObjectId;
    title: string;
    price: number;
    quantity: number;
    images: string[];
    status: string;
    selectedVariant?: {
        size?: string;
        color?: string;
        flavor?: string;
    };
}

export interface IOrder extends Document {
    orderId: string;
    customerId: Schema.Types.ObjectId;
    vendorId: Schema.Types.ObjectId;
    items: IOrderItem[]; // මෙතැනට Array එකක් දාන්න
    totalPrice: number;
    shippingAddress: string;
    phoneNumber: string;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'paid';
}

// orderModel.ts
const orderSchema = new Schema<IOrder>({
    orderId: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "user_details", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "user_details", required: true },
    // මෙතැන ප්‍රධානම වෙනස:
    items: [{
    productId: { type: Schema.Types.ObjectId, ref: "products", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "user_details", required: true }, // අයිතමයට අදාළ vendorId
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    images: [{ type: String }],
    status: { type: String, default: 'pending' }, // item මට්ටමේ status එක
    selectedVariant: {
        size: String,
        color: String,
        flavor: String
    }
}],
    totalPrice: { type: Number, required: true },
    shippingAddress: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    status: { type: String, default: 'pending' }
}, { timestamps: true });

export const OrderModel = model<IOrder>("orders", orderSchema);