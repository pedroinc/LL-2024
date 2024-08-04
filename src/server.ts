// import "reflect-metadata";

import express, { Request, Response } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import fs from "fs";
import readline from "readline";
import dayjs from "dayjs";

import mongoose, { Mongoose } from "mongoose";
// import { AppDataSource } from "./database/data-source";
import {
  CreateOrderItemService,
  OrderItem,
} from "./services/CreateOrderItemService";
import { orderItemSchema } from "./schemas/OrderItem";

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

type ProductResponse = {
  product_id: number;
  value: number;
};

type OrderResponse = {
  order_id: number;
  total: number;
  date: Date;
  products: ProductResponse[];
};

type UserResponse = {
  user_id: number;
  name: string;
  orders: OrderResponse[];
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

const convertLineToOrderItem = (line: RequestFileLine): OrderItem => {
  const strYear = line.date.substring(0, 4);
  const strMonth = line.date.substring(4, 6);
  const strDay = line.date.substring(6, 8);

  return {
    userId: parseInt(line.userId),
    userName: line.userName,
    orderId: parseInt(line.orderId),
    productId: parseInt(line.productId),
    value: parseFloat(line.value),
    date: dayjs(`${strYear}-${strMonth}-${strDay}`).toDate(),
  };
};

// app.get("/", async (req: Request, res: Response) => {
//   const OrderItemModel = mongoose.model("OrderItem", orderItemSchema);
//   const items = await OrderItemModel.find();
//   return res.json(items);
// });

app.get("/", async (req: Request, res: Response) => {
  const OrderItemModel = mongoose.model("OrderItem", orderItemSchema);

  // const items = await OrderItemModel.aggregate([
  //   {
  //     $match: {
  //       orderId: 177,
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: "$orderId",
  //       total: { $sum: "$value" },
  //       orders: {
  //         $push: {
  //           order_id: "$orderId",
  //           user_id: "$userId",
  //           name: "$userName",
  //           date: "$date",
  //           products: {
  //             product_id: "$productId",
  //             value: "$value",
  //           },
  //         },
  //       },
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       orderId: "$_id",
  //       total: 1,
  //       orders: 1,
  //     },
  //   },
  // ]);

  const items = await OrderItemModel.aggregate([
    {
      $match: {
        orderId: 177,
      },
    },
    {
      $project: {
        _id: 0,
        user_id: "$userId",
        name: "$userName",
        orders: [
          {
            order_id: "$orderId",
            total: { $sum: "$value" },
            date: "$date",
            products: [{ product_id: "$productId", value: "$value" }],
          },
        ],
      },
    },
  ]);

  //   {
  //     $group: { _id: "$name", totalQuantity: { $sum: "$quantity" } }
  //  }

  return res.json(items);
});

app.post("/upload", async (req: Request, res: Response) => {
  try {
    const { tempFilePath } = req.files?.service as UploadedFile;

    const items: OrderItem[] = [];

    const file = readline.createInterface({
      input: fs.createReadStream(tempFilePath),
      output: process.stdout,
      terminal: false,
    });

    file
      .on("line", async (rawLine) => {
        const fileLine = lineFormatter(rawLine);
        const orderItem = convertLineToOrderItem(fileLine);
        items.push(orderItem);
      })
      .on("close", async () => {
        // TODO
        /*         
        terminou de extrair a lista do arquivo
        */

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
              // console.log(newDoc);
            } catch (error) {
              console.error(error);
            }
          }
        );
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
