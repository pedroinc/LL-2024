import { getEndOfDay, getStartOfDay } from "./date";

test("when using a valid date input, should return an instance of date", () => {
  const startOfDay = getStartOfDay("2024-06-20");
  expect(startOfDay).toBeInstanceOf(Date);
});

test("when using a valid date input, should return an instance of date", () => {
  const endOfDay = getEndOfDay("2024-06-22");
  expect(endOfDay).toBeInstanceOf(Date);
});
