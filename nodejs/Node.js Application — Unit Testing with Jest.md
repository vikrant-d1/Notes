# Node.js Application — Unit Testing with Jest

A practical Node.js application demonstrating how to build and unit test a REST API using:

- Node.js
- Express.js
- JavaScript
- Jest
- Supertest
- Zod
- In-memory/mock repository
- Service + Controller architecture

---

## 1. Project Structure

```text
nodejs-unit-testing/
│
├── src/
│   ├── controllers/
│   │   └── user.controller.js
│   │
│   ├── services/
│   │   └── user.service.js
│   │
│   ├── repositories/
│   │   └── user.repository.js
│   │
│   ├── validators/
│   │   └── user.validator.js
│   │
│   ├── middleware/
│   │   └── error.middleware.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── unit/
│   │   ├── user.service.test.js
│   │   ├── user.controller.test.js
│   │   └── user.validator.test.js
│   │
│   └── integration/
│       └── user.api.test.js
│
├── package.json
├── jest.config.js
└── README.md
```

---

# 2. Initialize Project

```bash
mkdir nodejs-unit-testing

cd nodejs-unit-testing

npm init -y
```

Install dependencies:

```bash
npm install express zod
```

Install development dependencies:

```bash
npm install --save-dev jest supertest
```

---

# 3. package.json

```json
{
  "name": "nodejs-unit-testing",
  "version": "1.0.0",
  "description": "Node.js application with Jest unit tests",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "express": "^5.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "jest": "^30.0.0",
    "supertest": "^7.0.0"
  }
}
```

---

# 4. Jest Configuration

Create:

```text
jest.config.js
```

```javascript
module.exports = {
  testEnvironment: "node",

  roots: ["<rootDir>/tests"],

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js"
  ],

  coverageDirectory: "coverage",

  verbose: true
};
```

---

# 5. Repository

The repository is responsible for data access.

Create:

```text
src/repositories/user.repository.js
```

```javascript
let users = [
  {
    id: 1,
    name: "John",
    email: "john@example.com"
  },
  {
    id: 2,
    name: "Jane",
    email: "jane@example.com"
  }
];

class UserRepository {

  async findAll() {
    return users;
  }

  async findById(id) {
    return users.find(user => user.id === id);
  }

  async findByEmail(email) {
    return users.find(user => user.email === email);
  }

  async create(user) {
    const newUser = {
      id: users.length + 1,
      ...user
    };

    users.push(newUser);

    return newUser;
  }

  async delete(id) {
    const index = users.findIndex(user => user.id === id);

    if (index === -1) {
      return false;
    }

    users.splice(index, 1);

    return true;
  }
}

module.exports = new UserRepository();
```

---

# 6. Validation

Create:

```text
src/validators/user.validator.js
```

```javascript
const { z } = require("zod");

const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must contain at least 2 characters"),

  email: z
    .string()
    .email("Invalid email address")
});

function validateCreateUser(data) {
  return createUserSchema.safeParse(data);
}

module.exports = {
  validateCreateUser
};
```

---

# 7. Service Layer

The service contains business logic.

Create:

```text
src/services/user.service.js
```

```javascript
const userRepository = require("../repositories/user.repository");

class UserService {

  async getUsers() {
    return userRepository.findAll();
  }

  async getUserById(id) {

    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async createUser(data) {

    const existingUser =
      await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    return userRepository.create(data);
  }

  async deleteUser(id) {

    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    await userRepository.delete(id);

    return true;
  }
}

module.exports = new UserService();
```

---

# 8. Controller

Create:

```text
src/controllers/user.controller.js
```

```javascript
const userService = require("../services/user.service");
const {
  validateCreateUser
} = require("../validators/user.validator");

class UserController {

  async getUsers(req, res, next) {

    try {

      const users = await userService.getUsers();

      res.status(200).json({
        success: true,
        data: users
      });

    } catch (error) {

      next(error);

    }
  }

  async getUserById(req, res, next) {

    try {

      const id = Number(req.params.id);

      const user =
        await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user
      });

    } catch (error) {

      next(error);

    }
  }

  async createUser(req, res, next) {

    try {

      const validation =
        validateCreateUser(req.body);

      if (!validation.success) {

        return res.status(400).json({
          success: false,
          errors: validation.error.issues
        });

      }

      const user =
        await userService.createUser(validation.data);

      res.status(201).json({
        success: true,
        data: user
      });

    } catch (error) {

      next(error);

    }
  }

  async deleteUser(req, res, next) {

    try {

      const id = Number(req.params.id);

      await userService.deleteUser(id);

      res.status(204).send();

    } catch (error) {

      next(error);

    }
  }
}

module.exports = new UserController();
```

---

# 9. Express Application

Create:

```text
src/app.js
```

```javascript
const express = require("express");

const userController =
  require("./controllers/user.controller");

const errorMiddleware =
  require("./middleware/error.middleware");

const app = express();

app.use(express.json());

app.get(
  "/users",
  userController.getUsers
);

app.get(
  "/users/:id",
  userController.getUserById
);

app.post(
  "/users",
  userController.createUser
);

app.delete(
  "/users/:id",
  userController.deleteUser
);

app.use(errorMiddleware);

module.exports = app;
```

---

# 10. Error Middleware

Create:

```text
src/middleware/error.middleware.js
```

```javascript
function errorMiddleware(
  error,
  req,
  res,
  next
) {

  console.error(error);

  let statusCode = 500;

  if (error.message === "User not found") {
    statusCode = 404;
  }

  if (error.message === "Email already exists") {
    statusCode = 409;
  }

  res.status(statusCode).json({
    success: false,
    message: error.message
  });
}

module.exports = errorMiddleware;
```

---

# 11. Server

Create:

```text
src/server.js
```

```javascript
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
```

---

# 12. Unit Testing

Unit testing means testing one component in isolation.

For example:

```text
UserService
```

should be tested without actually using a database.

We can mock the repository.

---

# 13. Service Unit Tests

Create:

```text
tests/unit/user.service.test.js
```

```javascript
const userService =
  require("../../src/services/user.service");

const userRepository =
  require("../../src/repositories/user.repository");

jest.mock(
  "../../src/repositories/user.repository"
);

describe("UserService", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {

    it("should return all users", async () => {

      const users = [
        {
          id: 1,
          name: "John",
          email: "john@example.com"
        }
      ];

      userRepository.findAll
        .mockResolvedValue(users);

      const result =
        await userService.getUsers();

      expect(result).toEqual(users);

      expect(
        userRepository.findAll
      ).toHaveBeenCalledTimes(1);
    });

  });

  describe("getUserById", () => {

    it("should return user when user exists", async () => {

      const user = {
        id: 1,
        name: "John",
        email: "john@example.com"
      };

      userRepository.findById
        .mockResolvedValue(user);

      const result =
        await userService.getUserById(1);

      expect(result).toEqual(user);

      expect(
        userRepository.findById
      ).toHaveBeenCalledWith(1);
    });

    it("should throw error when user does not exist", async () => {

      userRepository.findById
        .mockResolvedValue(null);

      await expect(
        userService.getUserById(100)
      ).rejects.toThrow(
        "User not found"
      );

    });

  });

  describe("createUser", () => {

    it("should create a new user", async () => {

      const input = {
        name: "Alice",
        email: "alice@example.com"
      };

      const createdUser = {
        id: 3,
        ...input
      };

      userRepository.findByEmail
        .mockResolvedValue(null);

      userRepository.create
        .mockResolvedValue(createdUser);

      const result =
        await userService.createUser(input);

      expect(result)
        .toEqual(createdUser);

      expect(
        userRepository.create
      ).toHaveBeenCalledWith(input);
    });

    it("should throw error when email already exists", async () => {

      userRepository.findByEmail
        .mockResolvedValue({
          id: 1,
          email: "john@example.com"
        });

      await expect(
        userService.createUser({
          name: "John",
          email: "john@example.com"
        })
      ).rejects.toThrow(
        "Email already exists"
      );

      expect(
        userRepository.create
      ).not.toHaveBeenCalled();
    });

  });

  describe("deleteUser", () => {

    it("should delete an existing user", async () => {

      userRepository.findById
        .mockResolvedValue({
          id: 1,
          name: "John"
        });

      userRepository.delete
        .mockResolvedValue(true);

      const result =
        await userService.deleteUser(1);

      expect(result).toBe(true);

      expect(
        userRepository.delete
      ).toHaveBeenCalledWith(1);
    });

    it("should throw error if user does not exist", async () => {

      userRepository.findById
        .mockResolvedValue(null);

      await expect(
        userService.deleteUser(100)
      ).rejects.toThrow(
        "User not found"
      );

    });

  });

});
```

---

# 14. Validator Unit Tests

Create:

```text
tests/unit/user.validator.test.js
```

```javascript
const {
  validateCreateUser
} = require(
  "../../src/validators/user.validator"
);

describe("User Validator", () => {

  it("should validate correct user data", () => {

    const result =
      validateCreateUser({
        name: "John",
        email: "john@example.com"
      });

    expect(result.success).toBe(true);

  });

  it("should reject invalid email", () => {

    const result =
      validateCreateUser({
        name: "John",
        email: "invalid-email"
      });

    expect(result.success).toBe(false);

  });

  it("should reject short name", () => {

    const result =
      validateCreateUser({
        name: "J",
        email: "john@example.com"
      });

    expect(result.success).toBe(false);

  });

  it("should reject missing name", () => {

    const result =
      validateCreateUser({
        email: "john@example.com"
      });

    expect(result.success).toBe(false);

  });

});
```

---

# 15. Controller Unit Tests

Controller tests should mock the service.

Create:

```text
tests/unit/user.controller.test.js
```

```javascript
const userController =
  require("../../src/controllers/user.controller");

const userService =
  require("../../src/services/user.service");

jest.mock(
  "../../src/services/user.service"
);

describe("UserController", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {

    it("should return users", async () => {

      const users = [
        {
          id: 1,
          name: "John",
          email: "john@example.com"
        }
      ];

      userService.getUsers
        .mockResolvedValue(users);

      const req = {};

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      await userController.getUsers(
        req,
        res,
        next
      );

      expect(
        res.status
      ).toHaveBeenCalledWith(200);

      expect(
        res.json
      ).toHaveBeenCalledWith({
        success: true,
        data: users
      });

      expect(next)
        .not.toHaveBeenCalled();

    });

    it("should call next when service fails", async () => {

      const error =
        new Error("Database error");

      userService.getUsers
        .mockRejectedValue(error);

      const req = {};

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      await userController.getUsers(
        req,
        res,
        next
      );

      expect(next)
        .toHaveBeenCalledWith(error);

    });

  });

});
```

---

# 16. Integration / API Tests

Unit tests test individual components.

Integration tests test multiple components together.

For example:

```text
HTTP Request
     ↓
Express
     ↓
Controller
     ↓
Service
     ↓
Repository
```

We can use `supertest`.

Create:

```text
tests/integration/user.api.test.js
```

```javascript
const request =
  require("supertest");

const app =
  require("../../src/app");

describe("User API", () => {

  describe("GET /users", () => {

    it("should return users", async () => {

      const response =
        await request(app)
          .get("/users");

      expect(response.status)
        .toBe(200);

      expect(response.body.success)
        .toBe(true);

      expect(
        Array.isArray(response.body.data)
      ).toBe(true);

    });

  });

  describe("GET /users/:id", () => {

    it("should return user", async () => {

      const response =
        await request(app)
          .get("/users/1");

      expect(response.status)
        .toBe(200);

      expect(response.body.success)
        .toBe(true);

      expect(response.body.data.id)
        .toBe(1);

    });

    it("should return 404 for missing user", async () => {

      const response =
        await request(app)
          .get("/users/999");

      expect(response.status)
        .toBe(404);

      expect(response.body.success)
        .toBe(false);

      expect(response.body.message)
        .toBe("User not found");

    });

  });

  describe("POST /users", () => {

    it("should create user", async () => {

      const response =
        await request(app)
          .post("/users")
          .send({
            name: "Alice",
            email: "alice@example.com"
          });

      expect(response.status)
        .toBe(201);

      expect(response.body.success)
        .toBe(true);

      expect(response.body.data.name)
        .toBe("Alice");

    });

    it("should reject invalid email", async () => {

      const response =
        await request(app)
          .post("/users")
          .send({
            name: "Alice",
            email: "invalid"
          });

      expect(response.status)
        .toBe(400);

      expect(response.body.success)
        .toBe(false);

    });

  });

});
```

---

# 17. Run Tests

Run all tests:

```bash
npm test
```

Example:

```text
PASS tests/unit/user.service.test.js
PASS tests/unit/user.validator.test.js
PASS tests/unit/user.controller.test.js
PASS tests/integration/user.api.test.js

Test Suites: 4 passed, 4 total
Tests:       12 passed, 12 total
```

---

# 18. Watch Mode

During development:

```bash
npm run test:watch
```

Jest automatically reruns tests when files change.

---

# 19. Test Coverage

Run:

```bash
npm run test:coverage
```

Example output:

```text
----------------------|---------|----------|---------|---------
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|---------
All files             |   95.23 |    88.88 |   94.44 |   95.23
controllers           |   92.30 |    80.00 |     100 |   92.30
services              |     100 |      100 |     100 |     100
validators            |     100 |      100 |     100 |     100
----------------------|---------|----------|---------|---------
```

Coverage helps identify untested code.

---

# 20. Important Jest Methods

## `describe`

Groups related tests.

```javascript
describe("UserService", () => {

});
```

---

## `it`

Defines a test case.

```javascript
it("should return user", async () => {

});
```

`test()` can also be used:

```javascript
test("should return user", async () => {

});
```

---

# 21. expect()

Assertions are written using `expect`.

```javascript
expect(result).toBe(true);
```

Object comparison:

```javascript
expect(result).toEqual(user);
```

Check function call:

```javascript
expect(mockFn)
  .toHaveBeenCalled();
```

Check arguments:

```javascript
expect(mockFn)
  .toHaveBeenCalledWith(1);
```

---

# 22. Jest Mock

A mock replaces the real implementation.

```javascript
jest.mock(
  "../../src/repositories/user.repository"
);
```

For example, instead of calling a real database:

```javascript
userRepository.findById
  .mockResolvedValue(user);
```

The service receives the mocked response.

This makes the test:

- Fast
- Independent
- Predictable
- Easy to debug

---

# 23. mockResolvedValue

For async functions:

```javascript
userRepository.findById
  .mockResolvedValue(user);
```

Equivalent to:

```javascript
async function findById() {
  return user;
}
```

---

# 24. mockRejectedValue

Used to simulate errors.

```javascript
userRepository.findById
  .mockRejectedValue(
    new Error("Database error")
  );
```

---

# 25. jest.fn()

Create a mock function:

```javascript
const mockFunction = jest.fn();

mockFunction("hello");

expect(mockFunction)
  .toHaveBeenCalledWith("hello");
```

---

# 26. Testing Async Errors

Use:

```javascript
await expect(
  userService.getUserById(100)
).rejects.toThrow(
  "User not found"
);
```

For resolved promises:

```javascript
await expect(
  userService.getUsers()
).resolves.toEqual(users);
```

---

# 27. beforeEach

Run code before every test.

```javascript
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

# 28. afterEach

Run code after every test.

```javascript
afterEach(() => {
  jest.clearAllMocks();
});
```

---

# 29. beforeAll

Runs once before all tests.

```javascript
beforeAll(async () => {

  // setup database

});
```

---

# 30. afterAll

Runs once after all tests.

```javascript
afterAll(async () => {

  // close database

});
```

This is especially important when testing:

- PostgreSQL
- MongoDB
- Redis
- Message queues

because open connections can prevent Jest from exiting.

---

# 31. Unit Test vs Integration Test

| Test Type | What It Tests | Database |
|---|---|---|
| Unit | Individual function/class | Mocked |
| Integration | Multiple application layers | Usually real/test DB |
| API/E2E | Complete request flow | Usually real/test environment |

Example:

```text
Unit Test

UserService
    ↓
Mock Repository
```

Integration:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Test Database
```

API:

```text
HTTP Request
    ↓
Express
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

---

# 32. What Should Be Unit Tested?

Important areas:

### Business logic

```javascript
calculatePrice()
calculateDiscount()
validateOrder()
checkInventory()
```

### Services

```javascript
UserService
OrderService
PaymentService
ProductService
```

### Validators

```javascript
Zod
Joi
Yup
```

### Utility functions

```javascript
generateToken()
formatDate()
calculatePagination()
hashPassword()
```

---

# 33. What Should Be Mocked?

Usually mock external dependencies:

```text
Database
Redis
AWS
S3
Email service
Payment gateway
Third-party API
Message queue
```

For example:

```javascript
jest.mock("../payment.service");
```

Then:

```javascript
paymentService.charge
  .mockResolvedValue({
    success: true
  });
```

---

# 34. Real-World Example

Suppose we have:

```text
Order API
```

Business requirement:

> User creates an order.

Application flow:

```text
POST /orders

        ↓

Order Controller

        ↓

Order Service

        ↓

Check Product Inventory

        ↓

Create Order

        ↓

Payment Service

        ↓

Send Notification
```

A unit test should not call the real payment gateway.

Instead:

```javascript
paymentService.charge
  .mockResolvedValue({
    success: true,
    transactionId: "txn_123"
  });
```

Then test:

```javascript
const result =
  await orderService.createOrder(order);

expect(result.status)
  .toBe("CONFIRMED");
```

---

# 35. Testing Error Scenarios

Do not only test successful scenarios.

Test:

```text
Success
Invalid input
Not found
Duplicate record
Unauthorized
Forbidden
Database error
Third-party API error
Timeout
Rate limit
```

Example:

```javascript
it("should throw when payment fails", async () => {

  paymentService.charge
    .mockRejectedValue(
      new Error("Payment failed")
    );

  await expect(
    orderService.createOrder(order)
  ).rejects.toThrow(
    "Payment failed"
  );

});
```

---

# 36. Testing Best Practices

## 1. One behavior per test

Good:

```javascript
it("should return 404 when user does not exist");
```

Avoid:

```javascript
it("should test everything");
```

---

## 2. Test behavior, not implementation

Prefer:

```javascript
expect(result.status)
  .toBe("CONFIRMED");
```

Instead of checking every internal implementation detail.

---

## 3. Mock external dependencies

Do not make unit tests depend on:

```text
Production DB
Redis
AWS
Payment Gateway
External APIs
```

---

## 4. Use meaningful test names

Good:

```javascript
it("should reject duplicate email");
```

Bad:

```javascript
it("test 1");
```

---

## 5. Test both success and failure

For every important business operation:

```text
Happy path
+
Error path
```

---

# 37. AAA Pattern

A common structure for unit tests is:

```text
Arrange
Act
Assert
```

Example:

```javascript
it("should return user", async () => {

  // Arrange

  const user = {
    id: 1,
    name: "John"
  };

  userRepository.findById
    .mockResolvedValue(user);

  // Act

  const result =
    await userService.getUserById(1);

  // Assert

  expect(result)
    .toEqual(user);

});
```

---

# 38. Testing Pyramid

A healthy test strategy looks like:

```text
             /\
            /  \
           / E2E\
          /------\
         /  API   \
        /----------\
       / Integration\
      /--------------\
     /   Unit Tests   \
    /------------------\
```

Generally:

```text
Many Unit Tests
        ↓
Some Integration Tests
        ↓
Few E2E Tests
```

Unit tests should be fast and numerous.

---

# 39. Recommended Test Structure

For a production Node.js application:

```text
tests/
│
├── unit/
│   ├── services/
│   ├── controllers/
│   ├── validators/
│   └── utils/
│
├── integration/
│   ├── users/
│   ├── orders/
│   └── products/
│
└── e2e/
    └── application.test.js
```

---

# 40. Interview Explanation

If an interviewer asks:

> How do you write unit tests in Node.js?

A good answer:

> I use Jest for unit testing Node.js applications. I keep business logic inside service classes and mock external dependencies such as repositories, databases, Redis and third-party APIs. For each service I test both successful and failure scenarios. I use `jest.fn()` and `jest.mock()` for mocking and `mockResolvedValue` or `mockRejectedValue` for asynchronous behavior. For API-level testing I use Supertest to send HTTP requests against the Express application. I also run Jest coverage to identify untested branches and critical business logic.

---

# 41. Common Interview Questions

### Q1. What is unit testing?

Testing an individual function, class, or module in isolation.

### Q2. What is Jest?

Jest is a JavaScript testing framework commonly used for Node.js and React applications.

### Q3. What is mocking?

Replacing a real dependency with a controlled fake implementation.

### Q4. Why mock a database?

Because unit tests should be:

- Fast
- Independent
- Deterministic

### Q5. What is Supertest?

Supertest is used to test HTTP endpoints without starting the application on a real network port.

### Q6. Difference between `toBe` and `toEqual`?

```javascript
toBe()
```

checks strict equality.

```javascript
toEqual()
```

checks deep equality for objects and arrays.

### Q7. How do you test rejected promises?

```javascript
await expect(
  service.method()
).rejects.toThrow("Error");
```

### Q8. How do you mock an async function?

```javascript
mockFn.mockResolvedValue(data);
```

or:

```javascript
mockFn.mockRejectedValue(error);
```

---

# 42. Commands Cheat Sheet

```bash
# Install dependencies
npm install

# Start application
npm start

# Development
npm run dev

# Run tests
npm test

# Watch tests
npm run test:watch

# Coverage
npm run test:coverage
```

---

# 43. Final Architecture

```text
                    Client
                      |
                      v
               Express API
                      |
                      v
                 Controller
                      |
                      v
                   Service
                      |
             +--------+--------+
             |                 |
             v                 v
        Repository        External API
             |
             v
          Database


Tests:

Unit
  |
  +--> Controller + Mock Service
  |
  +--> Service + Mock Repository
  |
  +--> Validator
  |
  +--> Utility


Integration
  |
  +--> Express
  +--> Controller
  +--> Service
  +--> Repository
```

---

# 44. Recommended Production Stack

For a larger Node.js application, a practical testing stack is:

```text
Node.js
Express
TypeScript
Jest
Supertest
Zod
Prisma
PostgreSQL
Redis
```

Testing strategy:

```text
Jest
 ├── Unit Tests
 │    ├── Services
 │    ├── Controllers
 │    ├── Validators
 │    └── Utils
 │
 ├── Integration Tests
 │    ├── PostgreSQL
 │    ├── Redis
 │    └── API
 │
 └── E2E Tests
      └── Complete user flows
```

This structure provides a strong foundation for **Node.js backend interviews and production applications**.