// import "reflect-metadata";

import express, { Request, Response } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import fs from "fs";
import readline from "readline";
import dayjs from "dayjs";

import mongoose, { Mongoose } from "mongoose";

import { OrderItem, OrderRepository } from "./repositories/OrderRepository";
import {
  convertLineToOrderItem,
  IngestOrderItemsService,
  lineFormatter,
} from "./services/IngestOrderItemsService";
import { FindOrderService } from "./services/FindOrderService";

const orderRepository = new OrderRepository();
const app = express();

const dbUri = process.env.DB_URI as string;
const strPort = process.env.PORT as string;
const host = process.env.HOST as string;

const config = {
  port: parseInt(strPort),
  host,
};

async function dbConnect(uri) {
  return await mongoose.connect(uri);
}

const ingestOrderItemsService = new IngestOrderItemsService();
const findOrderService = new FindOrderService();

app.use(express.json());

app.use(
  fileUpload({
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// search route
app.get("/", async (req: Request, res: Response) => {
  const { orderId, fromDate, toDate } = req.query;
  const items = await findOrderService.execute({ orderId, fromDate, toDate });
  return res.json(items);
});


// ingest route (file upload key 'service')
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
        try {
          console.log("*** starting ingest process ***");

          await ingestOrderItemsService.execute(items);

          console.log("*** finished ingest process ***");

          return res.status(200).send({
            message: "the file has been ingested :)",
          });
        } catch (error) {
          console.error(error);

          return res.sendStatus(400).send({
            error: "error while processing the file",
          });
        }
      });
  } catch (error) {
    console.error(error);
    return res.sendStatus(500).send({
      error: "internal server error",
    });
  }
});

app.listen(config.port, config.host, () => {
  console.log(`server running on port ${config.port}`);

  dbConnect(dbUri)
    .then((connection) => {
      // db = connection;
      console.log("mongo initialized");
    })
    .catch((error) => {
      console.error("failed while connecting to the db");
      console.error(error);
    });
});
