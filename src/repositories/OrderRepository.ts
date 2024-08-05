import { Aggregate, Model, Types } from "mongoose";
import { OrderItemDocument, OrderItemModel } from "../schemas/OrderItem";
import { OrderItemFilters } from "../services/FindOrderService";

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
            _id: new Types.ObjectId(),
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

  public async findOneBy({
    userId,
    orderId,
    productId,
  }): Promise<OrderItemDocument | null> {
    return await OrderItemModel.findOne({
      userId,
      orderId,
      productId,
    });
  }

  public async find({
    orderId,
    fromDate,
    toDate,
  }: OrderItemFilters): Promise<any> {
    let matchClause = {};

    if (orderId) {
      matchClause["orderId"] = orderId;
    }

    if (fromDate && toDate) {
      matchClause["date"] = {
        $gte: fromDate,
        $lte: toDate,
      };
    }

    const pipeline = [
      {
        $match: matchClause,
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

    return await OrderItemModel.aggregate(pipeline);
  }
}
