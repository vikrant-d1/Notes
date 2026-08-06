# GraphQL 
Top 15 packages every senior GraphQL developer should know

| Package                  | Importance |
| ------------------------ | ---------- |
| `graphql`                | ⭐⭐⭐⭐⭐      |
| `@apollo/server`         | ⭐⭐⭐⭐⭐      |
| `@graphql-tools/*`       | ⭐⭐⭐⭐⭐      |
| `dataloader`             | ⭐⭐⭐⭐⭐      |
| `graphql-scalars`        | ⭐⭐⭐⭐⭐      |
| `graphql-shield`         | ⭐⭐⭐⭐⭐      |
| `graphql-armor`          | ⭐⭐⭐⭐⭐      |
| `graphql-depth-limit`    | ⭐⭐⭐⭐⭐      |
| `graphql-cost-analysis`  | ⭐⭐⭐⭐⭐      |
| `graphql-ws`             | ⭐⭐⭐⭐⭐      |
| `@graphql-codegen/cli`   | ⭐⭐⭐⭐⭐      |
| `@graphql-inspector/cli` | ⭐⭐⭐⭐⭐      |
| `@apollo/subgraph`       | ⭐⭐⭐⭐⭐      |
| `ioredis`                | ⭐⭐⭐⭐⭐      |
| `zod`                    | ⭐⭐⭐⭐⭐      |


##Recommended Production Stack (Most Important)

```
graphql
@apollo/server
@graphql-tools/schema
@graphql-tools/merge
@graphql-tools/load

@prisma/client
prisma

zod

jsonwebtoken
bcrypt
graphql-shield

dataloader
ioredis

graphql-scalars
graphql-ws

graphql-armor
graphql-depth-limit
graphql-cost-analysis

@graphql-codegen/cli
@graphql-inspector/cli

pino
@opentelemetry/api
prom-client

helmet
cors
compression

dotenv

```

### GraphQL Armor

GraphQL Armor protects against DoS attacks.

```
npm install graphql-armor
```
Provides
- Depth Limit
- Alias Limit
- Tokens Limit
- Directives Limit
- Cost Limit


## 1. Fundamentals & Core Concepts

### Q1: What is GraphQL and how does it differ from REST?

**Answer:**
GraphQL is a query language for APIs and a server-side runtime for executing those queries using a type system you define for your data. It was developed internally by Facebook in 2012 and open-sourced in 2015.

Key differences from REST:

- **Single endpoint** — GraphQL exposes one endpoint (e.g., `/graphql`) vs multiple REST endpoints (`/users`, `/posts`, etc.).
- **Client-driven queries** — The client specifies exactly what data it needs, avoiding over-fetching and under-fetching.
- **Strongly typed schema** — The entire API is described by a schema using the Schema Definition Language (SDL).
- **No versioning needed** — You deprecate fields instead of creating `/v2/` endpoints.
- **Introspection** — Clients can query the schema itself to discover available types, fields, and operations.

**Drawback:** REST is simpler for straightforward CRUD operations and is better understood by most teams. GraphQL introduces complexity that may not be justified for simple APIs.

---

### Q2: Explain the GraphQL execution model.

**Answer:**
When a GraphQL query arrives at the server:

1. **Parsing** — The query string is parsed into an Abstract Syntax Tree (AST).
2. **Validation** — The AST is validated against the schema (type checking, field existence, argument types).
3. **Execution** — The executor walks the AST top-down, calling the resolver for each field.
4. **Response** — Results are assembled into a JSON object that mirrors the query shape.

```
Client Query → Parse → Validate → Execute Resolvers → JSON Response
```

The execution is **breadth-first** at each level — all fields at one level resolve before moving to the next nested level.

**Drawback:** The parsing and validation steps add overhead compared to REST, where the endpoint directly maps to a handler.

---

### Q3: What is the Schema Definition Language (SDL)?

**Answer:**
SDL is the syntax used to define GraphQL schemas. It is language-agnostic and human-readable.

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  role: Role!
}

enum Role {
  ADMIN
  USER
  MODERATOR
}

type Post {
  id: ID!
  title: String!
  author: User!
  createdAt: DateTime!
}

type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
}

input CreateUserInput {
  name: String!
  email: String!
  role: Role
}

//dummy data
const users = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "ADMIN",
  },
  {
    id: "2",
    name: "Alice",
    email: "alice@example.com",
    role: "USER",
  },
];

const posts = [
  {
    id: "101",
    title: "GraphQL Basics",
    authorId: "1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "102",
    title: "Node.js Tutorial",
    authorId: "2",
    createdAt: new Date().toISOString(),
  },
];

module.exports = { users, posts };


// resolvers.js
const { users, posts } = require("./data");

const resolvers = {
  Query: {
    user: (_, { id }) => {
      return users.find(user => user.id === id);
    },

    users: (_, { limit, offset }) => {
      let result = users;

      if (offset) {
        result = result.slice(offset);
      }

      if (limit) {
        result = result.slice(0, limit);
      }

      return result;
    },
  },

  Mutation: {
    createUser: (_, { input }) => {
      const newUser = {
        id: String(users.length + 1),
        ...input,
        role: input.role || "USER",
      };

      users.push(newUser);

      return newUser;
    },
  },

  User: {
    posts: (parent) => {
      return posts.filter(post => post.authorId === parent.id);
    },
  },

  Post: {
    author: (parent) => {
      return users.find(user => user.id === parent.authorId);
    },
  },
};

module.exports = resolvers;


// Server Example
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

const fs = require("fs");
const resolvers = require("./resolvers");

const typeDefs = fs.readFileSync("./schema.graphql", "utf8");

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server running at ${url}`);
});

```

Key SDL features: Object types, Scalar types, Enum types, Input types, Interfaces, Unions, and Directives.

---

### Q4: What are the scalar types in GraphQL?

**Answer:**
Built-in scalar types:

- `Int` — 32-bit signed integer
- `Float` — Double-precision floating point
- `String` — UTF-8 character sequence
- `Boolean` — `true` or `false`
- `ID` — Unique identifier, serialized as a String

You can define **custom scalars** for things like `DateTime`, `JSON`, `Email`, `URL`, etc.:

```graphql
scalar DateTime
scalar Email
```

Custom scalars require serialization, parsing, and literal-parsing functions on the server side.

---

### Q5: What does the `!` (non-null) modifier mean? What about `[Type!]!`?

**Answer:**

| Declaration    | Meaning                                          |
|----------------|--------------------------------------------------|
| `String`       | Nullable string — can return `null`              |
| `String!`      | Non-null string — must always return a value     |
| `[String]`     | Nullable list of nullable strings                |
| `[String!]`    | Nullable list, but items inside cannot be `null` |
| `[String!]!`   | Non-null list of non-null strings (most common)  |

**Drawback / Caution:** Using `!` aggressively can cause issues. If a non-null field resolver throws an error, the error **propagates up** to the nearest nullable parent, potentially nullifying a larger portion of the response than intended.

---

### Q6: What is introspection in GraphQL?

**Answer:**
Introspection allows clients to query the schema itself. GraphQL servers expose meta-fields like `__schema`, `__type`, and `__typename`.

```graphql
{
  __schema {
    types {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
```

Tools like GraphiQL and Apollo Studio use introspection to provide auto-complete and documentation.

**Security Drawback:** Introspection should be **disabled in production** as it exposes the entire API surface area to potential attackers.

---

## 2. Schema Design & Type System

### Q7: How would you design a GraphQL schema for a large application?

**Answer:**
As a Tech Lead, I follow these schema design principles:

1. **Design for the client** — Think about what data the UI needs, not your database structure.
2. **Use a Relay-style connection pattern** for pagination:
   ```graphql
   type UserConnection {
     edges: [UserEdge!]!
     pageInfo: PageInfo!
     totalCount: Int!
   }
   type UserEdge {
     node: User!
     cursor: String!
   }
   type PageInfo {
     hasNextPage: Boolean!
     hasPreviousPage: Boolean!
     startCursor: String
     endCursor: String
   }
   ```
3. **Input types for mutations** — Always use `input` types for mutation arguments.
4. **Mutation payloads** — Return a payload type with the result and possible errors:
   ```graphql
   type CreateUserPayload {
     user: User
     errors: [UserError!]!
   }
   type UserError {
     field: String
     message: String!
     code: ErrorCode!
   }
   ```
5. **Interfaces and Unions** for polymorphism.
6. **Modular schema** — Split schema into domain files and merge them.
7. **Naming conventions** — PascalCase for types, camelCase for fields, SCREAMING_SNAKE for enums.

---

### Q8: What are Interfaces and Unions? When would you use each?

**Answer:**

**Interface** — A contract that types must implement. Use when types share common fields.

```graphql
interface Node {
  id: ID!
}

interface Timestamped {
  createdAt: DateTime!
  updatedAt: DateTime!
}

type User implements Node & Timestamped {
  id: ID!
  name: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Post implements Node & Timestamped {
  id: ID!
  title: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

**Union** — A type that can be one of several types. No shared fields required.

```graphql
union SearchResult = User | Post | Comment

type Query {
  search(term: String!): [SearchResult!]!
}
```

Clients use **inline fragments** to query union/interface fields:

```graphql
query {
  search(term: "hello") {
    ... on User { name email }
    ... on Post { title }
    ... on Comment { body }
  }
}
```

**When to use what:**
- **Interface** → Types that share a common set of fields (e.g., all entities have `id`, `createdAt`).
- **Union** → Types that are conceptually related but have different shapes (e.g., search results, activity feed items).

---

### Q9: What are directives? How do you create custom directives?

**Answer:**
Directives annotate parts of a schema or query to alter execution behavior.

**Built-in directives:**
- `@deprecated(reason: "Use newField")` — Marks a field as deprecated.
- `@skip(if: Boolean!)` — Conditionally skip a field.
- `@include(if: Boolean!)` — Conditionally include a field.

**Custom directive example (schema-side):**

```graphql
directive @auth(requires: Role!) on FIELD_DEFINITION

type Query {
  users: [User!]! @auth(requires: ADMIN)
  publicPosts: [Post!]!
}
```

**Server implementation (Apollo Server):**

```javascript
const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');

function authDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];
      if (authDirective) {
        const { requires } = authDirective;
        const originalResolve = fieldConfig.resolve;
        fieldConfig.resolve = async (source, args, context, info) => {
          if (context.user?.role !== requires) {
            throw new ForbiddenError('Not authorized');
          }
          return originalResolve(source, args, context, info);
        };
      }
      return fieldConfig;
    },
  });
}
```

**Drawback:** Custom directives are not standardized across implementations — they work differently in Apollo, Yoga, and other frameworks.

---

### Q10: What are abstract types and how does `__resolveType` work?

**Answer:**
Abstract types (Interfaces and Unions) require a `__resolveType` function to tell GraphQL which concrete type a returned object is.

```javascript
const resolvers = {
  SearchResult: {
    __resolveType(obj) {
      if (obj.email) return 'User';
      if (obj.title) return 'Post';
      if (obj.body) return 'Comment';
      return null;
    },
  },
};
```

Without `__resolveType`, the server won't know how to resolve inline fragments and will throw an error.

**Best practice:** Use an explicit `__typename` field in your data rather than guessing based on field presence:

```javascript
__resolveType(obj) {
  return obj.__typename; // Set this when fetching from DB/service
}
```

---

## 3. Queries, Mutations & Subscriptions

### Q11: Explain the difference between Query, Mutation, and Subscription.

**Answer:**

| Operation      | Purpose          | Execution        | Use Case               |
|----------------|------------------|------------------|------------------------|
| `Query`        | Read data        | Parallel         | Fetching user profiles |
| `Mutation`     | Write/modify     | Sequential       | Creating a post        |
| `Subscription` | Real-time stream | Long-lived (WebSocket) | Live notifications |

**Important:** Mutations execute **sequentially** (one after another) to avoid race conditions, while queries execute **in parallel**.

```graphql
# Query
query GetUser {
  user(id: "1") {
    name
    posts { title }
  }
}

# Mutation
mutation CreatePost {
  createPost(input: { title: "Hello", body: "World" }) {
    post { id title }
    errors { message }
  }
}

# Subscription
subscription OnNewPost {
  postCreated {
    id
    title
    author { name }
  }
}
```

---

### Q12: What are fragments and why are they important?

**Answer:**
Fragments let you reuse sets of fields across multiple queries, reducing duplication.

```graphql
fragment UserFields on User {
  id
  name
  email
  avatar
}

query {
  currentUser {
    ...UserFields
    role
  }
  user(id: "2") {
    ...UserFields
    posts { title }
  }
}
```

**Inline fragments** are used for type narrowing with unions/interfaces:

```graphql
query {
  node(id: "1") {
    ... on User { name }
    ... on Post { title }
  }
}
```

**In client-side code** (Apollo, Relay), fragments enable component-level data requirements — each component declares what data it needs via a fragment, and these compose into a single query.

---

### Q13: What are variables in GraphQL and why should you use them?

**Answer:**
Variables parameterize queries, separating the query structure from the dynamic values.

```graphql
query GetUser($id: ID!, $includePostDetails: Boolean!) {
  user(id: $id) {
    name
    posts {
      title
      body @include(if: $includePostDetails)
    }
  }
}
```

Variables are sent as a separate JSON object:
```json
{
  "id": "123",
  "includePostDetails": true
}
```

**Why they matter:**
- Prevents **query string injection** (a form of GraphQL injection attack).
- Enables **query caching** — the query string stays the same, only variables change.
- Cleaner, more maintainable client code.

**Drawback:** Some developers new to GraphQL embed values directly in query strings, which is a security risk and breaks caching.

---

### Q14: What are persisted queries?

**Answer:**
Persisted queries (also called Automatic Persisted Queries / APQ) replace the full query string with a hash.

**How it works:**
1. Client sends a hash of the query instead of the full text.
2. Server looks up the hash in a registry.
3. If found, executes the stored query.
4. If not found (APQ), client retries with the full query, and the server stores it.

**Benefits:**
- Reduces bandwidth (query strings can be large).
- Prevents arbitrary queries — only allow pre-approved queries in production.
- Better caching via CDNs.

**Implementation with Apollo:**
```javascript
// Client
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const link = createPersistedQueryLink({ sha256 });

// Server allows only registered query hashes
```

---

## 4. Resolvers — Deep Dive

### Q15: How do resolvers work? Explain the resolver chain.

**Answer:**
A resolver is a function that returns data for a specific field. Every field in the schema can have a resolver.

**Resolver signature:**
```javascript
fieldName(parent, args, context, info)
```

| Parameter | Description |
|-----------|-------------|
| `parent`  | Result returned by the parent resolver (also called `root` or `source`) |
| `args`    | Arguments passed to the field in the query |
| `context` | Shared object across all resolvers (auth, dataloaders, DB connections) |
| `info`    | AST information about the query, field name, return type, etc. |

**Resolver chain example:**

```graphql
query {
  user(id: "1") {     # Query.user resolver → returns { id: "1", name: "Alice" }
    name               # Default resolver uses parent.name → "Alice"
    posts {            # User.posts resolver → fetches posts for user "1"
      title            # Default resolver uses parent.title
      comments {       # Post.comments resolver → fetches comments for post
        body           # Default resolver
      }
    }
  }
}
```

**Default resolvers:** If no resolver is defined for a field, GraphQL uses a default resolver that returns `parent[fieldName]`.

---

### Q16: What is the `context` object and what should go in it?

**Answer:**
The context is created per request and shared across all resolvers.

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization || '';
    const user = await getUserFromToken(token);
    
    return {
      user,                          // Authenticated user
      dataloaders: createLoaders(),  // DataLoader instances (per-request!)
      db: prisma,                    // Database client
      pubsub,                        // PubSub for subscriptions
      services: {                    // Domain services
        userService: new UserService(prisma),
        emailService: new EmailService(),
      },
    };
  },
});
```

**Key rules:**
- **DataLoaders must be per-request** (new instances each request) to avoid cache leaks between users.
- Keep context creation lightweight — lazy-initialize heavy resources.
- Never put request-specific data in global variables.

---

### Q17: What is the `info` parameter and when would you use it?

**Answer:**
The `info` parameter contains the AST of the current query execution. It includes:

- `fieldName` — Name of the current field.
- `fieldNodes` — AST nodes for the current field (includes sub-selections).
- `returnType` — The return type of the field.
- `parentType` — The parent type.
- `path` — The path to the current field from root.
- `schema` — The full schema.

**Use cases:**

1. **Query optimization** — Inspect requested sub-fields to optimize DB queries:
   ```javascript
   const resolvers = {
     Query: {
       users: (_, args, ctx, info) => {
         const requestedFields = getRequestedFields(info);
         // Only SELECT columns the client actually asked for
         return db.users.findMany({ select: requestedFields });
       }
     }
   };
   ```
2. **Calculated complexity** — Compute query cost dynamically.
3. **Logging and tracing** — Know which field is being resolved.

Libraries like `graphql-fields` or `graphql-parse-resolve-info` help extract field info.

---

## 5. Data Fetching & the N+1 Problem

### Q18: Explain the N+1 problem in GraphQL and how to solve it.

**Answer:**
The N+1 problem is the most well-known performance issue in GraphQL.

**The problem:**
```graphql
query {
  users {          # 1 query to fetch all users
    posts {        # N queries — one per user — to fetch their posts
      title
    }
  }
}
```

If there are 100 users, this results in 1 + 100 = 101 database queries.

**Solution: DataLoader**

DataLoader batches and caches requests within a single tick of the event loop.

```javascript
const DataLoader = require('dataloader');

// Batch function — receives array of keys, returns array of results
const postsByUserLoader = new DataLoader(async (userIds) => {
  const posts = await db.posts.findMany({
    where: { authorId: { in: userIds } },
  });
  
  // CRITICAL: Return results in the same order as userIds
  const postMap = {};
  posts.forEach(post => {
    if (!postMap[post.authorId]) postMap[post.authorId] = [];
    postMap[post.authorId].push(post);
  });
  
  return userIds.map(id => postMap[id] || []);
});

// Resolver
const resolvers = {
  User: {
    posts: (user, _, context) => {
      return context.dataloaders.postsByUserLoader.load(user.id);
    },
  },
};
```

Now, regardless of how many users, there are only **2 queries**: one for users and one batched query for all their posts.

**Key DataLoader rules:**
- Create new instances per request (in context factory).
- The batch function must return results in the same order as the input keys.
- The batch function must return the same number of results as keys.

**Drawback:** DataLoader adds complexity and requires careful implementation. Incorrect ordering in the batch function causes subtle, hard-to-debug data integrity bugs.

---

### Q19: What are some other approaches to solve N+1 besides DataLoader?

**Answer:**

1. **Join Monster** — Analyzes the query AST and generates a single SQL JOIN query:
   ```javascript
   // Automatically generates optimized SQL from the GraphQL query
   import joinMonster from 'join-monster';
   
   const resolvers = {
     Query: {
       users: (_, args, ctx, info) => {
         return joinMonster(info, ctx, sql => db.raw(sql));
       },
     },
   };
   ```

2. **Prisma's `fluent API`** — Handles nested includes based on the query:
   ```javascript
   const user = await prisma.user.findUnique({
     where: { id },
     include: { posts: true, profile: true },
   });
   ```

3. **Lookahead** — Inspect `info` to determine needed relations upfront:
   ```javascript
   const requestedFields = graphqlFields(info);
   const include = {};
   if (requestedFields.posts) include.posts = true;
   if (requestedFields.profile) include.profile = true;
   ```

4. **Caching layers** — Redis/in-memory caching at the resolver or data source level.

Each has trade-offs: Join Monster tightly couples schema to SQL, Prisma adds an ORM dependency, and lookahead can become complex for deeply nested queries.

---

## 6. Authentication & Authorization

### Q20: How do you handle authentication in a GraphQL API?

**Answer:**
Authentication verifies **who** the user is. It typically happens at the transport layer before GraphQL execution.

```javascript
// Apollo Server — context-based auth
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    let user = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await db.users.findUnique({ where: { id: decoded.userId } });
      } catch (err) {
        // Token invalid or expired — user remains null
      }
    }
    
    return { user };
  },
});
```

For public/private field mix, handle at the resolver level:

```javascript
const resolvers = {
  Query: {
    me: (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return user;
    },
    publicPosts: () => db.posts.findMany({ where: { published: true } }),
  },
};
```

---

### Q21: How do you handle authorization (permissions)?

**Answer:**
Authorization verifies **what** the user can do. Multiple strategies exist:

**1. Resolver-level checks:**
```javascript
const resolvers = {
  Mutation: {
    deleteUser: (_, { id }, { user }) => {
      if (user.role !== 'ADMIN') throw new ForbiddenError('Admin only');
      return db.users.delete({ where: { id } });
    },
  },
};
```

**2. Directive-based (recommended for Tech Lead):**
```graphql
directive @auth(requires: Role!) on FIELD_DEFINITION

type Mutation {
  deleteUser(id: ID!): User! @auth(requires: ADMIN)
  updateProfile(input: UpdateProfileInput!): User! @auth(requires: USER)
}
```

**3. Middleware/plugin approach (graphql-shield):**
```javascript
const { shield, rule, and, or } = require('graphql-shield');

const isAuthenticated = rule()((_, __, { user }) => !!user);
const isAdmin = rule()((_, __, { user }) => user?.role === 'ADMIN');
const isOwner = rule()((_, { id }, { user }) => user?.id === id);

const permissions = shield({
  Query: {
    users: isAdmin,
    me: isAuthenticated,
  },
  Mutation: {
    deleteUser: and(isAuthenticated, or(isAdmin, isOwner)),
    updateProfile: isAuthenticated,
  },
});
```

**As a Tech Lead, I prefer** the directive + middleware hybrid approach because it makes permissions visible in the schema while keeping the logic centralized and testable.

**Drawback:** Authorization in GraphQL is more complex than REST because the same type can be accessed through multiple paths, making it easy to miss an access check.

---

## 7. Error Handling

### Q22: How does error handling work in GraphQL?

**Answer:**
GraphQL handles errors differently from REST. Instead of HTTP status codes, errors are returned in the response body alongside partial data.

**Standard error response:**
```json
{
  "data": {
    "user": null
  },
  "errors": [
    {
      "message": "User not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["user"],
      "extensions": {
        "code": "NOT_FOUND",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

**Key behaviors:**
- GraphQL **always returns HTTP 200**, even with errors.
- If a non-null field errors, the error **propagates up** to the nearest nullable parent.
- Multiple errors can be returned in a single response.
- Partial data is returned — only the errored fields are affected.

**Drawback:** Since it's always HTTP 200, traditional monitoring tools and CDNs that rely on status codes won't detect errors. You need GraphQL-aware monitoring (Apollo Studio, Grafana with custom metrics).

---

### Q23: What is your approach to error handling as a Tech Lead?

**Answer:**
I categorize errors into two types and handle them differently:

**1. User-facing errors (expected)** — Return in the response payload:
```graphql
type CreateUserPayload {
  user: User
  errors: [UserError!]!
}

type UserError {
  field: String
  message: String!
  code: ErrorCode!
}

enum ErrorCode {
  VALIDATION_ERROR
  DUPLICATE_EMAIL
  NOT_FOUND
  FORBIDDEN
}
```

**2. System errors (unexpected)** — Use the standard `errors` array with a formatted error hook:

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    // Log the full error internally
    logger.error(error);
    
    // Don't leak internal details to the client
    if (error.originalError instanceof ValidationError) {
      return formattedError; // Safe to expose
    }
    
    // Mask unexpected errors
    return {
      message: 'Internal server error',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    };
  },
});
```

**My recommended pattern** (union-based error handling):
```graphql
union CreateUserResult = User | ValidationError | DuplicateEmailError

type ValidationError {
  field: String!
  message: String!
}

type DuplicateEmailError {
  email: String!
  message: String!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult!
}
```

This forces the client to handle every possible outcome, and is type-safe.

---

## 8. Performance & Caching

### Q24: How do you approach caching in GraphQL?

**Answer:**
Caching in GraphQL is more complex than REST because of the single-endpoint nature.

**Layers of caching:**

**1. Client-side (Normalized Cache — Apollo Client):**
```javascript
const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        keyFields: ['id'], // Normalize by User.id
      },
      Query: {
        fields: {
          users: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
});
```

Apollo normalizes responses by `__typename` + `id`, so updating a User in one query automatically updates it everywhere.

**2. Server-side CDN caching (with cache hints):**
```javascript
const resolvers = {
  Query: {
    publicPosts: (_, __, ___, info) => {
      info.cacheControl.setCacheHint({ maxAge: 300, scope: 'PUBLIC' });
      return db.posts.findMany({ where: { published: true } });
    },
  },
  User: {
    email: (_, __, ___, info) => {
      info.cacheControl.setCacheHint({ maxAge: 0, scope: 'PRIVATE' });
    },
  },
};
```

**3. DataLoader (per-request memoization):** Automatically deduplicates identical requests within a single query execution.

**4. Application-level (Redis):**
```javascript
const resolvers = {
  Query: {
    user: async (_, { id }) => {
      const cached = await redis.get(`user:${id}`);
      if (cached) return JSON.parse(cached);
      
      const user = await db.users.findUnique({ where: { id } });
      await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 3600);
      return user;
    },
  },
};
```

**Drawback:** GraphQL's flexibility makes HTTP caching harder. GET-based queries with query strings can use CDN caching, but POST-based queries (the default) cannot without persisted queries or a GraphQL-aware CDN like Apollo's Edge.

---

### Q25: How do you measure and optimize GraphQL performance?

**Answer:**

**1. Query complexity analysis:**
```javascript
const { createComplexityLimitRule } = require('graphql-validation-complexity');

const server = new ApolloServer({
  validationRules: [
    createComplexityLimitRule(1000, {
      scalarCost: 1,
      objectCost: 10,
      listFactor: 20,
    }),
  ],
});
```

**2. Field-level tracing (Apollo Tracing):**
```javascript
const server = new ApolloServer({
  plugins: [
    ApolloServerPluginUsageReporting({
      sendVariableValues: { all: true },
      sendHeaders: { all: true },
    }),
  ],
});
```

**3. Custom resolver timing:**
```javascript
const resolverTimingPlugin = {
  requestDidStart() {
    return {
      executionDidStart() {
        return {
          willResolveField({ info }) {
            const start = process.hrtime.bigint();
            return () => {
              const duration = process.hrtime.bigint() - start;
              if (duration > 100_000_000n) { // > 100ms
                logger.warn(`Slow resolver: ${info.parentType}.${info.fieldName} took ${duration / 1_000_000n}ms`);
              }
            };
          },
        };
      },
    };
  },
};
```

**4. Query depth limiting:**
```javascript
const depthLimit = require('graphql-depth-limit');

const server = new ApolloServer({
  validationRules: [depthLimit(10)],
});
```

---

## 9. Security

### Q26: What are the major security concerns with GraphQL?

**Answer:**

**1. Query depth attacks:**
```graphql
# Malicious deep query
query {
  user {
    posts {
      author {
        posts {
          author {
            posts { ... }  # Infinite nesting
          }
        }
      }
    }
  }
}
```
**Mitigation:** `graphql-depth-limit` library, set max depth to 7-10.

**2. Query complexity / resource exhaustion:**
```graphql
# Expensive query
query {
  users(first: 1000) {
    posts(first: 1000) {
      comments(first: 1000) {
        replies(first: 1000) { body }
      }
    }
  }
}
```
**Mitigation:** Query complexity analysis with cost limits.

**3. Introspection leakage:**
**Mitigation:** Disable introspection in production:
```javascript
const server = new ApolloServer({
  introspection: process.env.NODE_ENV !== 'production',
});
```

**4. Batching attacks (alias-based):**
```graphql
query {
  a1: login(user: "admin", pass: "password1") { token }
  a2: login(user: "admin", pass: "password2") { token }
  # ... 1000 login attempts in one request
}
```
**Mitigation:** Rate limit by query complexity, not just requests. Limit alias count.

**5. Injection via variables:**
**Mitigation:** Always use parameterized variables (never string interpolation). Validate inputs with custom scalars or validation libraries.

**6. Field suggestion exposure:**
**Mitigation:** Disable field suggestions in production (they help attackers guess field names).

---

### Q27: How do you implement rate limiting in GraphQL?

**Answer:**
Traditional REST rate limiting (requests per minute) doesn't work well for GraphQL because one request can be trivial or massively expensive.

**Cost-based rate limiting:**

```javascript
const costAnalysis = require('graphql-cost-analysis');

const server = new ApolloServer({
  validationRules: [
    costAnalysis({
      maximumCost: 1000,
      defaultCost: 1,
      variables: req.body.variables,
      createError: (max, actual) => {
        return new GraphQLError(
          `Query too complex: cost ${actual} exceeds max ${max}`
        );
      },
      costMap: {
        Query: {
          users: { complexity: 2, multipliers: ['limit'] },
          // users(limit: 100) costs 2 * 100 = 200
        },
      },
    }),
  ],
});
```

**Combine with token-bucket or sliding-window limiting:**

```javascript
const rateLimit = require('graphql-rate-limit');

const rateLimitDirective = rateLimit({
  identifyContext: (ctx) => ctx.user?.id || ctx.ip,
});

// In schema
// directive @rateLimit(max: Int!, window: String!) on FIELD_DEFINITION
// type Mutation {
//   sendMessage(input: SendMessageInput!): Message! @rateLimit(max: 10, window: "1m")
// }
```

---

## 10. Subscriptions & Real-time

### Q28: How do GraphQL subscriptions work?

**Answer:**
Subscriptions use WebSocket connections (typically via `graphql-ws` protocol) to push data from server to client in real-time.

**Server setup:**

```javascript
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

const typeDefs = `
  type Subscription {
    messageCreated(channelId: ID!): Message!
    userStatusChanged: UserStatus!
  }
`;

const resolvers = {
  Subscription: {
    messageCreated: {
      subscribe: (_, { channelId }) => {
        return pubsub.asyncIterator(`MESSAGE_CREATED_${channelId}`);
      },
    },
  },
  Mutation: {
    sendMessage: async (_, { input }, { pubsub }) => {
      const message = await db.messages.create({ data: input });
      pubsub.publish(`MESSAGE_CREATED_${input.channelId}`, {
        messageCreated: message,
      });
      return message;
    },
  },
};

// Setup WebSocket server alongside HTTP
const httpServer = createServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
useServer({ schema }, wsServer);
```

**Drawback:** The in-memory `PubSub` from `graphql-subscriptions` is **not suitable for production** — it only works within a single server instance. For production, use Redis PubSub, Kafka, or a similar distributed system.

---

### Q29: How would you scale subscriptions in production?

**Answer:**

1. **Redis PubSub** for multi-instance communication:
   ```javascript
   const { RedisPubSub } = require('graphql-redis-subscriptions');
   const Redis = require('ioredis');

   const pubsub = new RedisPubSub({
     publisher: new Redis(REDIS_URL),
     subscriber: new Redis(REDIS_URL),
   });
   ```

2. **Connection management:**
   - Set max connections per server.
   - Implement heartbeat/keep-alive.
   - Gracefully handle reconnection.

3. **Filtering at the server** — Don't send data and let clients filter:
   ```javascript
   messageCreated: {
     subscribe: withFilter(
       () => pubsub.asyncIterator('MESSAGE_CREATED'),
       (payload, variables, context) => {
         return (
           payload.messageCreated.channelId === variables.channelId &&
           payload.messageCreated.authorId !== context.user.id
         );
       }
     ),
   }
   ```

4. **Consider alternatives for high scale:**
   - Server-Sent Events (SSE) for simpler one-way streaming.
   - A dedicated real-time service (Socket.io, Ably, Pusher) alongside GraphQL.

**Drawback:** WebSocket-based subscriptions don't work well with serverless architectures (Lambda, Cloud Functions). For serverless, consider polling or SSE-based solutions like `graphql-sse`.

---

## 11. Testing

### Q30: How do you test a GraphQL API?

**Answer:**

**1. Unit testing resolvers:**
```javascript
describe('User resolvers', () => {
  it('should return user by ID', async () => {
    const mockContext = {
      db: {
        users: {
          findUnique: jest.fn().mockResolvedValue({
            id: '1', name: 'Alice', email: 'alice@test.com',
          }),
        },
      },
      user: { id: '1', role: 'USER' },
    };

    const result = await resolvers.Query.user(
      null,
      { id: '1' },
      mockContext,
      null
    );

    expect(result.name).toBe('Alice');
    expect(mockContext.db.users.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });
});
```

**2. Integration testing (full query execution):**
```javascript
const { createTestClient } = require('apollo-server-testing');
// Or use supertest for HTTP-level testing

describe('GraphQL Integration', () => {
  it('should fetch user with posts', async () => {
    const { query } = createTestClient(server);
    
    const GET_USER = gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          name
          posts { title }
        }
      }
    `;

    const res = await query({
      query: GET_USER,
      variables: { id: '1' },
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.user.name).toBe('Alice');
    expect(res.data.user.posts).toHaveLength(3);
  });
});
```

**3. Schema testing:**
```javascript
const { buildSchema } = require('graphql');

describe('Schema', () => {
  it('should be a valid schema', () => {
    expect(() => buildSchema(typeDefs)).not.toThrow();
  });

  it('should have required types', () => {
    const schema = buildSchema(typeDefs);
    expect(schema.getType('User')).toBeDefined();
    expect(schema.getType('Query')).toBeDefined();
  });
});
```

**4. E2E with supertest:**
```javascript
const request = require('supertest');

it('should require authentication for me query', async () => {
  const res = await request(app)
    .post('/graphql')
    .send({
      query: '{ me { name } }',
    });

  expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
});
```

**As a Tech Lead, I mandate:**
- Minimum 80% coverage on resolvers.
- All mutations must have integration tests.
- Schema snapshot tests to catch unintended breaking changes.
- Performance tests for complex queries.

---

## 12. Tooling & Ecosystem

### Q31: What GraphQL server implementations have you worked with?

**Answer:**

| Library          | Highlights                                          | When to Use                            |
|------------------|------------------------------------------------------|----------------------------------------|
| Apollo Server    | Rich ecosystem, studio/monitoring, federation        | Enterprise, team-based projects        |
| GraphQL Yoga     | Lightweight, built on Envelop plugin system          | Flexible, plugin-heavy setups          |
| Mercurius        | Built for Fastify, excellent performance             | When using Fastify                     |
| Express-GraphQL  | Minimal, reference implementation                    | Learning, small projects               |
| Hasura           | Auto-generates GraphQL from Postgres                 | Rapid prototyping, CRUD-heavy apps     |
| Pothos           | Code-first schema builder (TypeScript)               | TypeScript-heavy projects              |

**My experience across 4 years:**
I started with `express-graphql`, moved to Apollo Server for most production systems due to its ecosystem (Apollo Studio, federation, client libraries), and have used Mercurius when the project was Fastify-based. For recent projects, I've been exploring GraphQL Yoga with Envelop for its modular plugin architecture.

---

### Q32: Code-first vs SDL-first schema definition — which do you prefer?

**Answer:**

**SDL-first (Schema Definition Language first):**
```graphql
# schema.graphql
type User {
  id: ID!
  name: String!
}

type Query {
  user(id: ID!): User
}
```
Then write resolvers separately.

**Code-first (Pothos / Nexus / TypeGraphQL):**
```typescript
// Pothos example
const User = builder.objectType('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    posts: t.field({
      type: [Post],
      resolve: (user, _, ctx) => ctx.db.posts.findMany({ where: { authorId: user.id } }),
    }),
  }),
});
```

**My preference: Code-first for TypeScript projects, SDL-first for polyglot teams.**

| Aspect          | SDL-first           | Code-first          |
|-----------------|---------------------|---------------------|
| Type safety     | Requires codegen    | Built-in            |
| Readability     | Easier for non-devs | Requires TS knowledge |
| Refactoring     | Manual              | IDE-assisted        |
| Schema sharing  | Easy (just the .graphql file) | Requires build step |

**Drawback of code-first:** Schema becomes tightly coupled to the implementation language. Makes it harder to share schema with frontend teams or external consumers.

---

## 13. GraphQL vs REST — Comparison & Drawbacks

### Q33: When would you NOT recommend GraphQL?

**Answer (critical for Tech Lead role):**

GraphQL is **not always the right choice**. I would not recommend it when:

1. **Simple CRUD API** — REST with OpenAPI is simpler, faster to build, and easier to cache.
2. **File upload heavy** — GraphQL file uploads are awkward (`multipart/form-data` spec is a workaround). REST handles this natively.
3. **API with mostly public, cacheable data** — REST + CDN is drastically more efficient. A news website's article API, for example, benefits more from REST's HTTP caching.
4. **Team lacks GraphQL experience** — The learning curve is real. A team of REST developers will be slower and make more mistakes with GraphQL initially.
5. **Microservices with simple API gateway needs** — A REST gateway with OpenAPI aggregation may suffice.
6. **Strict bandwidth constraints** — The GraphQL query language adds overhead to request size (the query itself).
7. **Real-time-only systems** — If the API is primarily WebSocket-based, a simpler protocol may be better.

---

### Q34: What are the major drawbacks of GraphQL?

**Answer:**

| Drawback                        | Explanation                                                               |
|---------------------------------|---------------------------------------------------------------------------|
| **HTTP caching is hard**        | Single POST endpoint breaks CDN caching out of the box                   |
| **Complexity overhead**         | Parsing, validation, type system add CPU cost per request                 |
| **Error handling is non-standard** | Always HTTP 200, monitoring tools need GraphQL awareness                |
| **File uploads**                | No native support; requires multipart spec workaround                    |
| **Overly flexible**             | Clients can craft expensive queries; requires safeguards                 |
| **Learning curve**              | SDL, resolvers, DataLoaders, client cache — steep for REST-only teams    |
| **N+1 by default**              | Without DataLoader, performance degrades rapidly                         |
| **Rate limiting is harder**     | One request ≠ one operation; need cost-based limiting                    |
| **Tooling maturity**            | REST tooling (Postman, Swagger) is more mature and widely adopted        |
| **Schema evolution**            | Removing fields is harder than REST (deprecation → removal lifecycle)    |
| **Debugging complexity**        | Single endpoint makes log correlation harder without tracing             |

---

## 14. Microservices & Federation

### Q35: What is Apollo Federation and how does it work?

**Answer:**
Apollo Federation lets you compose multiple GraphQL services (subgraphs) into a single unified schema (supergraph).

**Architecture:**
```
Client → Apollo Gateway/Router → [Users Subgraph, Posts Subgraph, Comments Subgraph]
```

**Subgraph example — Users service:**
```graphql
# Users subgraph
type User @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}

type Query {
  user(id: ID!): User
  me: User
}
```

**Subgraph example — Posts service (extends User):**
```graphql
# Posts subgraph
type User @key(fields: "id") {
  id: ID!
  posts: [Post!]!   # Extend User with posts
}

type Post @key(fields: "id") {
  id: ID!
  title: String!
  author: User!
}
```

**Key Federation concepts:**
- `@key` — Defines the entity's unique identifier for cross-service resolution.
- `__resolveReference` — Resolver that fetches an entity by its key when another service references it.
- `@external` — Marks a field as owned by another subgraph.
- `@requires` — Declares fields needed from other subgraphs before resolving.
- `@provides` — Declares additional fields this subgraph can resolve.

**Reference resolver:**
```javascript
const resolvers = {
  User: {
    __resolveReference: (user) => {
      return db.users.findUnique({ where: { id: user.id } });
    },
  },
};
```

**Drawback:** Federation adds latency (gateway must coordinate between services). It also introduces a single point of failure at the gateway unless properly load-balanced.

---

### Q36: Federation v1 vs v2 — what changed?

**Answer:**

| Feature                   | Federation v1             | Federation v2                |
|---------------------------|---------------------------|------------------------------|
| Directive syntax          | Custom (`@key`, `@external`) | Standard + `@link`         |
| Entity ownership          | Strict single owner       | Shared types with `@shareable` |
| Interface support         | Limited                   | Full interface entities       |
| Migration                 | N/A                       | Progressive, backward compat  |
| Value types               | Must be identical across subgraphs | `@shareable` allows flexibility |
| Router                    | Apollo Gateway (JS)       | Apollo Router (Rust, faster)  |

**v2 key additions:**
```graphql
extend schema @link(url: "https://specs.apollo.dev/federation/v2.0")

type Product @key(fields: "id") @shareable {
  id: ID!
  name: String!
  price: Float!   # Now multiple subgraphs can resolve this
}
```

---

## 15. Architecture & System Design (Tech Lead)

### Q37: How would you architect a GraphQL API for a large-scale e-commerce platform?

**Answer:**

```
                    ┌──────────────┐
                    │  CDN / Edge  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ API Gateway  │ (Auth, Rate Limiting, Logging)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Apollo Router│ (Federation v2)
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
   │   Users     │ │  Products   │ │   Orders    │
   │  Subgraph   │ │  Subgraph   │ │  Subgraph   │
   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
          │                │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
   │  User DB    │ │ Product DB  │ │  Order DB   │
   │ (Postgres)  │ │ (Postgres)  │ │ (Postgres)  │
   └─────────────┘ └─────────────┘ └─────────────┘
```

**Key decisions:**

1. **Federation v2** — Each domain team owns their subgraph independently.
2. **Apollo Router** (Rust-based) — Better performance than JS gateway.
3. **Separate concerns:**
   - API Gateway handles auth, rate limiting, CORS.
   - Apollo Router handles schema composition and query planning.
4. **Database per service** — Each subgraph has its own database.
5. **Event-driven communication** — Services communicate via events (Kafka/SNS), not direct calls:
   ```
   Order Created → Event → Inventory Service updates stock
                         → Notification Service sends email
   ```
6. **Caching strategy:**
   - Product catalog: aggressive Redis caching (5-15 min TTL).
   - User data: short-lived cache (1-5 min) or no cache.
   - Orders: no cache (always fresh).
7. **Monitoring:** Apollo Studio for schema analytics, Datadog/Grafana for infrastructure.

---

### Q38: How do you handle schema evolution and versioning?

**Answer:**
GraphQL avoids traditional versioning. Instead, I follow a **continuous evolution** approach:

**1. Deprecation lifecycle:**
```graphql
type User {
  name: String! @deprecated(reason: "Use firstName and lastName instead")
  firstName: String!
  lastName: String!
  fullName: String!  # New computed field
}
```

**2. Schema change governance (as Tech Lead):**
- **Schema review in PRs** — Every schema change needs review from API consumers.
- **Breaking change detection** using `graphql-inspector`:
  ```bash
  npx graphql-inspector diff old-schema.graphql new-schema.graphql
  ```
- **Schema registry** (Apollo Studio) — Track all schema versions and detect breaking changes before deployment.

**3. Safe migration pattern:**
- Add new field → Migrate clients → Deprecate old field → Wait 2-3 sprints → Remove old field.

**4. Schema changelog:**
Maintain a `CHANGELOG.md` for schema changes, especially in federated setups where multiple teams consume the schema.

**Drawback:** Without discipline, deprecated fields accumulate forever. I set hard deadlines for removal (e.g., 3 months after deprecation).

---

### Q39: How do you handle pagination in GraphQL?

**Answer:**
Three common approaches:

**1. Offset-based (simple but flawed):**
```graphql
type Query {
  users(limit: Int = 10, offset: Int = 0): [User!]!
}
```
- Simple to implement.
- **Drawback:** Skipping rows in the DB is slow for large offsets; results shift if data is inserted/deleted between pages.

**2. Cursor-based / Relay Connection (recommended):**
```graphql
type Query {
  users(first: Int, after: String, last: Int, before: String): UserConnection!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

Resolver implementation:
```javascript
const resolvers = {
  Query: {
    users: async (_, { first = 10, after }) => {
      const cursor = after ? decodeCursor(after) : null;
      
      const users = await db.users.findMany({
        take: first + 1, // Fetch one extra to check hasNextPage
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1, // Skip the cursor item itself
        }),
        orderBy: { id: 'asc' },
      });

      const hasNextPage = users.length > first;
      const edges = users.slice(0, first).map(user => ({
        node: user,
        cursor: encodeCursor(user.id),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
      };
    },
  },
};

function encodeCursor(id) {
  return Buffer.from(`cursor:${id}`).toString('base64');
}

function decodeCursor(cursor) {
  return Buffer.from(cursor, 'base64').toString('utf-8').replace('cursor:', '');
}
```

**3. Keyset-based (offset alternative for large datasets):**
```graphql
type Query {
  users(limit: Int = 10, afterId: ID): [User!]!
}
```

**My recommendation:** Relay-style connections for public APIs and client-facing apps; simple offset for internal admin tools where total count and page jumping are needed.

---

## 16. Team Leadership & Best Practices (Tech Lead)

### Q40: How would you introduce GraphQL to a team that only knows REST?

**Answer:**
I follow a phased approach:

**Phase 1 — Education (Week 1-2):**
- Workshop: GraphQL fundamentals (2-hour hands-on session).
- Pair each team member with a simple task (e.g., "add a new query").
- Share curated resources: official docs, How to GraphQL, Apollo tutorials.

**Phase 2 — Pilot (Week 3-6):**
- Pick a non-critical, greenfield feature or internal tool.
- Implement it in GraphQL alongside existing REST APIs (BFF pattern).
- The whole team participates — everyone writes at least one resolver.

**Phase 3 — Standards & Tooling (Week 4-8):**
- Establish team conventions (naming, error handling, pagination).
- Set up linting (`graphql-eslint`), schema validation, and CI checks.
- Create a shared DataLoader factory and base resolver patterns.

**Phase 4 — Gradual Migration (Ongoing):**
- New features are GraphQL-first.
- Existing REST endpoints are migrated only when touched for other reasons.
- Never a big-bang migration.

**Pitfalls to avoid:**
- Don't force GraphQL on everything — some endpoints are fine as REST.
- Don't let the most enthusiastic dev write all the resolvers — spread the knowledge.
- Don't skip the DataLoader conversation — N+1 issues will surface quickly.

---

### Q41: What coding standards and best practices would you enforce?

**Answer:**

**Schema conventions:**
```
- Types: PascalCase (User, BlogPost)
- Fields: camelCase (firstName, createdAt)
- Enums: SCREAMING_SNAKE_CASE (ADMIN, PENDING_REVIEW)
- Input types: suffixed with "Input" (CreateUserInput)
- Mutation payloads: suffixed with "Payload" (CreateUserPayload)
- Connection types: suffixed with "Connection" / "Edge"
```

**Resolver standards:**
```javascript
// ✅ GOOD — Thin resolvers, business logic in services
const resolvers = {
  Mutation: {
    createUser: (_, { input }, { services }) => {
      return services.userService.createUser(input);
    },
  },
};

// ❌ BAD — Fat resolvers with business logic inline
const resolvers = {
  Mutation: {
    createUser: async (_, { input }, { db }) => {
      const existing = await db.users.findFirst({ where: { email: input.email } });
      if (existing) throw new Error('Email exists');
      const hashed = await bcrypt.hash(input.password, 10);
      const user = await db.users.create({ data: { ...input, password: hashed } });
      await sendWelcomeEmail(user.email);
      return user;
    },
  },
};
```

**Enforced via tooling:**
- `graphql-eslint` for schema and operation linting.
- `graphql-inspector` in CI to catch breaking changes.
- Schema snapshot tests.
- Required DataLoader usage for any `hasMany` relationship.
- Mandatory mutation payload types (no bare types from mutations).

---

### Q42: How do you handle monitoring and observability for GraphQL?

**Answer:**

**1. Structured logging:**
```javascript
const loggingPlugin = {
  async requestDidStart(requestContext) {
    const start = Date.now();
    const operationName = requestContext.request.operationName;
    
    return {
      async willSendResponse(ctx) {
        const duration = Date.now() - start;
        logger.info({
          operationName,
          duration,
          hasErrors: !!ctx.errors?.length,
          complexity: ctx.metrics?.queryComplexity,
          userId: ctx.contextValue?.user?.id,
        });
      },
      async didEncounterErrors(ctx) {
        for (const error of ctx.errors) {
          logger.error({
            operationName,
            error: error.message,
            path: error.path,
            code: error.extensions?.code,
          });
        }
      },
    };
  },
};
```

**2. Key metrics to track:**
- Query latency (p50, p95, p99) per operation name.
- Error rate per operation.
- Resolver execution time (identify slow resolvers).
- Query complexity distribution.
- Cache hit rate (DataLoader, Redis).
- Active subscription count.

**3. Tools:**
- Apollo Studio (schema analytics, field usage, deprecation tracking).
- Grafana + Prometheus for custom metrics.
- Datadog APM with GraphQL integration.
- OpenTelemetry for distributed tracing across federated subgraphs.

---

## 17. Node.js + GraphQL Integration

### Q43: How does the Node.js event loop interact with GraphQL execution?

**Answer:**
This is where my 10+ years of Node.js experience directly applies.

GraphQL resolvers are essentially async functions running on the Node.js event loop. Understanding this is critical for performance:

1. **DataLoader batching depends on the event loop:**
   DataLoader collects `.load()` calls within a single tick and dispatches them together in the next tick via `process.nextTick()`. This is why it works — all resolvers at one level fire synchronously, queue their loads, and DataLoader batches them.

2. **Resolver parallelism:**
   ```javascript
   // Query fields resolve in parallel (Promise.all under the hood)
   query {
     users { ... }    // Starts fetching
     posts { ... }    // Starts fetching concurrently
     stats { ... }    // Starts fetching concurrently
   }
   ```
   
3. **CPU-bound resolvers block everything:**
   ```javascript
   // ❌ BAD — blocks the event loop
   const resolvers = {
     Query: {
       heavyComputation: () => {
         // Synchronous 500ms computation blocks ALL requests
         return computeExpensiveThing();
       },
     },
   };
   
   // ✅ GOOD — offload to worker thread
   const { Worker } = require('worker_threads');
   
   const resolvers = {
     Query: {
       heavyComputation: () => {
         return new Promise((resolve, reject) => {
           const worker = new Worker('./heavy-computation.js');
           worker.on('message', resolve);
           worker.on('error', reject);
         });
       },
     },
   };
   ```

4. **Stream handling for large datasets:**
   ```javascript
   // Use async iterators for large result sets
   async *generateReport() {
     const cursor = db.orders.findManyCursor({ batchSize: 100 });
     for await (const batch of cursor) {
       yield batch;
     }
   }
   ```

---

### Q44: How do you handle file uploads in a Node.js GraphQL API?

**Answer:**

**Option 1: graphql-upload (multipart request spec):**
```javascript
const { GraphQLUpload } = require('graphql-upload');

const typeDefs = `
  scalar Upload

  type Mutation {
    uploadAvatar(file: Upload!): String!
  }
`;

const resolvers = {
  Upload: GraphQLUpload,
  Mutation: {
    uploadAvatar: async (_, { file }) => {
      const { createReadStream, filename, mimetype } = await file;
      
      const stream = createReadStream();
      const path = `./uploads/${Date.now()}-${filename}`;
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(fs.createWriteStream(path))
          .on('finish', resolve)
          .on('error', reject);
      });
      
      return path;
    },
  },
};
```

**Option 2 (Recommended): Signed URL approach:**
```graphql
type Mutation {
  generateUploadUrl(filename: String!, contentType: String!): UploadUrl!
}

type UploadUrl {
  uploadUrl: String!    # S3 presigned URL
  fileUrl: String!      # Final accessible URL
}
```

```javascript
const resolvers = {
  Mutation: {
    generateUploadUrl: async (_, { filename, contentType }) => {
      const key = `uploads/${uuidv4()}-${filename}`;
      const uploadUrl = await s3.getSignedUrl('putObject', {
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: contentType,
        Expires: 300, // 5 minutes
      });
      
      return {
        uploadUrl,
        fileUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
      };
    },
  },
};
```

**Why I prefer Option 2:**
- GraphQL server doesn't handle binary data (keeps it fast).
- Direct client-to-S3 upload offloads bandwidth.
- Works with any CDN.
- Better for large files.

**Drawback of Option 1:** The `graphql-upload` library has had maintenance issues and doesn't work with all GraphQL servers. It also adds multipart handling complexity to the GraphQL layer.

---

## 18. Advanced & Tricky Questions

### Q45: What is query whitelisting and when should you use it?

**Answer:**
Query whitelisting (also called "persisted queries" or "trusted documents") restricts the server to only execute pre-approved queries.

```javascript
// At build time, extract all queries from the client codebase
const allowedQueries = {
  'abc123hash': 'query GetUser($id: ID!) { user(id: $id) { name email } }',
  'def456hash': 'mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { id } }',
};

// At runtime, only execute if hash matches
app.post('/graphql', (req, res) => {
  const { extensions } = req.body;
  const query = allowedQueries[extensions?.persistedQuery?.sha256Hash];
  
  if (!query) {
    return res.status(400).json({ error: 'Query not allowed' });
  }
  
  // Execute the pre-approved query
});
```

**When to use:**
- Public-facing APIs with high security requirements.
- Mobile apps where you control the client.
- After your API stabilizes.

**Drawback:** Eliminates one of GraphQL's key benefits — client flexibility. Not suitable for APIs consumed by third parties or during active development.

---

### Q46: Explain the concept of schema stitching vs federation.

**Answer:**

**Schema Stitching (older approach):**
- Merges multiple schemas into one at the gateway level.
- Gateway manually resolves cross-schema references using delegating resolvers.
- Centralized — the gateway "knows" about all services.

```javascript
const { stitchSchemas } = require('@graphql-tools/stitch');

const gatewaySchema = stitchSchemas({
  subschemas: [
    { schema: userSchema, executor: userExecutor },
    { schema: postSchema, executor: postExecutor },
  ],
  typeMergingOptions: {
    User: {
      selectionSet: '{ id }',
      fieldName: 'userById',
      args: (user) => ({ id: user.id }),
    },
  },
});
```

**Federation (modern approach):**
- Each subgraph declares its own entities and how they extend other entities.
- The router/gateway composes schemas automatically.
- Decentralized — each service is self-contained.

| Aspect          | Schema Stitching           | Federation                |
|-----------------|----------------------------|---------------------------|
| Ownership       | Gateway team owns composition | Each team owns their subgraph |
| Complexity      | Gateway becomes complex     | Distributed complexity    |
| Coupling        | Gateway knows all services  | Services are independent  |
| Tooling         | Manual                      | Apollo Router, Studio     |
| Performance     | Variable                    | Optimized query planning  |

**My recommendation:** Federation for new projects. Schema stitching is considered a legacy approach but may still be appropriate for simple 2-3 service setups.

---

### Q47: How does the `@defer` and `@stream` directive work?

**Answer:**
These are incremental delivery directives (part of the GraphQL spec working draft).

**`@defer`** — Tells the server to return a field later, without blocking the initial response:
```graphql
query {
  user(id: "1") {
    name         # Returns immediately
    email        # Returns immediately
    ... @defer {
      analytics {  # Returns in a subsequent chunk
        totalPosts
        avgLikes
      }
    }
  }
}
```

**`@stream`** — Incrementally delivers items in a list:
```graphql
query {
  feed @stream(initialCount: 5) {
    title
    summary
  }
}
# First response: 5 items
# Subsequent chunks: remaining items one at a time
```

**Transport:** Uses chunked transfer encoding (multipart HTTP response) or WebSocket.

**Use cases:**
- Slow-to-compute fields (analytics, recommendations).
- Large lists where initial items matter (feeds, search results).
- Perceived performance improvement for complex queries.

**Drawback:** Limited server and client support. Apollo Server doesn't fully support these yet. Works best with GraphQL Yoga + urql or Relay.

---

### Q48: What is the difference between `graphql-ws` and `subscriptions-transport-ws`?

**Answer:**

| Feature                      | `subscriptions-transport-ws` (legacy) | `graphql-ws` (modern)        |
|------------------------------|----------------------------------------|------------------------------|
| Status                       | Deprecated, unmaintained               | Actively maintained          |
| Protocol                     | Custom WebSocket sub-protocol          | `graphql-transport-ws`       |
| Spec compliance              | Non-standard                           | Follows the GraphQL over WebSocket spec |
| Features                     | Basic pub/sub                          | Lazy connections, proper error handling, ping/pong |
| Server support               | Apollo Server v2/v3                    | Any (standalone, Express, Yoga, etc.) |

**Always use `graphql-ws`** for new projects. If migrating, update both server and client together since the protocols are incompatible.

---

## 19. Scenario-Based Questions

### Q49: A query that was fast in development is slow in production. How do you debug it?

**Answer:**

**Step 1: Identify the query.**
Check Apollo Studio / monitoring for the operation name, latency percentiles, and frequency.

**Step 2: Enable resolver tracing.**
Add field-level timing to identify the slow resolver(s).

**Step 3: Check for N+1.**
Look at DB query logs. If you see repeated similar queries, a DataLoader is missing or misconfigured.

**Step 4: Analyze the query pattern.**
```javascript
// Use the info parameter to log what's being requested
logger.info({
  operation: info.operation.name?.value,
  depth: calculateDepth(info),
  fields: extractFields(info),
});
```

**Step 5: Common production-specific issues:**
- Missing database indexes (the dataset is larger in production).
- DataLoader batch size — if batching 10,000 IDs, the `WHERE IN (...)` clause may be slow.
- Resolver computing something that should be cached.
- Nested pagination without limits (e.g., all posts of all users).

**Step 6: Fix and verify.**
- Add missing DataLoader.
- Add database indexes.
- Add Redis cache for expensive computations.
- Add query complexity limits to prevent the query pattern altogether.

---

### Q50: Two teams need to add fields to the same type in a federated setup. How do you handle conflicts?

**Answer:**

**Scenario:** The Users team and the Orders team both want to add a `recentActivity` field to the `User` type.

**Resolution process (as Tech Lead):**

1. **Schema review meeting** — Both teams present their use case.
2. **Determine ownership:** 
   - If the data comes from one service → that service owns the field.
   - If it requires data from both → consider a new subgraph or a computed field.
3. **Federation v2 `@shareable`** — If both services can resolve the same field:
   ```graphql
   # Users subgraph
   type User @key(fields: "id") {
     id: ID!
     recentActivity: [Activity!]! @shareable
   }
   ```
4. **If the field means different things** → rename for clarity:
   ```graphql
   # Users subgraph
   type User @key(fields: "id") {
     recentLogins: [LoginActivity!]!
   }
   
   # Orders subgraph  
   type User @key(fields: "id") {
     recentOrders: [Order!]!
   }
   ```

5. **Governance rule I enforce:** Every entity field addition requires a schema RFC (Request for Comments) — a short document explaining the field name, type, which subgraph owns it, and why.

---

### Q51: Your GraphQL API is being DDoS-ed with complex queries. What do you do?

**Answer:**

**Immediate response:**
1. Enable query complexity rejection (if not already active).
2. Block offending IPs at the API gateway / WAF level.
3. Enable persisted-query-only mode if supported.

**Long-term prevention stack:**
```javascript
const server = new ApolloServer({
  validationRules: [
    depthLimit(10),                          // Max depth
    createComplexityLimitRule(1000),          // Max cost
    createAliasLimitRule(30),                 // Max aliases
  ],
  plugins: [
    // Request timeout
    {
      requestDidStart() {
        return {
          async executionDidStart() {
            const timeout = setTimeout(() => {
              throw new Error('Query timeout exceeded');
            }, 10000); // 10 second max
            return { willResolveField() { clearTimeout(timeout); } };
          },
        };
      },
    },
  ],
});
```

**Defense layers:**
1. WAF (Web Application Firewall) — IP-based rate limiting.
2. API Gateway — Token-bucket rate limiting per API key.
3. GraphQL layer — Cost-based limiting, depth limiting, alias limiting.
4. Persisted queries — Only allow pre-approved queries.
5. Timeout — Kill queries that take too long.

---

## 20. Coding Challenges

### Challenge 1: Implement a DataLoader with proper batching

```javascript
// Implement a DataLoader for fetching users by their IDs
// The batch function should:
// 1. Accept an array of user IDs
// 2. Fetch all users in a single DB query
// 3. Return results in the SAME ORDER as input IDs
// 4. Return null for IDs that don't exist

const DataLoader = require('dataloader');

const userLoader = new DataLoader(async (userIds) => {
  // Single query for all IDs
  const users = await db.query(
    'SELECT * FROM users WHERE id = ANY($1)',
    [userIds]
  );
  
  // Create a map for O(1) lookup
  const userMap = new Map(users.map(u => [u.id, u]));
  
  // Return in the same order, with null for missing IDs
  return userIds.map(id => userMap.get(id) || null);
});

// Usage in resolver
const resolvers = {
  Post: {
    author: (post) => userLoader.load(post.authorId),
  },
};
```

---

### Challenge 2: Implement cursor-based pagination

```javascript
// Implement a resolver for cursor-based pagination
const resolvers = {
  Query: {
    posts: async (_, { first = 10, after, filter }) => {
      const decodedCursor = after
        ? JSON.parse(Buffer.from(after, 'base64').toString('utf-8'))
        : null;

      const where = {
        ...(filter?.published !== undefined && { published: filter.published }),
        ...(decodedCursor && {
          OR: [
            { createdAt: { lt: decodedCursor.createdAt } },
            {
              createdAt: { equals: decodedCursor.createdAt },
              id: { lt: decodedCursor.id },
            },
          ],
        }),
      };

      const posts = await db.posts.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: first + 1, // Fetch one extra
      });

      const hasNextPage = posts.length > first;
      const nodes = posts.slice(0, first);

      const edges = nodes.map((post) => ({
        node: post,
        cursor: Buffer.from(
          JSON.stringify({ id: post.id, createdAt: post.createdAt })
        ).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount: await db.posts.count({ where: { ...filter } }),
      };
    },
  },
};
```

---

### Challenge 3: Implement a custom scalar type

```javascript
const { GraphQLScalarType, Kind } = require('graphql');

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'A valid ISO 8601 date-time string',

  // Server → Client (serialization)
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new TypeError(`Invalid date: ${value}`);
      return date.toISOString();
    }
    throw new TypeError(`Cannot serialize ${typeof value} as DateTime`);
  },

  // Client → Server (from variables)
  parseValue(value) {
    if (typeof value !== 'string') {
      throw new TypeError('DateTime must be a string');
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new TypeError(`Invalid DateTime: ${value}`);
    }
    return date;
  },

  // Client → Server (from inline query literals)
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError('DateTime must be a string');
    }
    const date = new Date(ast.value);
    if (isNaN(date.getTime())) {
      throw new TypeError(`Invalid DateTime: ${ast.value}`);
    }
    return date;
  },
});

module.exports = { DateTime: DateTimeScalar };
```

---

### Challenge 4: Implement field-level authorization middleware

```javascript
const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver } = require('graphql');

function authDirectiveTransformer(schema, directiveName = 'auth') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
      if (!authDirective) return fieldConfig;

      const { requires: requiredRole } = authDirective;
      const originalResolve = fieldConfig.resolve || defaultFieldResolver;

      fieldConfig.resolve = async function (source, args, context, info) {
        // Check authentication
        if (!context.user) {
          throw new AuthenticationError('You must be logged in');
        }

        // Check authorization (role hierarchy)
        const roleHierarchy = { USER: 1, MODERATOR: 2, ADMIN: 3 };
        const userLevel = roleHierarchy[context.user.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        if (userLevel < requiredLevel) {
          throw new ForbiddenError(
            `Requires ${requiredRole} role. You have ${context.user.role}.`
          );
        }

        return originalResolve(source, args, context, info);
      };

      return fieldConfig;
    },
  });
}
```

---

### Challenge 5: Implement a subscription with filtering

```javascript
const { PubSub, withFilter } = require('graphql-subscriptions');
const pubsub = new PubSub();

const EVENTS = {
  MESSAGE_SENT: 'MESSAGE_SENT',
  USER_TYPING: 'USER_TYPING',
};

const resolvers = {
  Subscription: {
    messageSent: {
      subscribe: withFilter(
        // Iterator function
        () => pubsub.asyncIterator(EVENTS.MESSAGE_SENT),
        // Filter function — return true to send to this subscriber
        (payload, variables, context) => {
          const { channelId } = variables;
          const message = payload.messageSent;
          
          // Only send if:
          // 1. Message is in the subscribed channel
          // 2. Message is not from the subscriber themselves
          return (
            message.channelId === channelId &&
            message.authorId !== context.user.id
          );
        }
      ),
    },
    
    userTyping: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(EVENTS.USER_TYPING),
        (payload, variables) => {
          return payload.userTyping.channelId === variables.channelId;
        }
      ),
    },
  },

  Mutation: {
    sendMessage: async (_, { input }, { user, pubsub }) => {
      const message = await db.messages.create({
        data: { ...input, authorId: user.id },
      });

      await pubsub.publish(EVENTS.MESSAGE_SENT, {
        messageSent: message,
      });

      return message;
    },
  },
};
```

---

## Quick Reference — Key Points for Interview Day

**Your story:** "I've been working with Node.js for 10+ years and adopted GraphQL 4 years ago when we needed a flexible API layer for our multi-platform application (web, mobile, and internal tools). I've since led GraphQL adoption across teams, designed federated architectures, and established best practices for schema design, performance, and security."

**Top talking points to weave into answers:**
- DataLoader implementation and N+1 resolution — concrete production experience.
- Federation architecture design and team coordination.
- Performance monitoring with Apollo Studio / custom tracing.
- Schema governance process (reviews, breaking change detection).
- Security hardening (depth limits, complexity analysis, persisted queries).
- Migration strategy from REST to GraphQL.

**Red flags to avoid saying:**
- "GraphQL is always better than REST" — shows lack of nuance.
- "I haven't dealt with the N+1 problem" — it's the first issue everyone hits.
- "We use the in-memory PubSub in production" — it doesn't scale.
- "We don't have schema validation in CI" — shows lack of engineering rigor.

---

> * Apllo Client Question ans
# GraphQL + React (Apollo Client) — Complete Interview Guide

> **For 12+ Year Experienced Developers** — Definitions, Questions & Answers covering every concept an interviewer would explore.

---

## 1. GraphQL — Core Definitions

| Term | Definition |
|------|-----------|
| **GraphQL** | A query language for APIs developed by Facebook (2015). Unlike REST, it lets the client request exactly the fields it needs from a single endpoint. It uses a strongly typed schema to define the API surface. |
| **Schema** | The contract between client and server. It defines types, queries, mutations, and subscriptions using SDL (Schema Definition Language). |
| **SDL** | Schema Definition Language — the syntax used to write a GraphQL schema. |
| **Query** | A read operation to fetch data. |
| **Mutation** | A write operation to create, update, or delete data. |
| **Subscription** | A real-time operation that maintains a persistent connection (usually WebSocket) and pushes updates to the client. |
| **Resolver** | A server-side function that determines how to fetch or compute the data for a single field in the schema. |
| **Fragment** | A reusable unit of fields that can be shared across multiple queries to avoid repetition. |
| **Directive** | An annotation that modifies query execution. Built-in: `@include(if:)`, `@skip(if:)`, `@deprecated`. Custom: `@client`, `@defer`, `@export`. |
| **Introspection** | GraphQL's ability to describe its own schema. Tools like GraphiQL and Apollo DevTools use introspection to provide autocomplete and documentation. |
| **Operation Name** | An explicit name given to a query/mutation for debugging, logging, and persisted queries. |
| **Variable** | A dynamic value passed into a GraphQL operation, replacing hardcoded arguments. Defined with `$` syntax. |
| **Alias** | Renaming a field in the response to avoid conflicts. |
| **Inline Fragment** | Used for conditional field selection on union/interface types. |
| **Union Type** | A type that can be one of several object types: `union SearchResult = User \| Post \| Comment` |
| **Interface** | An abstract type that defines a set of fields that multiple types must implement. |
| **Scalar** | A primitive type. Built-in: `Int`, `Float`, `String`, `Boolean`, `ID`. Custom scalars like `DateTime`, `JSON` can be defined. |
| **Enum** | A type restricted to a specific set of values: `enum Role { ADMIN USER GUEST }` |
| **Input Type** | A special type used for mutation/query arguments. |
| **Non-null (`!`)** | Indicates a field can never return null. `String!` means the field must return a string. |

### SDL Examples

```graphql
type User {
  id: ID!
  name: String!
  posts: [Post!]!
}

fragment UserFields on User {
  id
  name
  email
}

query GetUserProfile($id: ID!) {
  user(id: $id) { name }
}

# Alias
{
  adminUser: user(role: ADMIN) { name }
  regularUser: user(role: USER) { name }
}

# Inline Fragment
{
  search(term: "hello") {
    ... on User { name email }
    ... on Post { title body }
  }
}

# Input Type
input CreateUserInput {
  name: String!
  email: String!
}
```

---

## 2. Apollo Client — Definitions

| Term | Definition |
|------|-----------|
| **Apollo Client** | The most popular GraphQL client for JavaScript/React. It handles data fetching, caching, state management, and UI updates. |
| **ApolloProvider** | A React context provider that makes the Apollo Client instance available to all components in the tree. |
| **InMemoryCache** | Apollo's default normalized cache. It stores GraphQL results as a flat lookup table of objects identified by `__typename:id`. |
| **Normalized Cache** | A caching strategy where each object is stored once by its unique identity. References (`{ __ref: 'User:123' }`) link objects, so updating one object automatically reflects everywhere it's referenced. |
| **Apollo Link** | A modular middleware system for the network layer. Each link can inspect, modify, or handle a GraphQL operation before passing it to the next link. Think of it like Express middleware but for GraphQL requests. |
| **HttpLink** | The terminating link that sends GraphQL operations over HTTP to your server. |
| **Apollo DevTools** | A browser extension for inspecting queries, mutations, cache state, and active subscriptions in real time. |
| **`__typename`** | A meta-field automatically added by Apollo to every object in a response. It holds the GraphQL type name and is used for cache normalization. |

---

## 3. Apollo Client Setup & Configuration

### Q: How do you set up Apollo Client in a React app?

```jsx
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});

const App = () => (
  <ApolloProvider client={client}>
    <MyApp />
  </ApolloProvider>
);
```

### Q: What is Apollo Link? How do you compose links?

```js
import { from, HttpLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) graphQLErrors.forEach(({ message }) => console.error(message));
  if (networkError) console.error(`Network error: ${networkError}`);
});

const retryLink = new RetryLink({ delay: { initial: 300 }, attempts: { max: 3 } });
const httpLink = new HttpLink({ uri: '/graphql' });

const link = from([errorLink, retryLink, httpLink]);
```

### Link Types & Definitions

| Link | Definition |
|------|-----------|
| **ErrorLink** | Catches GraphQL and network errors globally. Used for logging, toast notifications, or auth redirects. |
| **RetryLink** | Automatically retries failed operations with configurable delay and max attempts. |
| **AuthLink / `setContext`** | Injects authentication headers into every outgoing request. |
| **BatchHttpLink** | Groups multiple operations into a single HTTP request to reduce network overhead. |
| **SplitLink (`split`)** | Routes operations to different links based on a condition (e.g., queries go to HTTP, subscriptions go to WebSocket). |
| **Terminating Link** | The last link in the chain that actually sends the request (e.g., `HttpLink`, `BatchHttpLink`). |
| **Non-Terminating Link** | A link that processes the operation and passes it forward (e.g., `ErrorLink`, `RetryLink`). |

### Q: How do you add auth headers to every request?

```js
import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    authorization: `Bearer ${localStorage.getItem('token')}`,
  },
}));

const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});
```

---

## 4. Fetch Policies — Definitions & Usage

**Fetch Policy**: A strategy that tells Apollo where to look for data (cache, network, or both) and in what order.

| Policy | Definition | Use Case |
|--------|-----------|----------|
| `cache-first` | Read cache first; only fetch from network on cache miss. **Default.** | Stable data that rarely changes (user profile, config) |
| `cache-and-network` | Immediately return cached data, then silently refetch from network and update. | Dashboards, lists — fast initial load + freshness |
| `network-only` | Always fetch from network, ignore cache for reading but still write result to cache. | Post-mutation pages, data that must be fresh |
| `cache-only` | Read only from cache, never make a network request. Errors if data isn't cached. | Offline mode, data you know is already fetched |
| `no-cache` | Always fetch from network. Does NOT write results to cache at all. | Sensitive or one-off data (payment tokens) |
| `standby` | Like `cache-first`, but the query does NOT automatically re-execute when cache changes. | Dependent/inactive queries that you trigger manually |

### Q: When would you change fetch policy dynamically?

After a mutation, you might refetch a query with `network-only` to guarantee fresh data:

```jsx
refetch(); // uses the component's current fetchPolicy
// or override:
refetch({ fetchPolicy: 'network-only' });
```

---

## 5. Error Policy — Definitions

**Error Policy**: Controls how Apollo treats GraphQL errors relative to data.

| Policy | Definition | Use Case |
|--------|-----------|----------|
| `none` (default) | If any GraphQL error is returned, `data` is set to `undefined` and only `error` is populated. All-or-nothing. | Standard queries where partial data is meaningless |
| `all` | Both `data` (partial) and `error` can be populated simultaneously. | Schema with nullable fields — render whatever succeeded |
| `ignore` | GraphQL errors are silently discarded. Only `data` is returned. | Non-critical errors |

```jsx
const { data, error } = useQuery(GET_DASHBOARD, {
  errorPolicy: 'all',
});
// data.userProfile may exist even if data.analytics errored
```

---

## 6. Core Hooks

### `useQuery`

**Definition**: A React hook that executes a GraphQL query when the component mounts and re-renders the component when the result changes. It automatically subscribes to cache updates.

```jsx
const {
  data,            // The query result data
  loading,         // true while the request is in-flight
  error,           // ApolloError object if something failed
  refetch,         // Function to manually re-execute the query
  fetchMore,       // Function for pagination (fetches additional data)
  startPolling,    // Start polling at an interval (in ms)
  stopPolling,     // Stop polling
  subscribeToMore, // Attach a subscription that merges into this query's data
  networkStatus,   // Fine-grained loading state enum (requires notifyOnNetworkStatusChange)
  previousData,    // The last successful data (useful to show stale data during refetch)
  client,          // The ApolloClient instance
} = useQuery(GET_USERS, {
  variables: { limit: 10 },
  fetchPolicy: 'cache-and-network',
  pollInterval: 5000,
  skip: !isReady,
  notifyOnNetworkStatusChange: true,
  onCompleted: (data) => {},
  onError: (error) => {},
  context: { headers: { 'X-Custom': 'value' } },
  errorPolicy: 'all',
});
```

#### Key Options Defined

| Option | Definition |
|--------|-----------|
| `variables` | Dynamic arguments passed to the query. |
| `skip` | A boolean. When `true`, the query does not execute at all. Useful for conditional queries. |
| `pollInterval` | Milliseconds between automatic refetches. Simplest form of real-time data. |
| `notifyOnNetworkStatusChange` | When `true`, the component re-renders on every `networkStatus` change (loading, refetching, polling, etc.), not just on data/error changes. |
| `context` | Custom metadata passed along the link chain. Common use: per-query headers. |
| `previousData` | Holds the last successful `data` value. Prevents layout shift when you're refetching and `data` temporarily becomes `undefined`. |

#### NetworkStatus Enum

| Value | Meaning |
|-------|---------|
| 1 | `loading` — first load |
| 2 | `setVariables` — variables changed |
| 3 | `fetchMore` — pagination fetch |
| 4 | `refetch` — manual refetch |
| 6 | `poll` — polling refetch |
| 7 | `ready` — data is available |
| 8 | `error` — error occurred |

### Q: How do you handle loading/error states in production?

```jsx
function UserList() {
  const { data, loading, error, previousData, networkStatus, refetch } = useQuery(GET_USERS, {
    notifyOnNetworkStatusChange: true,
  });

  const users = data?.users ?? previousData?.users ?? [];
  const isRefetching = networkStatus === NetworkStatus.refetch;

  if (loading && !previousData) return <Skeleton />;
  if (error) return <ErrorBoundary error={error} retry={() => refetch()} />;

  return (
    <div style={{ opacity: isRefetching ? 0.6 : 1 }}>
      {users.map(u => <UserCard key={u.id} user={u} />)}
    </div>
  );
}
```

---

### `useLazyQuery`

**Definition**: A variant of `useQuery` that does NOT execute on mount. Instead, it returns a trigger function that you call manually. Ideal for user-initiated actions like search, filter, or form submission.

```jsx
const [searchUsers, { data, loading, called, error }] = useLazyQuery(SEARCH_USERS);

const handleSearch = (term) => {
  searchUsers({ variables: { term } });
};
```

- **`called`**: Boolean indicating whether the query has been triggered at least once.

### Q: `useLazyQuery` vs `useQuery({ skip })` — when to use which?

| Approach | Style | Best For |
|----------|-------|----------|
| `useLazyQuery` | Imperative — you call a function | Event-driven triggers (button click, form submit) |
| `useQuery({ skip })` | Declarative — runs automatically when condition changes | Dependent data (run query B when query A finishes) |

---

### `useMutation`

**Definition**: A React hook that returns a mutate function and a result object. Unlike `useQuery`, it does NOT execute on mount — you call the function explicitly.

```jsx
const [createTodo, { data, loading, error, called, reset }] = useMutation(CREATE_TODO);
```

- **`reset`**: Resets `data`, `error`, and `called` back to their initial state. Useful for forms that need to be reused.

### Q: Complete mutation with optimistic UI, cache update, and error handling

```jsx
const [createTodo, { loading }] = useMutation(CREATE_TODO, {
  optimisticResponse: {
    createTodo: {
      __typename: 'Todo',
      id: `temp-${Date.now()}`,
      text: newTodoText,
      completed: false,
    },
  },

  update(cache, { data: { createTodo } }) {
    cache.modify({
      fields: {
        todos(existingTodos = []) {
          const newTodoRef = cache.writeFragment({
            data: createTodo,
            fragment: gql`
              fragment NewTodo on Todo { id text completed }
            `,
          });
          return [...existingTodos, newTodoRef];
        },
      },
    });
  },

  refetchQueries: [{ query: GET_TODO_COUNT }],

  onError(err) { toast.error(err.message); },
  onCompleted(data) { toast.success('Created!'); },
});
```

#### Key Mutation Concepts Defined

| Concept | Definition |
|---------|-----------|
| **Optimistic Response** | A fake, instant result applied to the cache immediately before the server responds. If the server returns an error, Apollo automatically rolls back the optimistic data. |
| **`update` function** | A callback that gives you direct access to the cache after the mutation completes. You use it to manually insert, modify, or remove cache entries. |
| **`refetchQueries`** | An array of queries to re-execute after the mutation. Simpler than manual cache updates but causes extra network requests. Can be `'active'` to refetch all active queries. |
| **`awaitRefetchQueries`** | When `true`, the mutation's promise doesn't resolve until all refetched queries have completed. |

### Q: `update` vs `refetchQueries` — when to use which?

| Approach | Best When | Trade-off |
|----------|-----------|-----------|
| `update` | You know the exact shape of the change | Zero extra network requests. More code. |
| `refetchQueries` | Mutation's impact is complex (sorts, aggregations, filters on server) | Less code, but causes network round trips. |
| **Both** | Hybrid — update cache immediately for speed, then refetch for server reconciliation | Best UX, most code. |

---

### `useSubscription`

**Definition**: A hook that establishes a persistent connection (WebSocket) to receive real-time updates from the server.

#### Setup — WebSocket + HTTP Split

```js
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: { authToken: getToken() },
}));

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,   // subscriptions go here
  httpLink, // queries/mutations go here
);
```

```jsx
const { data, loading, error } = useSubscription(MESSAGE_ADDED, {
  variables: { chatId },
  onData: ({ data }) => playNotificationSound(),
});
```

### Q: `useSubscription` vs `subscribeToMore`?

| Hook | Use Case |
|------|----------|
| `useSubscription` | Standalone. Independent real-time data (notifications, live scores). |
| `subscribeToMore` | Returned from `useQuery`. Subscription data merged into an existing query's cache result (new messages appended to a chat list). |

```jsx
const { data, subscribeToMore } = useQuery(GET_MESSAGES, { variables: { chatId } });

useEffect(() => {
  const unsubscribe = subscribeToMore({
    document: MESSAGE_ADDED_SUB,
    variables: { chatId },
    updateQuery: (prev, { subscriptionData }) => ({
      messages: [...prev.messages, subscriptionData.data.messageAdded],
    }),
  });
  return () => unsubscribe();
}, [chatId]);
```

---

### `useFragment`

**Definition**: A hook (Apollo Client 3.8+) that subscribes a component to a specific fragment in the cache without executing a query. It reads data directly from the normalized cache by reference.

```jsx
const { data, complete } = useFragment({
  fragment: gql`
    fragment UserAvatar on User { id name avatarUrl }
  `,
  from: { __typename: 'User', id: userId },
});
```

- **`complete`**: Boolean indicating whether all fields in the fragment are present in the cache.

#### Why It Matters for Senior Developers

- Enables **fragment colocation** (Relay-style) where each component declares exactly what data it needs.
- **Minimizes re-renders** — the component only re-renders when the specific fields in its fragment change, not when any part of the parent query changes.
- **Eliminates prop drilling** — components read their own data from cache.

---

### `useReactiveVar`

**Definition**: A hook that subscribes to an Apollo **reactive variable** and re-renders the component whenever the variable's value changes.

**Reactive Variable (`makeVar`)**: A container for local (client-side) state that lives outside the cache but integrates with Apollo's reactivity system.

```jsx
import { makeVar, useReactiveVar } from '@apollo/client';

export const cartItemsVar = makeVar([]);           // create
export const isDarkModeVar = makeVar(false);

function Cart() {
  const cartItems = useReactiveVar(cartItemsVar);  // subscribe
  return <span>Items: {cartItems.length}</span>;
}

// Update from anywhere:
cartItemsVar([...cartItemsVar(), newItem]);         // update
```

#### Why Use Reactive Variables Over React State or Context?

- They work **outside React components** (in link chains, utility functions).
- They integrate with Apollo's cache via type policies.
- No provider/context boilerplate.
- Any component using `useReactiveVar` re-renders automatically.

---

### `useApolloClient`

**Definition**: A hook that returns the `ApolloClient` instance from context. Use it when you need direct cache access or to run imperative operations outside of the declarative hook pattern.

```jsx
const client = useApolloClient();

const handleLogout = () => {
  localStorage.removeItem('token');
  client.resetStore();  // clears cache and refetches all active queries
  // or client.clearStore() — clears cache without refetching
};
```

---

## 7. Cache — `InMemoryCache` Deep Dive

### Definitions

| Term | Definition |
|------|-----------|
| **Normalization** | The process of breaking down nested query results into flat, individually identifiable objects. Each object is stored once in the cache using a key like `User:123`. |
| **Cache Reference (`__ref`)** | A pointer to a normalized object: `{ __ref: 'User:123' }`. Queries store references, not copies, so one update propagates everywhere. |
| **Type Policy** | Configuration that tells the cache how to identify, read, merge, and handle objects of a specific type. |
| **`keyFields`** | Defines how a type is uniquely identified in the cache. Default is `['id']` or `['_id']`. You can customize for composite keys or disable normalization entirely. |
| **`read` function** | A custom function that runs whenever a field is read from the cache. Use for computed/derived fields, filtering, or local-only transformations. |
| **`merge` function** | A custom function that controls how incoming data combines with existing cache data. Critical for pagination, arrays, and nested objects. |
| **`cache.modify`** | A method for surgically updating individual fields on a cached object without writing an entire query or fragment. |
| **`cache.evict`** | Removes an object from the cache by its ID. |
| **`cache.gc`** | Garbage collection — removes any objects that are no longer referenced by any query. |

### Q: How does the normalized cache work internally?

Every query result is flattened. Objects with `__typename` and `id` are stored in a flat map:

```
ROOT_QUERY
  └─ users → [{ __ref: 'User:1' }, { __ref: 'User:2' }]

User:1 → { __typename: 'User', id: '1', name: 'Alice' }
User:2 → { __typename: 'User', id: '2', name: 'Bob' }
```

If `User:1` is updated by any mutation, every query referencing `User:1` automatically reflects the change.

### Q: How do you customize cache identity?

```js
const cache = new InMemoryCache({
  typePolicies: {
    Product: {
      keyFields: ['sku', 'warehouse'],
      // Cache key: Product:{"sku":"A1","warehouse":"US"}
    },
    SearchResult: {
      keyFields: false,
      // Not normalized — embedded in its parent
    },
  },
});
```

### Q: Explain `read` and `merge` functions

```js
typePolicies: {
  Query: {
    fields: {
      todos: {
        read(existing, { args }) {
          // Transform on read: filter by completion status
          if (args?.completed !== undefined) {
            return existing?.filter(t => t.completed === args.completed);
          }
          return existing;
        },
        merge(existing = [], incoming, { args }) {
          // Control how data merges: append for pagination
          if (args?.offset === 0) return incoming;
          return [...existing, ...incoming];
        },
      },
    },
  },
}
```

### Q: How do you directly manipulate the cache?

```js
// Read a cached query
const data = client.readQuery({ query: GET_TODOS });

// Write to a cached query
client.writeQuery({ query: GET_TODOS, data: { todos: updatedList } });

// Read a single cached object
const user = client.readFragment({ id: 'User:123', fragment: USER_FIELDS });

// Modify specific fields
cache.modify({
  id: 'User:123',
  fields: {
    name: () => 'New Name',
    friends(existingRefs, { readField }) {
      return existingRefs.filter(ref => readField('id', ref) !== deletedId);
    },
  },
});

// Remove an object and clean up
cache.evict({ id: 'User:123' });
cache.gc();
```

---

## 8. Pagination

### Definitions

| Term | Definition |
|------|-----------|
| **Offset-Based Pagination** | Uses `offset` and `limit` to skip and take items. Simple but has issues with data consistency when items are inserted/deleted. |
| **Cursor-Based Pagination** | Uses an opaque cursor (usually an encoded ID or timestamp) to mark position. More reliable for real-time data. |
| **Relay-Style Pagination** | A cursor-based pattern following the Relay specification with `edges`, `node`, `pageInfo`, `endCursor`, and `hasNextPage`. |
| **`fetchMore`** | A function returned by `useQuery` that fetches additional data and merges it into the existing result. |
| **`keyArgs`** | Tells the cache which query arguments create separate cache entries and which are just pagination parameters. Arguments listed in `keyArgs` create distinct cache entries. Arguments NOT listed (like `offset`, `limit`, `after`) are treated as pagination parameters that don't create separate entries. |

### Q: Implement offset-based pagination

```js
// Cache config
typePolicies: {
  Query: {
    fields: {
      posts: {
        keyArgs: ['category'],
        merge(existing = [], incoming, { args }) {
          if (args?.offset === 0) return incoming;
          return [...existing, ...incoming];
        },
      },
    },
  },
}
```

```jsx
const { data, fetchMore } = useQuery(GET_POSTS, {
  variables: { offset: 0, limit: 10, category: 'tech' },
});

const loadMore = () => {
  fetchMore({ variables: { offset: data.posts.length } });
};
```

### Q: Implement cursor-based with `relayStylePagination`

```js
import { relayStylePagination } from '@apollo/client/utilities';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        feed: relayStylePagination(['type']),
      },
    },
  },
});
```

```jsx
const { data, fetchMore } = useQuery(GET_FEED, { variables: { first: 10 } });

const loadMore = () => {
  fetchMore({ variables: { after: data.feed.pageInfo.endCursor } });
};
```

### Q: What happens without proper `keyArgs`?

Fetching page 2 would overwrite page 1 in the cache. Users would see items disappear. `keyArgs` ensures pagination arguments don't create separate cache entries, so pages merge together.

---

## 9. Local State Management

### Definitions

| Term | Definition |
|------|-----------|
| **`@client` Directive** | Marks a field as client-only. Apollo resolves it locally without sending it to the server. |
| **Reactive Variable** | Created with `makeVar()`. A piece of local state that triggers re-renders in any component subscribed to it (via `useReactiveVar` or a `read` function in type policies). |
| **Local Resolver** | (Deprecated in Apollo 3.x in favor of type policies) A function that resolves a `@client` field. |

```js
// Type policies approach (current)
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        isLoggedIn: {
          read() { return !!localStorage.getItem('token'); },
        },
        cartItems: {
          read() { return cartItemsVar(); },
        },
      },
    },
  },
});

export const cartItemsVar = makeVar([]);
```

```graphql
query GetLocalState {
  isLoggedIn @client
  cartItems @client
}
```

### Q: Can you mix `@client` and server fields in one query?

Yes. Apollo resolves `@client` fields locally and sends the rest to the server:

```graphql
query GetUserWithLocalState {
  user(id: "1") {    # fetched from server
    id
    name
    isSelected @client  # resolved locally
  }
}
```

---

## 10. Advanced Patterns

### Definitions

| Term | Definition |
|------|-----------|
| **Persisted Queries / APQ** | Instead of sending the full query string, the client sends a hash. The server maps the hash to the stored query. Reduces payload size and prevents arbitrary query attacks. |
| **`@defer` Directive** | Allows parts of a query to be streamed incrementally. The server returns available data first and streams deferred fields later. |
| **`@live` Directive** | (Experimental) Tells the server to push updates whenever the underlying data changes. |
| **Schema Stitching** | Combining multiple GraphQL schemas into one at the gateway level. |
| **Federation** | Apollo's approach to microservice GraphQL. Each service owns part of the schema, and the gateway composes them. |
| **DataLoader** | A batching/caching utility (server-side) that solves the N+1 problem by collecting all IDs requested in a single tick and fetching them in one batch. |
| **GraphQL Code Generator** | A tool that reads your schema and operations to generate TypeScript types, typed hooks, and typed document nodes. |

### Persisted Queries Setup

```js
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const persistedLink = createPersistedQueryLink({ sha256 });
const link = from([persistedLink, httpLink]);
```

### `@defer` Example

```graphql
query GetUser {
  user(id: "1") {
    name
    ... @defer {
      analyticsData  # heavy field — arrives later
    }
  }
}
```

### GraphQL Code Generator Config

```yaml
schema: "http://localhost:4000/graphql"
documents: "src/**/*.graphql"
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typed-document-node
```

```ts
const { data } = useQuery(GetUsersDocument);
// data.users is fully typed as User[]
```

### Q: How do you handle file uploads?

Apollo doesn't natively support multipart uploads. Use `apollo-upload-client`:

```js
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
const uploadLink = createUploadLink({ uri: '/graphql' });
```

### Q: SSR with Next.js App Router?

```jsx
import { registerApolloClient } from '@apollo/experimental-nextjs-app-support';

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: process.env.GRAPHQL_URL }),
  });
});

export default async function Page() {
  const { data } = await getClient().query({ query: GET_POSTS });
  return <PostList posts={data.posts} />;
}
```

### Q: Request batching?

```js
import { BatchHttpLink } from '@apollo/client/link/batch-http';

const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchMax: 10,
  batchInterval: 20,
});
```

### Q: Token refresh flow?

```js
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
    return fromPromise(refreshToken()).flatMap((newToken) => {
      operation.setContext({
        headers: { authorization: `Bearer ${newToken}` },
      });
      return forward(operation);
    });
  }
});
```

---

## 11. Testing

### Definitions

| Term | Definition |
|------|-----------|
| **`MockedProvider`** | A test wrapper from `@apollo/client/testing` that intercepts GraphQL operations and returns predefined responses instead of making real network requests. |
| **Mock Object** | A configuration that maps a specific request (query + variables) to a specific result (data, error, or network error). |

### Basic Test Setup

```jsx
import { MockedProvider } from '@apollo/client/testing';

const mocks = [
  {
    request: { query: GET_USERS, variables: { limit: 10 } },
    result: {
      data: { users: [{ id: '1', name: 'Alice', __typename: 'User' }] },
    },
  },
];

render(
  <MockedProvider mocks={mocks} addTypename={false}>
    <UserList />
  </MockedProvider>
);
await screen.findByText('Alice');
```

### Testing Errors

```jsx
// Network error
{ request: { query: GET_USERS }, error: new Error('Network error') }

// GraphQL error
{ request: { query: GET_USERS }, result: { errors: [{ message: 'Unauthorized' }] } }
```

### Testing Loading State

```jsx
render(<MockedProvider mocks={mocks}><Comp /></MockedProvider>);
expect(screen.getByTestId('spinner')).toBeInTheDocument();  // loading
await screen.findByText('Alice');                            // loaded
expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
```

---

## 12. Performance & Architecture (Staff-Level)

### Q: How do you prevent unnecessary re-renders?

- `useFragment` for component-level cache subscriptions
- `canonizeResults: true` to stabilize object identity across reads
- Split large queries into smaller ones so updates don't cascade
- Custom `read` functions to derive data without extra queries
- `previousData` to avoid full unmount/remount cycles

### Q: Describe your ideal large-scale GraphQL architecture

- **Fragment colocation**: Each component owns a fragment; parent queries compose them.
- **Generated types**: `graphql-codegen` with `TypedDocumentNode` for end-to-end type safety.
- **Schema-first contract**: Frontend and backend agree on the schema before building.
- **Layered links**: Auth → Error → Retry → Batch → HTTP.
- **Type policies upfront**: Define `keyFields`, `merge`, `read` for every type as part of initial setup.
- **Persisted queries** in production.
- **Monitoring**: Apollo Studio or custom link that tracks query latency, cache hit rates, and error rates.

### Q: Cache inconsistency after a mutation — how to debug?

1. Open Apollo DevTools → Cache tab.
2. Verify the mutation response includes `__typename` and `id`.
3. Check `keyFields` match between client and server.
4. Inspect `merge` functions for unintended overwrites.
5. Check if the mutation response returns enough data for the cache to update automatically, or if `update` / `refetchQueries` is needed.

### Q: Your app has 50+ queries. How do you manage them?

- Colocate fragments with components.
- Keep queries in `.graphql` files, not inline template literals.
- Use `graphql-codegen` to auto-generate typed hooks.
- Group shared fragments in a `fragments/` directory.
- Use `keyArgs` and type policies to prevent cache duplication.
- Monitor query performance in Apollo Studio.
