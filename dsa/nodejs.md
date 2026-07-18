### Build a simple EventEmitter
```javascript
class EventEmitter {
    constructor(){
        this.events = {};
    }

    on(eventName,listiner){
        if(!this.events[eventName]){
            this.events[eventName]=[];
        }
        this.events[eventName].push(listiner);
        return this;
    }

    emit(eventName,...args){
        const listiners = this.events[eventName];
        if(!listiners) return false;
        listiners.forEach(listiner => {
            listiner(...args);
        });
        return true;
    }

   off(eventName,listiner){
    const listiners = this.events[eventName];
     if(!listiners) return this;
     this.events[eventName] = listiners.filter((fn)=>fn !== listiner);
     return this;
   }

}

const emitter = new EventEmitter();

function handleLogin(user) {
  console.log(`${user} logged in`);
}

emitter.on("login", handleLogin);

emitter.emit("login", "Vikrant");
// Vikrant logged in

emitter.off("login", handleLogin);

emitter.emit("login", "Rahul");
```

### Build an Express middleware
```javascript

const loggerMiddleware = (req,res,next)=>{
       console.log(`method: ${req.method}, url: ${req.url}`);
       console.log(`time: ${new Date().toISOString()}`);
       next();
}

```

### JWT authentication middleware
```javascript
const jwt = require('jsonwebtoken');

const authonticate = (req,res,next) =>{
    try{

    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startWith(`Bearer`)){
        return res.status(401).json({
            success:false,
            message:"Authentication token is require."
        })
    }

    const token = authHeader.split(' ')[1];
    const decode = jwt.verify(token,process.env.JWT_SECRET);

    req.user = decode;
    next();
            
    }catch(err){
        return res.status(401).json({
            success:false,
            message:"Invalid or expaire token."
        })
    }
}

module.exports = authonticate;


// use of authontication

route.get("/profile",authonticate,controller.userProfile);
```

### File upload API
```javascript
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"uploads/");
    },
    filename: (req,file,cb)=>{
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        cb(null,uniqueName+path.extname(file.originalname));
    }
})

const fileFilter = (req,file,cb)=>{
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if(!allowedTypes.includes(file.mimetype)){
       return cb(new Error("Only image file are allowed."))
    }

    cb(null,true);
}

const uploads = multer({
    storage,
    fileFilter,
    limits:{
        fileSize:5*1024*1024 // 5 MB
    }
})

module.exports = uploads;


// Use of the uploads

route.post("/api/v1/upload",uploads.single("image"),(req,res)=>{
    if(!req.file){
        return res.status(400).json({
            success:false,
            message:"File is require."
        })
    }

    res.status(201).json({
        stutas:true,
        message:"File uploaded successfully.",
        data:{
            filename:req.file.filename,
            path:req.file.path,
            size:req.file.size
        }
    })
})
```


### Stream a large file
```javascript
const express = require("express");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream/promises");

const app = express();

app.get("/download", async (req, res, next) => {
  try {
    const filePath = path.join(
      __dirname,
      "files",
      "large-video.mp4"
    );

    // Check file and get metadata
    const stat = await fs.promises.stat(filePath);

    if (!stat.isFile()) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.set({
      "Content-Type": "video/mp4",
      "Content-Length": stat.size,
      "Content-Disposition":
        'attachment; filename="large-video.mp4"',
    });

    const fileStream = fs.createReadStream(filePath);

    await pipeline(fileStream, res);

  } catch (error) {
    // Client may have disconnected
    if (
      error.code === "ERR_STREAM_PREMATURE_CLOSE"
    ) {
      console.log("Client disconnected");
      return;
    }

    // File doesn't exist
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    next(error);
  }
});
```

### Read a 5GB file efficiently
```javascript
const fs = require("fs");
const { pipeline } = require("stream/promises");
const { Transform } = require("stream");

const processChunk = new Transform({
  transform(chunk, encoding, callback) {
    // Process chunk without loading entire file into memory
    callback(null, chunk);
  },
});

async function processLargeFile() {
  try {
    await pipeline(
      fs.createReadStream("./large-file.txt"),
      processChunk,
      fs.createWriteStream("./output.txt")
    );

    console.log("File processed successfully");
  } catch (error) {
    console.error("Processing failed:", error);
  }
}

processLargeFile();
```

### CSV parser using streams
```javascript
const fs = require("fs");
const csv = require("csv-parser");
const { Writable } = require("stream");
const { pipeline } = require("stream/promises");

const processRows = new Writable({
  objectMode: true,

  async write(row, encoding, callback) {
    try {
      // Process/save each parsed CSV row
      console.log(row);

      callback();
    } catch (error) {
      callback(error);
    }
  },
});

async function parseCSV() {
  try {
    await pipeline(
      fs.createReadStream("./large-file.csv"),
      csv(),
      processRows
    );

    console.log("CSV processed successfully");
  } catch (error) {
    console.error("CSV processing failed:", error);
  }
}

parseCSV();
```

### Worker Threads example
```javascript
const { Worker } = require("worker_threads");

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", {
      workerData: data,
    });

    worker.once("message", resolve);
    worker.once("error", reject);

    worker.once("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    const result = await runWorker(40);

    console.log("Result:", result);
  } catch (error) {
    console.error(error);
  }
}

main();

// worker.js

const {
  parentPort,
  workerData,
} = require("worker_threads");

function fibonacci(n) {
  if (n <= 1) return n;

  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(workerData);

parentPort.postMessage(result);

```

### Cluster example
```javascript
const cluster = require("cluster");
const os = require("os");
const express = require("express");

if (cluster.isPrimary) {
  const numCPUs = os.availableParallelism();

  console.log(`Primary process: ${process.pid}`);
  console.log(`Starting ${numCPUs} workers`);

  // One worker per available CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart crashed workers
  cluster.on("exit", (worker, code) => {
    console.log(
      `Worker ${worker.process.pid} exited with code ${code}`
    );

    cluster.fork();
  });
} else {
  const app = express();

  app.get("/", (req, res) => {
    res.json({
      message: "Hello",
      worker: process.pid,
    });
  });

  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
```

### Child Process example
```javascript
const { spawn } = require("child_process");

const child = spawn("node", ["script.js"]);

child.stdout.on("data", (data) => {
  console.log(`Output: ${data}`);
});

child.stderr.on("data", (data) => {
  console.error(`Error: ${data}`);
});

child.on("error", (error) => {
  console.error("Failed to start:", error);
});

child.on("close", (code) => {
  console.log(`Child process exited with code ${code}`);
});

// script.js
console.log("Task running in child process...");

setTimeout(() => {
  console.log("Task completed");
}, 2000);
```

### Cache with Redis
```javascript
// redis config
const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.connect();

module.exports = redis;

// service/controller
const redis = require("./redis");
const prisma = require("./prisma");

async function getUser(req, res, next) {
  try {
    const { id } = req.params;

    const cacheKey = `user:${id}`;

    // 1. Check cache
    const cachedUser = await redis.get(cacheKey);

    if (cachedUser) {
      return res.json({
        source: "cache",
        data: JSON.parse(cachedUser),
      });
    }

    // 2. Cache miss → query database
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 3. Cache with TTL
    await redis.set(
      cacheKey,
      JSON.stringify(user),
      { EX: 300 } // 5 minutes
    );

    return res.json({
      source: "database",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

// invailidate cache
await prisma.user.update({
  where: { id },
  data: req.body,
});

await redis.del(`user:${id}`);

```

### API rate limiter
```javascript
const express = require("express");
const { rateLimit } = require("express-rate-limit");

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,               // 100 requests per window

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// Apply only to API routes
app.use("/api/v1", apiLimiter);

app.get("/api/v1/users", (req, res) => {
  res.json({ message: "Users fetched successfully" });
});

app.listen(3000);
```

### Request queue
```javascript
const express = require("express");

const app = express();

class RequestQueue {
  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
    this.active = 0;
    this.queue = [];
  }

  middleware() {
    return (req, res, next) => {
      const execute = () => {
        this.active++;

        let released = false;

        const release = () => {
          if (released) return;

          released = true;
          this.active--;

          const nextRequest = this.queue.shift();

          if (nextRequest) {
            nextRequest();
          }
        };

        res.once("finish", release);
        res.once("close", release);

        next();
      };

      if (this.active < this.maxConcurrent) {
        execute();
      } else {
        this.queue.push(execute);
      }
    };
  }
}

const requestQueue = new RequestQueue(5);

app.use("/api", requestQueue.middleware());

app.get("/api/data", async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 2000));

  res.json({
    message: "Request completed"
  });
});

app.listen(3000);
```

### WebSocket chat server
```javascript
const { WebSocketServer, WebSocket } = require("ws");

const wss = new WebSocketServer({
  port: 8080,
});

wss.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", (data) => {
    const message = data.toString();

    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN
      ) {
        client.send(message);
      }
    });
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("WebSocket server running on port 8080");

// client code
const socket = new WebSocket("ws://localhost:8080");

socket.onopen = () => {
  socket.send("Hello everyone!");
};

socket.onmessage = (event) => {
  console.log("Message:", event.data);
};


```

### URL shortener
```javascript
const express = require("express");

const app = express();
app.use(express.json());

const urls = new Map();

// Create short URL
app.post("/shorten", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      message: "URL is required",
    });
  }

  const { nanoid } = await import("nanoid");

  const shortCode = nanoid(7);

  urls.set(shortCode, url);

  return res.status(201).json({
    shortUrl: `http://localhost:3000/${shortCode}`,
  });
});

// Redirect
app.get("/:shortCode", (req, res) => {
  const { shortCode } = req.params;

  const originalUrl = urls.get(shortCode);

  if (!originalUrl) {
    return res.status(404).json({
      message: "URL not found",
    });
  }

  return res.redirect(originalUrl);
});

app.listen(3000);
```

### Job queue implementation
```javascript
const express = require("express");

const app = express();
app.use(express.json());

const urls = new Map();

// Create short URL
app.post("/shorten", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      message: "URL is required",
    });
  }

  const { nanoid } = await import("nanoid");

  const shortCode = nanoid(7);

  urls.set(shortCode, url);

  return res.status(201).json({
    shortUrl: `http://localhost:3000/${shortCode}`,
  });
});

// Redirect
app.get("/:shortCode", (req, res) => {
  const { shortCode } = req.params;

  const originalUrl = urls.get(shortCode);

  if (!originalUrl) {
    return res.status(404).json({
      message: "URL not found",
    });
  }

  return res.redirect(originalUrl);
});

app.listen(3000);
```

### Pub/Sub example - redis
```javascript
// redis.js
const { createClient } = require("redis");

const publisher = createClient({
  url: process.env.REDIS_URL
});

const subscriber = publisher.duplicate();

publisher.on("error", console.error);
subscriber.on("error", console.error);

async function connectRedis() {
  await Promise.all([
    publisher.connect(),
    subscriber.connect()
  ]);
}

module.exports = {
  publisher,
  subscriber,
  connectRedis
};

//subscriber
const {
  subscriber,
  connectRedis
} = require("./redis");

async function start() {
  await connectRedis();

  await subscriber.subscribe(
    "order.created",
    (message) => {
      const order = JSON.parse(message);

      console.log("New order:", order);

      // Send email
      // Update analytics
      // Notify another service
    }
  );
}

start();

// publisher
const { publisher } = require("./redis");

async function createOrder(order) {
  // Save order to DB first

  await publisher.publish(
    "order.created",
    JSON.stringify(order)
  );

  return order;
}

```
### Pub/Sub example - Redis Streams
```javascript
//Producer
const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL
});

async function publishOrder(order) {
  if (!redis.isOpen) {
    await redis.connect();
  }

  const messageId = await redis.xAdd(
    "orders",
    "*",
    {
      event: "order.created",
      data: JSON.stringify(order)
    }
  );

  console.log("Published:", messageId);
}

publishOrder({
  id: "ORD-101",
  amount: "5000"
});

//Consumer with Consumer Group
const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL
});

const STREAM = "orders";
const GROUP = "order-processors";
const CONSUMER = `worker-${process.pid}`;

async function startConsumer() {
  await redis.connect();

  // Create consumer group
  try {
    await redis.xGroupCreate(
      STREAM,
      GROUP,
      "0",
      { MKSTREAM: true }
    );
  } catch (error) {
    // Group already exists
    if (!error.message.includes("BUSYGROUP")) {
      throw error;
    }
  }

  while (true) {
    const results = await redis.xReadGroup(
      GROUP,
      CONSUMER,
      {
        key: STREAM,
        id: ">"
      },
      {
        COUNT: 10,
        BLOCK: 5000
      }
    );

    if (!results) continue;

    for (const stream of results) {
      for (const message of stream.messages) {
        try {
          const data = JSON.parse(
            message.message.data
          );

          console.log(
            "Processing:",
            message.id,
            data
          );

          // Process order...

          // Acknowledge only after success
          await redis.xAck(
            STREAM,
            GROUP,
            message.id
          );
        } catch (error) {
          console.error(
            "Processing failed:",
            message.id,
            error
          );

          // Don't ACK.
          // Message remains pending for retry/recovery.
        }
      }
    }
  }
}

startConsumer().catch(console.error);
```


### Pub/Sub example - RabbitMQ
```javascript
// publisher.js

const amqp = require("amqplib");

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://localhost";

const EXCHANGE = "order.events";

async function publishOrder(order) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(
    EXCHANGE,
    "fanout",
    {
      durable: true
    }
  );

  channel.publish(
    EXCHANGE,
    "",
    Buffer.from(JSON.stringify(order)),
    {
      persistent: true,
      contentType: "application/json"
    }
  );

  console.log("Published:", order);

  await channel.close();
  await connection.close();
}

publishOrder({
  id: "ORD-101",
  amount: 5000
}).catch(console.error);

// consumer.js

const amqp = require("amqplib");

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://localhost";

const EXCHANGE = "order.events";
const QUEUE = "email-service";

async function consume() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(
    EXCHANGE,
    "fanout",
    {
      durable: true
    }
  );

  await channel.assertQueue(
    QUEUE,
    {
      durable: true
    }
  );

  await channel.bindQueue(
    QUEUE,
    EXCHANGE,
    ""
  );

  // Don't overload this consumer
  channel.prefetch(10);

  channel.consume(
    QUEUE,
    async (message) => {
      if (!message) return;

      try {
        const order = JSON.parse(
          message.content.toString()
        );

        console.log("Processing:", order);

        // Send email...

        channel.ack(message);

      } catch (error) {
        console.error(error);

        channel.nack(
          message,
          false,
          false
        );
      }
    },
    {
      noAck: false
    }
  );
}

consume().catch(console.error);
```

### Pub/Sub example - RabbitMQ retry + Dead Letter Queue (DLQ)
```javascript
const amqp = require("amqplib");

const URL = process.env.RABBITMQ_URL || "amqp://localhost";

const EXCHANGE = "order.exchange";

const MAIN_QUEUE = "order.queue";
const RETRY_QUEUE = "order.retry";
const DLQ = "order.dlq";

const ROUTING_KEY = "order.created";

const MAX_RETRIES = 3;

async function startConsumer() {
  const connection = await amqp.connect(URL);
  const channel = await connection.createChannel();

  // Main exchange
  await channel.assertExchange(EXCHANGE, "direct", {
    durable: true,
  });

  // Main queue
  await channel.assertQueue(MAIN_QUEUE, {
    durable: true,
  });

  await channel.bindQueue(
    MAIN_QUEUE,
    EXCHANGE,
    ROUTING_KEY
  );

  // Retry queue:
  // Wait 5 seconds, then send message back to main exchange
  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,

    arguments: {
      "x-message-ttl": 5000,

      "x-dead-letter-exchange": EXCHANGE,

      "x-dead-letter-routing-key": ROUTING_KEY,
    },
  });

  // Dead Letter Queue
  await channel.assertQueue(DLQ, {
    durable: true,
  });

  channel.prefetch(10);

  channel.consume(
    MAIN_QUEUE,

    async (message) => {
      if (!message) return;

      try {
        const order = JSON.parse(
          message.content.toString()
        );

        console.log("Processing:", order);

        await processOrder(order);

        // Success
        channel.ack(message);

      } catch (error) {

        const retryCount =
          Number(
            message.properties.headers?.[
              "x-retry-count"
            ]
          ) || 0;

        if (retryCount < MAX_RETRIES) {

          console.log(
            `Retry ${retryCount + 1}/${MAX_RETRIES}`
          );

          // Publish into retry queue
          channel.sendToQueue(
            RETRY_QUEUE,
            message.content,
            {
              persistent: true,

              headers: {
                ...message.properties.headers,

                "x-retry-count":
                  retryCount + 1,
              },
            }
          );

        } else {

          console.error(
            "Max retries reached → DLQ"
          );

          channel.sendToQueue(
            DLQ,
            message.content,
            {
              persistent: true,

              headers: {
                ...message.properties.headers,

                failureReason: error.message,
              },
            }
          );
        }

        // ACK original only after republishing
        channel.ack(message);
      }
    },
    {
      noAck: false,
    }
  );
}

async function processOrder(order) {
  // Business logic

  throw new Error("Payment service unavailable");
}

startConsumer().catch(console.error);
```

### Pub/Sub example - Kafka
```javascript
//Producer
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

async function publishOrder(order) {
  await producer.connect();

  await producer.send({
    topic: "order.created",

    messages: [
      {
        key: order.id,

        value: JSON.stringify(order),
      },
    ],
  });

  console.log("Order published:", order);
}

publishOrder({
  id: "ORD-101",
  userId: "USER-10",
  amount: 5000,
}).catch(console.error);

//const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "email-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "email-service-group",
});

async function startConsumer() {
  await consumer.connect();

  await consumer.subscribe({
    topic: "order.created",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({
      topic,
      partition,
      message,
    }) => {
      const order = JSON.parse(
        message.value.toString()
      );

      console.log({
        topic,
        partition,
        offset: message.offset,
        order,
      });

      // Process event
      await sendOrderEmail(order);
    },
  });
}

async function sendOrderEmail(order) {
  console.log(
    `Sending email for ${order.id}`
  );
}

startConsumer().catch(console.error);
```


### Pub/Sub example - SNS
```javascript
//Publisher — SNS
const {
  SNSClient,
  PublishCommand,
} = require("@aws-sdk/client-sns");

const sns = new SNSClient({
  region: process.env.AWS_REGION,
});

async function publishOrder(order) {
  await sns.send(
    new PublishCommand({
      TopicArn: process.env.ORDER_TOPIC_ARN,

      Message: JSON.stringify(order),

      MessageAttributes: {
        eventType: {
          DataType: "String",
          StringValue: "order.created",
        },
      },
    })
  );

  console.log("Order published");
}

publishOrder({
  id: "ORD-101",
  amount: 5000,
});

//Consumer — SQS
const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

const sqs = new SQSClient({
  region: process.env.AWS_REGION,
});

const QUEUE_URL = process.env.QUEUE_URL;

async function consume() {
  while (true) {
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,

        // Long polling
        WaitTimeSeconds: 20,

        MaxNumberOfMessages: 10,
      })
    );

    for (const message of response.Messages || []) {
      try {
        // SNS → SQS wraps the original message
        const snsMessage = JSON.parse(message.Body);
        const order = JSON.parse(snsMessage.Message);

        console.log("Processing:", order);

        await processOrder(order);

        // Delete only after successful processing
        await sqs.send(
          new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          })
        );
      } catch (error) {
        console.error("Processing failed:", error);

        // Don't delete.
        // Message becomes visible again after
        // the visibility timeout.
      }
    }
  }
}

async function processOrder(order) {
  console.log(`Processing ${order.id}`);
}

consume().catch(console.error);
```


### API pagination
```javascript
app.get("/api/users", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" }, // stable ordering
        ],
      }),

      prisma.user.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});
```

### Cursor pagination
```javascript
app.get("/api/users", async (req, res, next) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 10, 1),
      100
    );

    const cursor = req.query.cursor;

    const users = await prisma.user.findMany({
      take: limit + 1,

      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),

      orderBy: {
        id: "asc",
      },
    });

    const hasNextPage = users.length > limit;

    if (hasNextPage) {
      users.pop();
    }

    const nextCursor =
      hasNextPage && users.length
        ? users[users.length - 1].id
        : null;

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        limit,
        hasNextPage,
        nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
});
```

### Graceful shutdown
```javascript
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Server running" });
});

const server = app.listen(3000, () => {
  console.log("Server running on port 3000");
});

async function gracefulShutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  // Stop accepting new connections
  server.close(async (error) => {
    if (error) {
      console.error("Server close error:", error);
      process.exit(1);
    }

    try {
      // Close external connections
      await prisma.$disconnect();
      await redis.quit();

      console.log("Shutdown completed");

      process.exit(0);
    } catch (error) {
      console.error("Shutdown error:", error);
      process.exit(1);
    }
  });

  // Force shutdown if requests don't finish
  setTimeout(() => {
    console.error("Forced shutdown");

    process.exit(1);
  }, 10_000).unref();
}

process.once("SIGTERM", () =>
  gracefulShutdown("SIGTERM")
);

process.once("SIGINT", () =>
  gracefulShutdown("SIGINT")
);
```


### Advanced Promise and async patterns
```javascript
```

### Linked List and Binary Tree problems
```javascript
```

### Graph algorithms
```javascript
```

### Sliding Window techniques
```javascript
```

### Heap/Priority Queue problems
```javascript
```

### LRU Cache and Rate Limiter
```javascript
```

### Event Loop output questions
```javascript
```

### Node.js system-design coding tasks
```javascript
```

### EventEmitter and stream implementations
```javascript
```
