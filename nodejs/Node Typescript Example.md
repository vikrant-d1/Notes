## Validation Middleware
```javascript
// middleware/validate.middleware.ts

import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
(schema: AnyZodObject) =>
(req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
    });

    if (!result.success) {
        return res.status(400).json({
            success: false,
            errors: result.error.flatten(),
        });
    }

    next();
};
```
### Validator

```javascript
// validators/user.validator.ts

import { z } from "zod";

export const createUserSchema = z.object({

    body: z.object({
        firstName: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(8),
    }),

});
```

### Route
```javascript
router.post(
    "/users",
    validate(createUserSchema),
    createUser
);
```

### Auth Middleware
```javascript
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    const payload = verifyAccessToken(token);

    req.user = payload;

    next();
};
```
### Authorization Middleware
```javascript
export const authorize =
(...roles: string[]) =>
(req: Request, res: Response, next: NextFunction) => {

    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            message: "Forbidden",
        });
    }

    next();
};
```
Usage
```javascript
router.delete(
    "/users/:id",
    authenticate,
    authorize("ADMIN"),
    deleteUser
);
```
### Async Handler
```javascript
Avoid try/catch in every controller.

export const asyncHandler =
(fn: any) =>
(req: Request, res: Response, next: NextFunction) => {

    Promise.resolve(fn(req, res, next)).catch(next);

};
```
Controller

```javascript
export const createUser = asyncHandler(async (req, res) => {

    const user = await userService.create(req.body);

    res.status(201).json(user);

});
```

### Error Middleware
```javascript
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message,
    });

};
```
### Logger Middleware
```javascript
app.use((req, res, next) => {

    console.log(
        `${req.method} ${req.originalUrl}`
    );

    next();

});
```

### Request ID Middleware
```javascript
import { randomUUID } from "crypto";

export const requestId = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    req.requestId = randomUUID();

    res.setHeader("X-Request-Id", req.requestId);

    next();

};
```

### Response Helper
```javascript
export const success = (
    res: Response,
    data: unknown,
    message = "Success"
) => {

    return res.json({
        success: true,
        message,
        data,
    });

};
```
### Express Types
```javascript
declare global {
    namespace Express {
        interface Request {
            user: any;
            requestId: string;
        }
    }
}
```
### Typical Route
```javascript
router.post(
    "/users",
    authenticate,
    authorize("ADMIN"),
    validate(createUserSchema),
    createUser
);
```
