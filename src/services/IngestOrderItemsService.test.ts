import { OrderItem } from "../repositories/OrderRepository";
import {
  convertLineToOrderItem,
  lineFormatter,
} from "./IngestOrderItemsService";

test("when using a valid date input, should return an instance of date", () => {
  const rawTxtFileLine =
    "0000000070                              Palmer Prosacco00000007530000000003     1836.7420210308";

  const fileLine = lineFormatter(rawTxtFileLine);
  expect(fileLine.userId).toBeTruthy();
  expect(fileLine.userName).toBeTruthy();
  expect(fileLine.orderId).toBeTruthy();
  expect(fileLine.productId).toBeTruthy();
  expect(fileLine.value).toBeTruthy();
  expect(fileLine.date).toBeTruthy();

  const orderItem = convertLineToOrderItem(fileLine);
  expect(orderItem).toMatchObject<OrderItem>;
  expect(orderItem.date).toBeInstanceOf(Date);
});

