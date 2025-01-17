# Node js Practice Notes

# Table of Contents
- [1. What is a Stream in Node.js?](#1-what-is-a-stream-in-nodejs)
- [2. What Are CommonJS and ES Modules?](#2-what-are-commonjs-and-es-modules)
- [3. Best Practices for Building Efficient RESTful APIs?](#3-best-practices-for-building-efficient-restful-apis)
- [4. Implementing Secure Authentication and Authorization with JWT?](#4-implementing-secure-authentication-and-authorization-with-jwt)
- [5. Applying Rate Limiting and Throttling to APIs in Node.js?](#5-applying-rate-limiting-and-throttling-to-apis-in-nodejs)
- [6. Nodejs Error hendeling?](#6-nodejs-error-hendeling)

### 1. What is a Stream in Node.js?

A **stream** in Node.js is a way to handle reading or writing data continuously, piece by piece, without loading the entire data into memory. Streams are especially useful for working with large files or real-time data because they process data efficiently, reducing memory usage and improving performance.

Streams in Node.js are implemented using the **EventEmitter** module, which emits events during their lifecycle.

### Types of Streams in Node.js

There are four types of streams in Node.js:

1. **Readable Streams**: Used for reading data.
   - Example: `fs.createReadStream()` for reading files.
   
2. **Writable Streams**: Used for writing data.
   - Example: `fs.createWriteStream()` for writing files.
   
3. **Duplex Streams**: Both readable and writable.
   - Example: `net.Socket` for network communications.
   
4. **Transform Streams**: Modify or transform data as it is written and read.
   - Example: `zlib.createGzip()` for compressing data.

### How to Work with Streams

Streams work in two modes:
1. **Flowing Mode**: Data is read automatically and provided through events.
2. **Paused Mode**: You explicitly call methods like `read()` to get data.

#### 1. **Readable Stream Example**
Reading a file using `fs.createReadStream`:

```javascript
const fs = require('fs');

// Create a readable stream
const readableStream = fs.createReadStream('example.txt', { encoding: 'utf8' });

// Handle data events
readableStream.on('data', (chunk) => {
  console.log('Received chunk:', chunk);
});

// Handle end of stream
readableStream.on('end', () => {
  console.log('No more data to read.');
});
```

#### 2. **Writable Stream Example**
Writing data using `fs.createWriteStream`:

```javascript
const fs = require('fs');

// Create a writable stream
const writableStream = fs.createWriteStream('output.txt');

// Write data to the stream
writableStream.write('Hello, this is a stream example!\n');
writableStream.end('Stream finished.');

// Handle the finish event
writableStream.on('finish', () => {
  console.log('All data written to file.');
});
```

#### 3. **Piping Streams**
You can directly connect a readable stream to a writable stream using the `pipe()` method.

```javascript
const fs = require('fs');

// Create a readable and writable stream
const readableStream = fs.createReadStream('example.txt');
const writableStream = fs.createWriteStream('output.txt');

// Pipe the readable stream to the writable stream
readableStream.pipe(writableStream);

console.log('Data piped from example.txt to output.txt');
```

#### 4. **Transform Stream Example**
Using a transform stream to compress a file:

```javascript
const fs = require('fs');
const zlib = require('zlib');

// Create a gzip transform stream
const gzip = zlib.createGzip();

// Create readable and writable streams
const readableStream = fs.createReadStream('example.txt');
const writableStream = fs.createWriteStream('example.txt.gz');

// Pipe data through the transform stream
readableStream.pipe(gzip).pipe(writableStream);

console.log('File compressed successfully.');
```

### Key Methods and Events

- **Readable Stream Events**:
  - `data`: Emitted when a chunk of data is available.
  - `end`: Emitted when no more data is available.
  - `error`: Emitted on errors.

- **Writable Stream Methods**:
  - `write(chunk)`: Writes data to the stream.
  - `end()`: Signals the end of writing.

- **Stream Methods**:
  - `pipe(destination)`: Pipes data from one stream to another.

### Use Cases of Streams

- Reading and writing large files (e.g., logs, videos).
- Real-time data processing (e.g., video streaming).
- Network communication.
- File compression/decompression.

Streams are a powerful feature of Node.js, enabling efficient data handling, especially for large-scale applications.

Understanding CommonJS (CJS) and ES Modules (ESM) deeply involves knowing their syntax, features, differences, and practical use cases. Here's a comprehensive guide:


## 2. What Are CommonJS and ES Modules?

- **CommonJS (CJS):** A module system primarily used in Node.js. It allows you to export and import functionalities from other files.
  
- **ES Modules (ESM):** A modern, standardized JavaScript module system introduced in ES6 (2015). It is now natively supported in browsers and Node.js.


### 2. **Syntax Differences**

#### **CommonJS (CJS) Syntax**

- Exporting:  
  Use `module.exports` or `exports`.

  ```javascript
  // file1.js
  module.exports = function greet(name) {
    return `Hello, ${name}!`;
  };

  // or
  exports.greet = function(name) {
    return `Hello, ${name}!`;
  };
  ```

- Importing:  
  Use `require`.

  ```javascript
  // file2.js
  const greet = require('./file1');
  console.log(greet('Vikrant'));
  ```

#### **ES Modules (ESM) Syntax**

- Exporting:  
  Use `export` or `export default`.

  ```javascript
  // file1.js
  export function greet(name) {
    return `Hello, ${name}!`;
  }

  // or
  export default function greet(name) {
    return `Hello, ${name}!`;
  }
  ```

- Importing:  
  Use `import`.

  ```javascript
  // file2.js
  import { greet } from './file1.js';
  console.log(greet('Vikrant'));

  // or for default export
  import greet from './file1.js';
  console.log(greet('Vikrant'));
  ```

#### 3. **Key Differences**

| Feature                      | CommonJS (CJS)                              | ES Modules (ESM)                      |
|------------------------------|---------------------------------------------|----------------------------------------|
| **Export Syntax**            | `module.exports` / `exports`               | `export` / `export default`           |
| **Import Syntax**            | `require()`                                | `import`                              |
| **Default Export**           | Any value                                  | Explicit with `export default`        |
| **Synchronous/Asynchronous** | Synchronous (blocking)                     | Asynchronous (non-blocking)           |
| **File Extension**           | `.js`                                      | `.js` (or `.mjs` in Node.js)          |
| **Support in Browsers**      | Not natively supported                     | Natively supported                    |
| **Support in Node.js**       | Default                                    | Requires `"type": "module"` in `package.json` or `.mjs` |


### 4. **Deep Dive: CommonJS**

#### Features:
- **Synchronous Loading:** Modules are loaded and executed synchronously.
- **Dynamic `require`:** You can conditionally or programmatically load modules.

  ```javascript
  if (someCondition) {
    const module = require('./moduleA');
    module.doSomething();
  }
  ```

#### Limitations:
- Not natively supported in browsers (requires bundlers like Webpack or tools like Browserify).
- Synchronous loading can impact performance in large-scale applications.

### 5. **Deep Dive: ES Modules**

#### Features:
- **Static Structure:** ES modules are statically analyzed, enabling tree-shaking and optimizations.
- **Asynchronous Loading:** Ideal for web development, where non-blocking operations are crucial.
- **Strict Mode:** ES modules are always in strict mode.

#### Limitations:
- Requires compatibility configurations for older browsers or Node.js versions.
- Cannot use `require` dynamically (must use `import()`).


### 6. **Practical Usage**

#### **When to Use CommonJS**
- Legacy projects or environments that only support CJS (e.g., Node.js versions before 12.x).
- Dynamic module loading or conditions based on runtime logic.

#### **When to Use ES Modules**
- Modern web applications.
- Projects where performance (tree-shaking, asynchronous loading) is crucial.
- Codebases targeting both Node.js and browser environments.

### 7. **Transitioning from CJS to ESM**

- Update `package.json`:
  ```json
  {
    "type": "module"
  }
  ```

- Convert `require` to `import` and `module.exports` to `export`.


### 8. **Mixed Usage in Node.js**

In some cases, you might work with both CJS and ESM:

- Importing ESM in CJS:
  ```javascript
  async function loadModule() {
    const { greet } = await import('./module.mjs');
    console.log(greet('Vikrant'));
  }
  loadModule();
  ```

- Importing CJS in ESM:
  ```javascript
  import greet from './module.cjs';
  console.log(greet('Vikrant'));
  ```

By mastering these concepts, you’ll be able to choose the right module system based on your project’s needs and ensure smooth integration with tools and libraries.


## 3. Best Practices for Building Efficient RESTful APIs?

RESTful APIs are a cornerstone of modern web development, and following best practices ensures they are efficient, scalable, and maintainable. Here's a comprehensive guide:

### 1. **Design a Clear and Consistent API Structure**

#### **Resource-Based URLs**
- Use nouns for resources, not verbs.
- URLs should be hierarchical and reflect resource relationships.

**Example:**
```bash
GET /users          # Retrieve all users
GET /users/1        # Retrieve a specific user
POST /users         # Create a new user
PUT /users/1        # Update a user
DELETE /users/1     # Delete a user
```

#### **Use Proper HTTP Methods**
| Method  | Purpose                    |
|---------|----------------------------|
| `GET`   | Retrieve data              |
| `POST`  | Create new resources       |
| `PUT`   | Update or replace resources|
| `PATCH` | Partially update resources |
| `DELETE`| Remove resources           |


### 2. **Handle Errors Gracefully**

#### **Standardized HTTP Status Codes**
Use appropriate status codes to indicate the outcome of a request:

| Status Code | Meaning                        |
|-------------|--------------------------------|
| `200 OK`    | Success                        |
| `201 Created`| Resource created successfully |
| `400 Bad Request`| Invalid client input       |
| `401 Unauthorized`| Authentication required  |
| `404 Not Found`| Resource not found          |
| `500 Internal Server Error`| Server error   |

#### **Error Responses**
Return detailed but user-friendly error messages in JSON format.

**Example:**
```json
{
  "error": {
    "message": "User not found",
    "code": 404
  }
}
```


### 3. **Use Query Parameters for Filtering, Sorting, and Pagination**

- **Filtering:**  
  ```bash
  GET /users?age=25&status=active
  ```

- **Sorting:**  
  ```bash
  GET /users?sort=createdAt&order=desc
  ```

- **Pagination:**  
  ```bash
  GET /users?page=2&limit=10
  ```

Return metadata for pagination:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 2,
    "limit": 10
  }
}
```


### 4. **Implement Authentication and Authorization**

- Use **JWT (JSON Web Tokens)** for stateless authentication.
- Secure sensitive endpoints with role-based access control.

**Example:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```


### 5. **Optimize Performance**

#### **Enable Caching**
- Use HTTP caching headers like `ETag` and `Cache-Control`.

**Example:**
```bash
Cache-Control: public, max-age=3600
```

#### **Batch Requests**
Allow clients to send multiple requests in one batch to reduce overhead.

#### **Use Compression**
Enable GZIP or Brotli compression to reduce payload size.


### 6. **Ensure Data Validation and Sanitization**

- Use validation libraries like `Joi` or `Yup` to validate request payloads.
- Sanitize inputs to prevent SQL injection or XSS attacks.


### 7. **Version Your API**

Include the version in the URL to prevent breaking changes for clients when updates are made.

**Example:**
```bash
GET /v1/users
GET /v2/users
```


### 8. **Secure the API**

- Use HTTPS to encrypt data in transit.
- Implement rate limiting to prevent abuse (e.g., `express-rate-limit`).
- Avoid exposing sensitive data in URLs or responses.


### 9. **Enable HATEOAS (Hypermedia as the Engine of Application State)**

Provide links to related resources in the response for easier navigation.

**Example:**
```json
{
  "id": 1,
  "name": "John Doe",
  "links": {
    "self": "/users/1",
    "posts": "/users/1/posts"
  }
}
```

### 10. **Use Tools for Monitoring and Testing**

- Use **Postman** or **Insomnia** for manual testing.
- Implement automated tests with frameworks like **Jest** or **Mocha**.
- Monitor API performance and errors using tools like **New Relic**, **Datadog**, or **ELK Stack**.


#### Sample Node.js Express Implementation

```javascript
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Middleware
app.use(bodyParser.json());

// Routes
app.get('/users', (req, res) => {
  res.json({ message: 'Get all users' });
});

app.post('/users', (req, res) => {
  res.status(201).json({ message: 'User created' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

#### Conclusion

By following these best practices, you can build efficient, secure, and maintainable RESTful APIs that provide a great developer and user experience.


## 4. Implementing Secure Authentication and Authorization with JWT?

Here’s a step-by-step guide to implementing secure authentication and authorization using **JSON Web Tokens (JWT)** in a Node.js application with **Express**:


### 1. **Understanding JWT**
- **JWT (JSON Web Token)** is a compact, self-contained token used to securely transmit information between parties.
- A JWT consists of three parts:
  - **Header**: Specifies the algorithm and token type.
  - **Payload**: Contains claims (e.g., user ID, roles).
  - **Signature**: Ensures the token’s integrity.

**Example JWT:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjE4OTQ1NjAwfQ.K0nUV1CFIp3j2GZqRh1Ro0tDqkPGw7Xppn03uD1-qkA
```

### 2. **Setup a Basic Express App**

Install necessary dependencies:
```bash
npm install express jsonwebtoken bcryptjs dotenv body-parser
```

### 3. **Environment Configuration**
Create a `.env` file to store sensitive information:
```
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
```

### 4. **User Authentication (Login)**

#### **Hash Passwords**
Use `bcryptjs` to hash passwords for secure storage.

**Example:**
```javascript
const bcrypt = require('bcryptjs');

// Hash a password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
```

#### **Generate JWT**

**Example:**
```javascript
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};
```

#### **Login Route**
```javascript
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

app.use(express.json());

// Mock database
const users = [
  { id: 1, username: 'user1', password: '$2a$10$...', role: 'user' }, // hashed password
];

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);
  res.json({ token });
});
```


### 5. **Protect Routes (Middleware for Authentication)**

Create middleware to verify JWT:
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};
```


### 6. **Authorization (Role-Based Access Control)**

Create middleware to check roles:
```javascript
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Access is denied' });
    }
    next();
  };
};
```


### 7. **Protected Routes Example**

**Example:**
```javascript
app.get('/admin', authenticateToken, authorize(['admin']), (req, res) => {
  res.send('Welcome, Admin!');
});

app.get('/user', authenticateToken, authorize(['user', 'admin']), (req, res) => {
  res.send('Welcome, User!');
});
```

### 8. **Logout (Token Invalidation)**

To "log out" a user:
- Implement a token blacklist or store invalidated tokens in a database with an expiration time.


### 9. **Security Best Practices**

- **Use HTTPS**: Always secure API endpoints.
- **Set Expiration**: Limit token validity using the `expiresIn` option.
- **Secure Secrets**: Store secrets in environment variables.
- **Limit Token Scope**: Avoid overloading the JWT payload with sensitive data.
- **Rate Limiting**: Prevent brute-force attacks on authentication endpoints.
- **Refresh Tokens**: Use refresh tokens for long-lived sessions.

#### Full Example Code

```javascript
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

// Mock users
const users = [
  { id: 1, username: 'admin', password: '$2a$10$...', role: 'admin' }, // hashed password
  { id: 2, username: 'user', password: '$2a$10$...', role: 'user' },
];

// Generate token
const generateToken = (user) => {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Authorization middleware
const authorize = (roles = []) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);
  res.json({ token });
});

// Protected routes
app.get('/admin', authenticateToken, authorize(['admin']), (req, res) => {
  res.send('Welcome, Admin!');
});

app.get('/user', authenticateToken, authorize(['user', 'admin']), (req, res) => {
  res.send('Welcome, User!');
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
```

By following these steps, you can implement secure authentication and role-based authorization for your RESTful APIs.


## 5. Applying Rate Limiting and Throttling to APIs in Node.js?

Rate limiting and throttling are essential for securing APIs against abuse, preventing denial-of-service (DoS) attacks, and ensuring fair usage. Here's a step-by-step guide to implementing these techniques in a Node.js application using **Express**.


### 1. **Install Necessary Packages**

Use the `express-rate-limit` package to implement rate limiting.

```bash
npm install express-rate-limit
```

### 2. **Set Up Basic Rate Limiting**

The `express-rate-limit` package allows you to define the maximum number of requests a client can make within a specific time window.

**Example Implementation:**

```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `windowMs`
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
});

app.use(limiter);

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### 3. **Apply Rate Limiting to Specific Routes**

Instead of applying the rate limiter globally, you can apply it to specific routes.

**Example:**
```javascript
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 login attempts per `windowMs`
  message: {
    error: 'Too many login attempts, please try again later.',
  },
});

app.post('/login', authLimiter, (req, res) => {
  res.send('Login route');
});
```

### 4. **Advanced Rate Limiting with Custom Key Generator**

You can customize the key used to track requests, for example, by using the user ID instead of the IP address.

**Example:**
```javascript
const customLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Limit each user to 50 requests per window
  keyGenerator: (req) => req.user?.id || req.ip, // Use user ID or fallback to IP
  message: {
    error: 'Rate limit exceeded for this user.',
  },
});

app.use('/api', customLimiter);
```

### 5. **Throttling Using Middleware**

Throttle requests to allow delayed processing under high load. You can use the `express-slow-down` package.

**Install the package:**
```bash
npm install express-slow-down
```

**Example Implementation:**
```javascript
const slowDown = require('express-slow-down');

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after the limit is reached
});

app.use('/api', speedLimiter);
```

### 6. **Combining Rate Limiting and Throttling**

To enhance security, combine both rate limiting and throttling on critical endpoints like login or sensitive data access.

**Example:**
```javascript
app.post('/login', authLimiter, speedLimiter, (req, res) => {
  res.send('Login with rate limiting and throttling applied.');
});
```

### 7. **Real-Time Monitoring with Headers**

Enable headers to inform clients of their remaining limits:
- `RateLimit-Limit`: Maximum number of requests allowed.
- `RateLimit-Remaining`: Number of requests remaining in the current window.
- `RateLimit-Reset`: Time when the limit resets.

Ensure `standardHeaders` is set to `true` in the rate limiter configuration.

### 8. **Best Practices**

1. **Different Limits for Different Users**: 
   - Allow higher limits for premium or admin users.
   
2. **IP Whitelisting**:
   - Exclude trusted IPs (e.g., internal services) from rate limiting:
   ```javascript
   const limiter = rateLimit({
     skip: (req) => req.ip === '123.45.67.89', // Whitelist specific IP
   });
   ```

3. **Log Excessive Requests**:
   - Use logging tools like **Winston** or **Morgan** to track clients exceeding limits.

4. **Global vs. Route-Specific Limiting**:
   - Use a global rate limiter for general API usage.
   - Apply stricter limits on sensitive routes like `/login` or `/password-reset`.


#### Full Example Code

Here’s a complete example combining everything:

```javascript
require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const app = express();
app.use(express.json());

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests, please try again later.',
  },
});
app.use(globalLimiter);

// Login rate limiter
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many login attempts, please try again later.',
  },
});

// Throttle middleware
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 500,
});

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

app.post('/login', authLimiter, speedLimiter, (req, res) => {
  res.send('Login endpoint');
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
```

This implementation ensures your API is protected against abuse while maintaining good performance and user experience.

## 6. Nodejs Error hendeling?
Error handling is a crucial aspect of building a robust REST API in Node.js. Below are various types of error handling techniques you can implement in a Node.js REST API:

#### 1. **Basic Error Handling**

You can use try-catch blocks to handle synchronous errors in your route handlers.

```javascript
app.get('/api/resource', (req, res) => {
    try {
        // Your logic here
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});
```

#### 2. **Asynchronous Error Handling**

For asynchronous code (like database calls), you can use try-catch within an async function.

```javascript
app.get('/api/resource', async (req, res) => {
    try {
        const data = await getDataFromDatabase();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});
```

#### 3. **Using Middleware for Error Handling**

You can create a centralized error-handling middleware to catch errors from all routes.

```javascript
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
    });
});

// Example route
app.get('/api/resource', async (req, res, next) => {
    try {
        const data = await getDataFromDatabase();
        res.json(data);
    } catch (error) {
        next(error); // Pass the error to the error handler
    }
});
```

#### 4. **Validation Errors**

You can handle validation errors using libraries like `Joi` or `express-validator`.

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/resource', [
    body('name').isString().notEmpty(),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Proceed with creating the resource
});
```

#### 5. **Handling 404 Errors**

You can handle 404 errors by adding a middleware at the end of your route definitions.

```javascript
app.use((req, res) => {
    res.status(404).json({ message: 'Resource not found' });
});
```

#### 6. **Custom Error Classes**

You can create custom error classes to handle different types of errors more effectively.

```javascript
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Usage
app.get('/api/resource', async (req, res, next) => {
    try {
        const data = await getDataFromDatabase();
        if (!data) {
            throw new AppError('Resource not found', 404);
        }
        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error',
    });
});
```

#### 7. **Logging Errors**

Consider using a logging library like `winston` or `morgan` to log errors for debugging purposes.

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log' }),
    ],
});

// In your error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error',
    });
});
```

#### 8. Catching Unhandled Rejections and Exceptions
You can also catch unhandled promise rejections and uncaught exceptions globally using the process object.
```javascript
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally, you can exit the process or log the error to a monitoring service
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown:', error);
    // Optionally, you can exit the process or log the error to a monitoring service
});
```

### Conclusion

By implementing these error handling techniques, you can create a more resilient and user-friendly REST API in Node.js. Make sure to tailor the error responses to your application's needs and provide meaningful messages to the clients.


