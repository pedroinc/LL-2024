import mongoose, { Aggregate } from "mongoose";
import { orderItemSchema } from "../schemas/OrderItem";
import { Console } from "console";

export type OrderItem = {
  userId: number;
  userName: string;
  orderId: number;
  productId: number;
  value: number;
  date: Date;
};

export type OrderFilters = {
  orderId: number | null;
  fromDate: Date | null;
  toDate: Date | null;
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

  public async find({
    orderId,
    fromDate,
    toDate,
  }: OrderFilters): Promise<OrderItem[]> {
    const OrderItemModel = mongoose.model("OrderItem", orderItemSchema);

    // const matchClause = {
    //   $match: {},
    // };

    // if (fromDate && toDate) {
    //   matchClause['$match']['date'] = {
    //     $gte: fromDate,
    //     $lte: toDate,
    //   }
    // }

    const pipeline = [
      {
        $match: orderId ? { orderId: orderId } : {},
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

  // public async find({
  //   orderIds,
  //   fromDate,
  //   toDate,
  // }: OrderFilters): Promise<OrderItem[]> {
  //   const OrderItemModel = mongoose.model("OrderItem", orderItemSchema);

  //   const ids =
  //     orderIds && orderIds.length
  //       ? orderIds.map((el) => {
  //           return new mongoose.mongo.ObjectId(el);
  //         })
  //       : undefined;

  //   // { "$in": ids }
  //   const pipeline = [
  //     {
  //       $match: orderId
  //         ? {
  //             orderId,
  //           }
  //         : {},

  //       date: {
  //         $gte: fromDate,
  //         $lte: toDate,
  //       },
  //     },
  //     {
  //       $match: ids
  //         ? {
  //             $orderId: { $in: ids },
  //           }
  //         : {},
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           userId: "$userId",
  //           userName: "$userName",
  //           orderId: "$orderId",
  //           date: "$date",
  //         },
  //         products: {
  //           $push: {
  //             product_id: "$productId",
  //             value: "$value",
  //           },
  //         },
  //         total: { $sum: "$value" },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           userId: "$_id.userId",
  //           userName: "$_id.userName",
  //         },
  //         orders: {
  //           $push: {
  //             order_id: "$_id.orderId",
  //             total: "$total",
  //             date: "$_id.date",
  //             products: "$products",
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         user_id: "$_id.userId",
  //         name: "$_id.userName",
  //         orders: "$orders",
  //       },
  //     },
  //   ];

  //   return (await OrderItemModel.aggregate(pipeline)) as OrderItem[];
  // }
}
