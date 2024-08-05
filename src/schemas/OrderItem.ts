import mongoose from "mongoose";
const { Schema } = mongoose;

export interface OrderItemDocument extends mongoose.Document {
  userId: number;
  userName: string;
  orderId: number;
  productId: number;
  value: number;
  date: Date;
}

const orderItemSchema = new Schema<OrderItemDocument>(
  {
    userId: { type: Number, required: true },
    userName: { type: String, required: true },
    orderId: { type: Number, required: true },
    productId: { type: Number, required: true },
    value: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  { collection: "orderitems" }
);

export const OrderItemModel = mongoose.model<OrderItemDocument>("OrderItem", orderItemSchema);
