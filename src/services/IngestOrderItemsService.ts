import { Types } from "mongoose";
import { OrderItem, OrderRepository } from "../repositories/OrderRepository";
import { OrderItemModel } from "../schemas/OrderItem";
import dayjs from "dayjs";

const orderRepository = new OrderRepository();

export type RequestFileLine = {
  userId: string; // 10
  userName: string; // 45
  orderId: string; // 10
  productId: string; // 10
  value: string; // 12
  date: string; // 8
};

export const lineFormatter = (rawLine: string): RequestFileLine => {
  const userId = rawLine.substring(0, 10);
  const userName = rawLine.substring(10, 55).trim();
  const orderId = rawLine.substring(55, 65);
  const productId = rawLine.substring(65, 75);
  const value = rawLine.substring(75, 87).trim();
  const date = rawLine.substring(87, 95);

  return {
    userId,
    userName,
    orderId,
    productId,
    value,
    date,
  } as RequestFileLine;
};

export const convertLineToOrderItem = (fileLine: RequestFileLine): OrderItem => {
  const strYear = fileLine.date.substring(0, 4);
  const strMonth = fileLine.date.substring(4, 6);
  const strDay = fileLine.date.substring(6, 8);

  return {
    userId: parseInt(fileLine.userId),
    userName: fileLine.userName,
    orderId: parseInt(fileLine.orderId),
    productId: parseInt(fileLine.productId),
    value: parseFloat(fileLine.value),
    date: dayjs(`${strYear}-${strMonth}-${strDay}`).toDate(),
  };
};

export class IngestOrderItemsService {
  async execute(items: OrderItem[]): Promise<void> {
    
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
          const existedItem = await orderRepository.findOneBy({
            userId,
            orderId,
            productId,
          });

          if (existedItem) {
            existedItem.userName = userName;
            existedItem.value = value;
            existedItem.date = date;
            await existedItem.save();
          } else {
            const doc = new OrderItemModel({
              _id: new Types.ObjectId(),
              userId,
              userName,
              orderId,
              productId,
              value,
              date,
            });
            await doc.save();
          }
        } catch (error) {
          console.error("error while creating an order item", error);
        }
      }
    );
  }
}
