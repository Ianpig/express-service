import express, { Request, Response } from "express";
import { createClient } from "redis";

const port = 8080;
const ENV = process.env.NODE_ENV || "production";

import type { RedisClientType } from "redis";

const client: RedisClientType = createClient({ url: process.env.REDIS_URL });

client.on("ready", () => {
  console.log("Connected!");
});

client.on("error", (err) => console.log("Redis Client Error", err));

const app = express();

app.use(express.json());

app.get("/ping", (_, res) => {
  res.status(200).send("pong");
});

// query redis endpoint
app.get("/query/:key", async (req: Request, res: Response) => {
  await client.connect();
  const key: string = req.params.key;

  try {
    const rawData = await client.get(key);
    await client.disconnect();
    if (!rawData) {
      return res
        .status(404)
        .send({ status: 404, code: "Value not found in Redis" });
    }

    res.status(200).send({ status: 200, code: "success", value: rawData });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error querying Redis");
  }
});

// Set Redis endpoint
app.post("/set", async (req: Request, res: Response) => {
  await client.connect();
  const key: string = req.body.key;
  const value: string = req.body.value;

  if (!key || !value) {
    return res.status(401).send({ status: 401, code: "Bad request" });
  }

  try {
    await client.set(`${key}`, `${value}`);
    res.status(200).send({ status: 200, code: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error setting value in Redis");
  }
  await client.disconnect();
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port} in ${ENV} environment`);
});

export { app as default, server };
