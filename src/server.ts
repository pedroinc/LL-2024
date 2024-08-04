// import "reflect-metadata";

import express, { Request, Response } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import fs from "fs";
import readline from "readline";
import dayjs from "dayjs";

import mongoose, { Mongoose } from "mongoose";

import { OrderItem, OrderRepository } from "./repositories/OrderRepository";

const orderRepository = new OrderRepository();
const app = express();

const dbUri = process.env.DB_URI as string;
const strPort = process.env.PORT as string;
const host = process.env.HOST as string;

const config = {
  port: parseInt(strPort),
  host,
};

let db: Mongoose;

async function dbConnect(uri) {
  return await mongoose.connect(uri);
}

// const createOrderItemService = new CreateOrderItemService();

app.use(express.json());

app.use(
  fileUpload({
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

type RequestFileLine = {
  userId: string; // 10
  userName: string; // 45
  orderId: string; // 10
  productId: string; // 10
  value: string; // 12
  date: string; // 8
};

const lineFormatter = (line: string): RequestFileLine => {
  const userId = line.substring(0, 10);
  const userName = line.substring(10, 55).trim();
  const orderId = line.substring(55, 65);
  const productId = line.substring(65, 75);
  const value = line.substring(75, 87).trim();
  const date = line.substring(87, 95);

  return {
    userId,
    userName,
    orderId,
    productId,
    value,
    date,
  } as RequestFileLine;
};

const convertLineToOrderItem = (rawLine: RequestFileLine): OrderItem => {
  const strYear = rawLine.date.substring(0, 4);
  const strMonth = rawLine.date.substring(4, 6);
  const strDay = rawLine.date.substring(6, 8);

  return {
    userId: parseInt(rawLine.userId),
    userName: rawLine.userName,
    orderId: parseInt(rawLine.orderId),
    productId: parseInt(rawLine.productId),
    value: parseFloat(rawLine.value),
    date: dayjs(`${strYear}-${strMonth}-${strDay}`).toDate(),
  };
};

app.get("/", async (req: Request, res: Response) => {
  const { orderId, fromDate, toDate } = req.query;

  const fromDateStartOfDay = fromDate
    ? dayjs(fromDate as string)
        .startOf("day")
        .toDate()
    : null;
  const toDateEndOfDay = toDate
    ? dayjs(toDate as string)
        .endOf("day")
        .toDate()
    : null;

  let orderIdNum = orderId ? parseInt(orderId as string) : null;

  const items = await orderRepository.find({
    orderId: orderIdNum,
    fromDate: fromDateStartOfDay,
    toDate: toDateEndOfDay,
  });

  return res.json(items);
});

app.post("/upload", async (req: Request, res: Response) => {
  try {
    const { tempFilePath } = req.files?.service as UploadedFile;

    const file = readline.createInterface({
      input: fs.createReadStream(tempFilePath),
      output: process.stdout,
      terminal: false,
    });

    const items: OrderItem[] = [];

    file
      .on("line", async (rawLine) => {
        const fileLine = lineFormatter(rawLine);
        const orderItem = convertLineToOrderItem(fileLine);
        items.push(orderItem);
      })
      .on("close", async () => {
        // await orderRepository.save(items);

        const listOfOrderIDs = items.map((item) => item.orderId);

        const uniqueOrderIDs = new Set(listOfOrderIDs);

        console.log(uniqueOrderIDs);
        // const OrderItemModel = mongoose.model("OrderItem", orderItemSchema);

        // items.map(
        //   async ({
        //     userId,
        //     userName,
        //     orderId,
        //     productId,
        //     value,
        //     date,
        //   }: OrderItem) => {
        //     try {
        //       const doc = new OrderItemModel({
        //         _id: new mongoose.Types.ObjectId(),
        //         userId,
        //         userName,
        //         orderId,
        //         productId,
        //         value,
        //         date,
        //       });
        //       const newDoc = await doc.save();
        //       // console.log(newDoc);
        //     } catch (error) {
        //       console.error(error);
        //     }
        //   }
        // );
        return res.json(items);
      });
  } catch (error) {
    console.error(error);
    return res.json({ error });
  }
});

app.listen(config.port, config.host, () => {
  console.log(`server running on port ${config.port}`);

  dbConnect(dbUri)
    .then((connection) => {
      db = connection;
      console.log("mongo initialized");
      console.log(db);
    })
    .catch((error) => {
      console.error("failed while connecting to the db");
      console.error(error);
    });
});
