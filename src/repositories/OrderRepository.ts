import mongoose, { Aggregate } from "mongoose";
import { orderItemSchema } from "../schemas/OrderItem";

export type OrderItem = {
  userId: number;
  userName: string;
  orderId: number;
  productId: number;
  value: number;
  date: Date;
};

export class OrderRepository {


  public async save(items: OrderItem[]) {
    const OrderItemModel = mongoose.model("OrderItem", orderItemSchema);

    items.map(
      async ({
        userId,
        userName,
        orderId,
        productId,
        value,
        date,
      }: OrderItem) => {
        try {
          const doc = new OrderItemModel({
            _id: new mongoose.Types.ObjectId(),
            userId,
            userName,
            orderId,
            productId,
            value,
            date,
          });
          const newDoc = await doc.save();
          console.log(newDoc);
        } catch (error) {
          console.error(error);
        }
      }
    );    
  }

  public async find(orderId?: number[]): Promise<OrderItem[]> {
    const OrderItemModel = mongoose.model("OrderItem", orderItemSchema);

    const ids = orderId && orderId.length ? orderId.map((el) => {
      return new mongoose.Types.ObjectId(el);
    }) : undefined;
    // { "$in": ids }
    const pipeline = [
      // {
      //   $match: orderId
      //     ? {
      //         orderId,
      //       }
      //     : {},
      // },
      {
        $match: orderId
          ? {
            $orderId: { "$in": ids },
            }
          : {},
      },      
      {
        $group: {
          _id: {
            userId: "$userId",
            userName: "$userName",
            orderId: "$orderId",
            date: "$date",
          },
          products: {
            $push: {
              product_id: "$productId",
              value: "$value",
            },
          },
          total: { $sum: "$value" },
        },
      },
      {
        $group: {
          _id: {
            userId: "$_id.userId",
            userName: "$_id.userName",
          },
          orders: {
            $push: {
              order_id: "$_id.orderId",
              total: "$total",
              date: "$_id.date",
              products: "$products",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          user_id: "$_id.userId",
          name: "$_id.userName",
          orders: "$orders",
        },
      },
    ];

    return (await OrderItemModel.aggregate(pipeline)) as OrderItem[];
  }
}
