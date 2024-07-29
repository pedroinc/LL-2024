import express, { Request, Response } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import fs from "fs";
import readline from "readline";
import dayjs from "dayjs";

const app = express();

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

type OrderItem = {
  userId: number;
  userName: string;
  orderId: number;
  productId: number;
  value: number;
  date: Date;
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
      .on("line", (rawLine) => {
        const fileLine = lineFormatter(rawLine);
        const orderItem = convertLineToOrderItem(fileLine);
        items.push(orderItem);
      })
      .on("close", () => {
        // TODO
        /*         
        terminou de extrair a lista do arquivo

        1. verifica se userId existe
        ...
        ...
        */

        return res.json(items);
      });
  } catch (error) {
    console.error(error);
    return res.json({ error });
  }
});

app.listen(4000, "0.0.0.0", () => {
  console.log(`server running on port 4000`);
});
