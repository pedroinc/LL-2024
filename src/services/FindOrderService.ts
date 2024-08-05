import dayjs from "dayjs";
import { OrderRepository } from "../repositories/OrderRepository";
import { getEndOfDay, getStartOfDay } from "../helpers/date";

const orderRepository = new OrderRepository();

interface QueryParams {
  orderId?: string | null | unknown;
  fromDate?: string | null | unknown;
  toDate?: string | null | unknown;
}

interface OrderItemFilters {
  orderId?: number | null;
  fromDate?: Date | null;
  toDate?: Date | null;
}

export class FindOrderService {
  async execute({ orderId, fromDate, toDate }: QueryParams) {
    const fromDateStartOfDay = getStartOfDay(fromDate as string);

    const toDateEndOfDay = getEndOfDay(toDate as string);

    const orderIdNum = orderId ? parseInt(orderId as string) : null;

    return await orderRepository.find({
      orderId: orderIdNum,
      fromDate: fromDateStartOfDay,
      toDate: toDateEndOfDay,
    });
  }
}
