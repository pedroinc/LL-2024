import mongoose from "mongoose";
const { Schema } = mongoose;

export const orderItemSchema = new Schema(
  {
    userId: Number,
    userName: String,
    orderId: Number,
    productId: Number,
    value: Number,
    date: Date,
  },
  { collection: "orderitems" }
);