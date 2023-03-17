import express, { Request, Response } from "express";
import redis from "redis";
import { promisify } from "util";

import type { RedisClientType } from "redis";

const client: RedisClientType = redis.createClient(); // Create Redis client
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const app = express();

app.use(express.json()); // Parse JSON body

// Query Redis endpoint
app.get("/query/:key", async (req: Request, res: Response) => {
  const key: string = req.params.key;

  try {
    const value: string | null = await getAsync(key);

    if (!value) {
      return res.status(404).send("Value not found in Redis");
    }

    res.send(value);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error querying Redis");
  }
});

// Set Redis endpoint
app.post("/set", async (req: Request, res: Response) => {
  const key: string = req.body.key;
  const value: string = req.body.value;

  if (!key || !value) {
    return res.status(400).send("Both key and value are required");
  }

  try {
    await setAsync(key, value);
    res.send("Value set successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error setting value in Redis");
  }
});

app.listen(3000, () => {
  console.log("App listening on port 3000");
});
