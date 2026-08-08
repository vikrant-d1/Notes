
## Bank Transfer
```javascript
const resolvers = {
  Mutation: {
    transferMoney: async (_, { fromId, toId, amount }, { prisma }) => {

      await prisma.$transaction(async (tx) => {

        await tx.account.update({
          where: { id: fromId },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        await tx.account.update({
          where: { id: toId },
          data: {
            balance: {
              increment: amount,
            },
          },
        });

      });

      return true;
    },
  },
};
```

### Order Creation
```javascript
Mutation: {
  createOrder: async (_, { input }, { prisma }) => {

    return prisma.$transaction(async (tx) => {

      const order = await tx.order.create({
        data: {
          userId: input.userId,
        },
      });

      await tx.orderItem.createMany({
        data: input.items.map(item => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: input.total,
        },
      });

      return order;
    });

  },
}

```

### Update Stock

```javascript
Mutation: {
  purchaseProduct: async (_, { productId }, { prisma }) => {

    return prisma.$transaction(async (tx) => {

      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product)
        throw new Error("Product not found");

      if (product.stock <= 0)
        throw new Error("Out of stock");

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: 1,
          },
        },
      });

    });

    return true;
  },
}
```

### User Registration

```javascript
Mutation: {
  register: async (_, { input }, { prisma }) => {

    return prisma.$transaction(async (tx) => {

      const user = await tx.user.create({
        data: {
          email: input.email,
          password: input.password,
        },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
        },
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });

      return user;
    });

  },
}
```

## GraphQL Best Practice

Move transaction logic into the service layer rather than keeping business logic in the resolver.


Resolver
```javascript
const resolvers = {
  Mutation: {
    createOrder: (_, { input }, { prisma }) => {
      return OrderService.createOrder(prisma, input);
    },
  },
};
```

Service
```javascript
class OrderService {
  static async createOrder(prisma, input) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: input.userId,
        },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: input.total,
        },
      });

      return order;
    });
  }
}
```
