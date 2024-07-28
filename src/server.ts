import express, { Request, Response } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
const fs = require("fs");
import readline from "readline";

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
  userId: string;    // 10
  userName: string;  // 45
  orderId: string;   // 10
  productId: string; // 10
  value: string;     // 12
  date: string;      // 8
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

app.post("/upload", async (req: Request, res: Response) => {
  try {
    const { tempFilePath } = req.files?.service as UploadedFile;

    const items: RequestFileLine[] = [];

    const file = readline.createInterface({
      input: fs.createReadStream(tempFilePath),
      output: process.stdout,
      terminal: false,
    });

    file
      .on("line", (line) => {
        const requestFileLine = lineFormatter(line);
        items.push(requestFileLine);
      })
      .on("close", () => {
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
