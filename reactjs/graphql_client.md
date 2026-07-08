# GraphQL Client Interview Guide (React + Apollo Client)


# What is a GraphQL Client?

A GraphQL Client is a frontend library that communicates with a GraphQL server. It executes queries, mutations, and subscriptions while providing built-in caching, loading and error state management, authentication, pagination, optimistic UI updates, and automatic cache synchronization.

---

# Why not use `fetch()`?

Although GraphQL APIs can be called using the native `fetch()` API, it quickly becomes difficult to manage in real-world applications.

## Using `fetch()`

You must manually handle:

- Authentication
- Loading state
- Error handling
- Cache management
- Retry logic
- Refetching
- Pagination
- State updates
- Request cancellation

Example:

```javascript
const response = await fetch("/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    query: `
      query {
        users {
          id
          name
        }
      }
    `,
  }),
});

const result = await response.json();
```

Everything after the request must be handled manually.

---

## Using Apollo Client

```tsx
const { loading, error, data } = useQuery(GET_USERS);
```

Apollo automatically handles:

- Loading
- Errors
- Caching
- Refetching
- Deduplication
- Authentication
- Pagination

---

## Interview Answer

> **Using `fetch()` requires manually handling authentication, loading states, errors, caching, retries, pagination, and UI updates. A GraphQL client like Apollo Client provides these features out of the box, reducing boilerplate code and improving performance and developer productivity.**

---

# Why is Caching Important?

Caching stores previously fetched data locally.

Instead of requesting the same data multiple times from the server, the client returns cached data whenever possible.

## Without Cache

```text
React
   │
   ▼
GraphQL Server

Every page visit makes another network request.
```

---

## With Cache

```text
React
   │
   ▼
Apollo Cache

↓

No network request
```

---

## Benefits

- Faster UI
- Fewer network requests
- Better user experience
- Reduced server load
- Offline-friendly experiences (when configured)

---

## Interview Answer

> **Caching stores previously fetched data locally, reducing unnecessary network requests, improving application performance, and delivering a faster user experience.**

---

# What is Cache Normalization?

Apollo Client stores each object only once in the cache.

Instead of storing duplicate copies of the same object, Apollo creates a normalized cache using:

- `id`
- `__typename`

Example server response:

```json
{
  "id": "1",
  "__typename": "User",
  "name": "John"
}
```

Apollo stores it internally as:

```text
User:1
```

Any query requesting the same user references the same cached object.

### Advantages

- No duplicate data
- Automatic UI updates
- Smaller memory usage
- Consistent data across components

---

## Interview Answer

> **Cache normalization stores every object only once using a unique identifier, typically `id` and `__typename`. Multiple queries reference the same cached object, ensuring consistency and efficient updates throughout the application.**

---

# What is Optimistic UI?

Optimistic UI updates the interface **before** the server responds.

Instead of waiting for the API call to complete, the UI assumes success and updates immediately.

## Normal Flow

```text
User clicks Like

↓

API Request

↓

Wait...

↓

Server Response

↓

Update UI
```

---

## Optimistic Flow

```text
User clicks Like

↓

Update UI Immediately

↓

API Request

↓

Server Response

↓

Keep changes

OR

Rollback if request fails
```

---

## Benefits

- Instant feedback
- Better user experience
- Faster-feeling applications

---

## Interview Answer

> **Optimistic UI immediately updates the interface after a user action by assuming the server request will succeed. If the request later fails, the client rolls back the optimistic changes to maintain consistency.**

---


## Example: useQuery()

```tsx
const { loading, data, error } = useQuery(GET_USERS);
```

Runs immediately when the component mounts.

---

## Example: useLazyQuery()

```tsx
const [getUsers, { loading, data }] = useLazyQuery(GET_USERS);

<button onClick={() => getUsers()}>
  Load Users
</button>
```

Runs only when the function is called.

---

## Interview Answer

> **`useQuery()` automatically executes when the component renders, making it ideal for loading initial page data. `useLazyQuery()` waits until its trigger function is called, making it suitable for search, filters, or button-triggered requests.**

---

# Common React GraphQL Hooks

| Hook | Purpose |
|------|---------|
| `useQuery()` | Executes a GraphQL query when the component renders. |
| `useLazyQuery()` | Executes a query only when triggered manually. |
| `useMutation()` | Creates, updates, or deletes data. |
| `useSubscription()` | Receives real-time updates using WebSockets. |
| `useApolloClient()` | Provides direct access to the Apollo Client instance. |
| `useFragment()` | Reads normalized cached data using GraphQL fragments. |
| `useReactiveVar()` | Reads and reacts to Apollo reactive variables for local state management. |

---

# Hook Usage Examples

## useQuery

```tsx
const { loading, error, data } = useQuery(GET_USERS);
```

---

## useLazyQuery

```tsx
const [loadUsers, { data }] = useLazyQuery(GET_USERS);
```

---

## useMutation

```tsx
const [createUser] = useMutation(CREATE_USER);

createUser({
  variables: {
    name: "John",
  },
});
```

---

## useSubscription

```tsx
const { data } = useSubscription(USER_ADDED);
```

---

## useApolloClient

```tsx
const client = useApolloClient();

client.refetchQueries({
  include: ["GetUsers"],
});
```

---

## useFragment

```tsx
const user = useFragment({
  fragment: USER_FRAGMENT,
  from: cacheObject,
});
```

---

## useReactiveVar

```tsx
const isLoggedIn = useReactiveVar(authVar);
```

---

# Frequently Asked Interview Questions

## What is a GraphQL Client?

> A GraphQL Client is a library that communicates with a GraphQL server and provides features such as executing queries, mutations, subscriptions, caching, authentication, loading and error state management, pagination, and automatic UI synchronization.

---

## Why not use `fetch()`?

> Because `fetch()` requires manually implementing authentication, loading states, error handling, caching, retries, pagination, and state management. GraphQL clients handle these concerns automatically.

---

## Why is caching important?

> Caching stores previously fetched data locally, reducing unnecessary network requests, improving application performance, and providing a faster user experience.

---

## What is cache normalization?

> Cache normalization stores each object only once using a unique identifier (typically `id` and `__typename`), allowing all queries to reference the same object and keeping data consistent across the application.

---

## What is Optimistic UI?

> Optimistic UI immediately updates the interface before receiving the server response, providing a smoother user experience. If the request fails, the client automatically rolls back the optimistic update.

---

## Difference between `useQuery()` and `useLazyQuery()`?

> `useQuery()` executes automatically when the component renders, making it suitable for initial page data. `useLazyQuery()` executes only when explicitly triggered, making it ideal for search forms, filters, or button clicks.

---

# Best Practices

- Use `useQuery()` for initial page data.
- Use `useLazyQuery()` for user-triggered requests.
- Use `useMutation()` for create, update, and delete operations.
- Enable cache normalization with unique `id` fields.
- Use optimistic UI for responsive user interactions.
- Prefer Apollo Client's cache over unnecessary refetches.
- Use GraphQL fragments to avoid duplicated query definitions.
- Handle loading and error states gracefully in every component.

---

# Apollo Client Hooks – Complete Interview Guide

> Learn the most important Apollo Client hooks with definitions, syntax, examples, use cases, and interview questions.

---

# Table of Contents

1. useQuery()
2. useLazyQuery()
3. useMutation()
4. useSubscription()
5. useFragment()
6. useReactiveVar()
7. useApolloClient()
8. Hook Comparison
9. Interview Questions

---

# 1. useQuery()

## What is useQuery()?

`useQuery()` is a React hook provided by Apollo Client that automatically executes a GraphQL query when the component renders.

It is the most commonly used hook for fetching data.

---

## Syntax

```tsx
const { loading, error, data } = useQuery(QUERY);
```

---

## Example

```tsx
import { gql, useQuery } from "@apollo/client";

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

function Users() {
  const { loading, error, data } = useQuery(GET_USERS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      {data.users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </>
  );
}
```

---

## Common Options

```tsx
useQuery(GET_USERS, {
  variables: { page: 1 },
  fetchPolicy: "cache-first",
  pollInterval: 5000,
  skip: false,
});
```

### Common Options

| Option | Purpose |
|---------|---------|
| variables | Pass query variables |
| fetchPolicy | Control cache behavior |
| pollInterval | Auto-refetch after interval |
| skip | Skip query execution |
| onCompleted | Execute callback after success |
| onError | Handle errors |

---

## Returns

```tsx
const {
  loading,
  error,
  data,
  refetch,
  fetchMore,
  networkStatus
} = useQuery(GET_USERS);
```

---

## When to Use

- Dashboard
- Home page
- Profile page
- Initial page load
- Read-only data

---

## Interview Definition

> **useQuery() automatically executes a GraphQL query when a component mounts and returns loading, error, and data states while integrating with Apollo Client's cache.**

---

# 2. useLazyQuery()

## What is useLazyQuery()?

`useLazyQuery()` works like `useQuery()`, but it does **not** execute automatically.

Instead, it returns a function that you call manually.

---

## Syntax

```tsx
const [getUsers, { loading, error, data }] = useLazyQuery(GET_USERS);
```

---

## Example

```tsx
const [getUsers, { loading, data }] = useLazyQuery(GET_USERS);

<button onClick={() => getUsers()}>
  Load Users
</button>
```

---

## With Variables

```tsx
getUsers({
  variables: {
    search: "John",
  },
});
```

---

## When to Use

- Search
- Filters
- Button click
- Auto-complete
- Conditional fetching

---

## Interview Definition

> **useLazyQuery() provides manual control over query execution. Unlike useQuery(), it runs only when the returned function is called.**

---

# 3. useMutation()

## What is useMutation()?

`useMutation()` executes GraphQL mutations such as:

- Create
- Update
- Delete

Unlike queries, mutations execute only when explicitly called.

---

## Syntax

```tsx
const [createUser, { loading, error, data }] =
useMutation(CREATE_USER);
```

---

## Example

```tsx
const CREATE_USER = gql`
mutation CreateUser($name:String!){
  createUser(name:$name){
      id
      name
  }
}
`;

const [createUser] = useMutation(CREATE_USER);

createUser({
  variables: {
    name: "John",
  },
});
```

---

## Common Options

```tsx
useMutation(CREATE_USER, {
  refetchQueries: ["GetUsers"],
  awaitRefetchQueries: true,
  optimisticResponse: {},
  update(cache, result) {},
});
```

---

## When to Use

- Registration
- Login
- CRUD
- Form submission
- Delete record

---

## Interview Definition

> **useMutation() executes GraphQL mutations for creating, updating, or deleting data and provides loading, error, and response states.**

---

# 4. useSubscription()

## What is useSubscription()?

`useSubscription()` receives real-time updates from the GraphQL server using WebSockets.

---

## Syntax

```tsx
const { data } = useSubscription(MESSAGE_ADDED);
```

---

## Example

```tsx
const MESSAGE_ADDED = gql`
subscription {
  messageAdded{
      id
      text
  }
}
`;

const { data } = useSubscription(MESSAGE_ADDED);
```

---

## Use Cases

- Chat application
- Notifications
- Live stock prices
- Sports score
- Live dashboard

---

## Interview Definition

> **useSubscription() listens for real-time GraphQL events over a WebSocket connection and updates the UI automatically when new data is received.**

---

# 5. useFragment()

## What is useFragment()?

`useFragment()` reads normalized cached data using GraphQL fragments without executing a network request.

Available in Apollo Client v3.8+.

---

## Fragment

```graphql
fragment UserFragment on User {
  id
  name
  email
}
```

---

## Example

```tsx
const user = useFragment({
  fragment: USER_FRAGMENT,
  from: {
    __typename: "User",
    id: "1",
  },
});
```

---

## Benefits

- Reads from cache only
- No API call
- Better component reuse
- Consistent data access

---

## When to Use

- Large applications
- Shared UI components
- Cache-first rendering

---

## Interview Definition

> **useFragment() reads normalized data directly from Apollo Client's cache using GraphQL fragments, avoiding unnecessary network requests.**

---

# 6. useReactiveVar()

## What is useReactiveVar()?

`useReactiveVar()` is used to read local state managed by Apollo Reactive Variables.

Reactive variables update subscribed components automatically without React Context or Redux.

---

## Create Variable

```tsx
import { makeVar } from "@apollo/client";

export const isLoggedInVar = makeVar(false);
```

---

## Read Variable

```tsx
const isLoggedIn = useReactiveVar(isLoggedInVar);
```

---

## Update Variable

```tsx
isLoggedInVar(true);
```

---

## Use Cases

- Authentication
- Theme
- Sidebar
- Local UI state
- Shopping cart count

---

## Interview Definition

> **useReactiveVar() subscribes a component to Apollo Reactive Variables, allowing local state updates without external state management libraries.**

---

# 7. useApolloClient()

## What is useApolloClient()?

`useApolloClient()` provides direct access to the Apollo Client instance.

Useful for performing cache operations or executing queries programmatically.

---

## Syntax

```tsx
const client = useApolloClient();
```

---

## Execute Query

```tsx
const result = await client.query({
  query: GET_USERS,
});
```

---

## Clear Cache

```tsx
client.clearStore();
```

---

## Reset Cache

```tsx
client.resetStore();
```

---

## Refetch Queries

```tsx
client.refetchQueries({
  include: ["GetUsers"],
});
```

---

## When to Use

- Manual query execution
- Cache management
- Logout
- Background requests

---

## Interview Definition

> **useApolloClient() returns the Apollo Client instance, allowing manual execution of queries, mutations, cache updates, and store management.**

---

# Apollo Hooks Comparison

| Hook | Automatic | Manual | Purpose |
|------|-----------|--------|---------|
| useQuery | ✅ | ❌ | Fetch data |
| useLazyQuery | ❌ | ✅ | Fetch on demand |
| useMutation | ❌ | ✅ | Create, Update, Delete |
| useSubscription | ✅ | ❌ | Real-time updates |
| useFragment | Cache Only | ❌ | Read cached fragment |
| useReactiveVar | Reactive | ❌ | Local state |
| useApolloClient | Manual | ✅ | Direct client access |

---

# Which Hook Should I Use?

| Situation | Recommended Hook |
|-----------|------------------|
| Load dashboard | useQuery |
| Search button | useLazyQuery |
| Login | useMutation |
| Registration | useMutation |
| Delete user | useMutation |
| Live chat | useSubscription |
| Notification system | useSubscription |
| Read cached object | useFragment |
| Authentication state | useReactiveVar |
| Theme switch | useReactiveVar |
| Logout | useApolloClient |
| Clear cache | useApolloClient |
| Background fetch | useApolloClient |

---

# Frequently Asked Interview Questions

## What is the difference between useQuery() and useLazyQuery()?

| useQuery() | useLazyQuery() |
|------------|----------------|
| Executes automatically when the component mounts. | Executes only when the returned function is called. |
| Best for initial page data. | Best for search, filters, or button-triggered requests. |

---

## When should you use useMutation()?

Use `useMutation()` for operations that modify server-side data, such as creating, updating, deleting records, user login, or submitting forms.

---

## When should you use useSubscription()?

Use `useSubscription()` when your application requires real-time updates, such as chat messages, notifications, live dashboards, stock prices, or sports scores.

---

## What is useFragment()?

`useFragment()` reads normalized data directly from Apollo Client's cache using GraphQL fragments. It avoids unnecessary network requests and promotes reusable components.

---

## What is useReactiveVar()?

`useReactiveVar()` subscribes a component to Apollo Reactive Variables, making it ideal for lightweight local state management such as authentication status, themes, or UI preferences.

---

## What is useApolloClient()?

`useApolloClient()` gives direct access to the Apollo Client instance, allowing manual queries, cache reads and writes, cache clearing, refetching queries, and store management.

---

# Quick Interview Summary

| Hook | Purpose |
|------|---------|
| **useQuery()** | Automatically fetches data when a component renders. |
| **useLazyQuery()** | Fetches data only when manually triggered. |
| **useMutation()** | Performs create, update, and delete operations. |
| **useSubscription()** | Receives real-time updates over WebSockets. |
| **useFragment()** | Reads normalized cached data without making a network request. |
| **useReactiveVar()** | Manages lightweight local state using Apollo Reactive Variables. |
| **useApolloClient()** | Provides direct access to the Apollo Client instance for advanced cache and query operations. |

> **Interview Tip:**  
> Remember the primary purpose of each hook:
> - **Read data:** `useQuery()`, `useLazyQuery()`
> - **Modify data:** `useMutation()`
> - **Real-time data:** `useSubscription()`
> - **Read cache:** `useFragment()`
> - **Local state:** `useReactiveVar()`
> - **Advanced client control:** `useApolloClient()`

# Apollo Client Cache Internals & Normalization – Complete Interview Guide

> Learn how Apollo Client's cache works internally, how cache normalization improves performance, and how to answer interview questions confidently.

---

# Table of Contents

1. What is Apollo Cache?
2. Why do we need Cache?
3. How Apollo Cache Works
4. Cache Normalization
5. Internal Cache Structure
6. Reading from Cache
7. Writing to Cache
8. Cache IDs
9. Cache Policies
10. Fetch Policies
11. Cache Updates after Mutation
12. Cache Eviction & Garbage Collection
13. Cache API
14. Common Interview Questions
15. Best Practices

---

# What is Apollo Cache?

Apollo Client uses an **InMemoryCache** to store GraphQL query results in the browser.

Instead of requesting the same data repeatedly from the server, Apollo stores the data locally and serves future requests from the cache whenever possible.

```text
React Component
        │
        ▼
Apollo Client
        │
        ▼
InMemoryCache
        │
        ▼
GraphQL Server
```

---

# Why Do We Need Cache?

Without cache:

```text
Dashboard
      │
      ▼
GET Users

↓

Server

↓

Dashboard

↓

Navigate Again

↓

GET Users

↓

Server Again
```

Every page visit sends another request.

---

With cache:

```text
Dashboard

↓

GET Users

↓

Server

↓

Cache

↓

Navigate Again

↓

Cache

↓

No Network Request
```

---

## Benefits

- Faster UI
- Less network traffic
- Reduced server load
- Better UX
- Offline support (with additional configuration)
- Instant navigation

---

# How Apollo Cache Works

Suppose the server returns:

```json
{
  "users": [
    {
      "id": "1",
      "name": "John"
    },
    {
      "id": "2",
      "name": "Alice"
    }
  ]
}
```

Apollo stores it internally as normalized entities.

```text
ROOT_QUERY

↓

users

↓

User:1
User:2
```

Each object is stored only once.

---

# What is Cache Normalization?

Normalization means:

> Store every object only once using a unique identifier.

Instead of storing duplicate copies of the same object, Apollo stores one canonical version.

---

Without Normalization

```text
Dashboard Query

↓

{
 id:1,
 name:"John"
}

Profile Query

↓

{
 id:1,
 name:"John"
}
```

Two separate copies exist.

Memory usage increases and updates can become inconsistent.

---

With Normalization

```text
User:1

↓

{
 id:1,
 name:"John"
}
```

Both queries reference the same cached object.

---

# Why is Normalization Important?

Imagine three screens:

- Dashboard
- Profile
- User Details

All fetch:

```graphql
{
  user(id: 1) {
    id
    name
  }
}
```

Without normalization:

```text
Dashboard

↓

John

Profile

↓

John

User Details

↓

John
```

Three copies are stored.

---

After normalization:

```text
User:1

↓

John
```

Only one object exists in memory.

Updating it updates every component that references it.

---

# Internal Cache Structure

Apollo's cache looks similar to this:

```text
ROOT_QUERY
│
├── users
│      │
│      ▼
│   [User:1, User:2]
│
├── posts
│      │
│      ▼
│   [Post:10]
│
└── profile
        │
        ▼
      User:1
```

Actual objects:

```text
User:1

{
 id:"1",
 name:"John",
 email:"john@test.com"
}

User:2

{
 id:"2",
 name:"Alice"
}
```

---

# Cache IDs

Apollo identifies objects using:

```text
__typename + id
```

Example:

```json
{
 "__typename":"User",
 "id":"1"
}
```

Stored as:

```text
User:1
```

Another example:

```json
{
 "__typename":"Post",
 "id":"12"
}
```

Stored as:

```text
Post:12
```

---

# Why __typename?

Suppose:

```json
User {
 id:1
}
```

and

```json
Product {
 id:1
}
```

Both have id = 1.

Apollo distinguishes them as:

```text
User:1

Product:1
```

No conflicts occur.

---

# Reading from Cache

Apollo checks the cache before making a network request.

```text
Component

↓

useQuery()

↓

Cache

↓

Data Found?

YES

↓

Return Cached Data

NO

↓

Call GraphQL Server
```

---

# Writing to Cache

After a successful query:

```text
GraphQL Server

↓

Apollo Client

↓

Normalize Data

↓

Store in Cache

↓

Update Components
```

---

# Cache Updates After Mutation

Suppose we update a user.

Mutation:

```graphql
mutation {
  updateUser(id:1){
      id
      name
  }
}
```

Server returns:

```json
{
 "id":"1",
 "name":"Johnny"
}
```

Apollo updates:

```text
User:1

↓

Johnny
```

Every component using `User:1` automatically re-renders.

No manual state management is required.

---

# Cache Policies (Type Policies)

Apollo allows custom cache behavior.

Example:

```tsx
const cache = new InMemoryCache({
  typePolicies: {
    User: {
      keyFields: ["id"],
    },
  },
});
```

---

Composite key example:

```tsx
Product: {
    keyFields: ["sku", "country"]
}
```

Unique cache key:

```text
Product:123-US
```

---

Disable normalization (rare)

```tsx
User: {
   keyFields:false
}
```

---

# Fetch Policies

Fetch policies control where Apollo retrieves data.

| Policy | Description |
|----------|------------|
| cache-first | Default. Cache first, then network if needed. |
| cache-only | Only read from cache. |
| network-only | Always fetch from server. |
| no-cache | Fetch from server and don't cache the result. |
| cache-and-network | Return cached data immediately, then update with fresh network data. |
| standby | Query remains inactive until explicitly used. |

Example:

```tsx
useQuery(GET_USERS,{
    fetchPolicy:"cache-first"
});
```

---

# Cache API

## Read Query

```tsx
const data = client.readQuery({
    query: GET_USERS
});
```

---

## Write Query

```tsx
client.writeQuery({
    query: GET_USERS,
    data:{
        users:[]
    }
});
```

---

## Read Fragment

```tsx
client.readFragment({
    id:"User:1",
    fragment:USER_FRAGMENT
});
```

---

## Write Fragment

```tsx
client.writeFragment({
    id:"User:1",
    fragment:USER_FRAGMENT,
    data:{
        name:"John"
    }
});
```

---

## Modify Cache

```tsx
client.cache.modify({
    id:"User:1",
    fields:{
        name(){
            return "John Updated";
        }
    }
});
```

---

## Evict Object

```tsx
client.cache.evict({
    id:"User:1"
});
```

---

## Garbage Collection

```tsx
client.cache.gc();
```

Garbage collection removes orphaned objects that are no longer referenced in the cache.

---

# Cache Lifecycle

```text
Component

↓

useQuery()

↓

Cache

↓

Hit?

Yes

↓

Return Cached Data

No

↓

GraphQL Server

↓

Normalize Data

↓

Store in Cache

↓

Render UI

↓

Mutation

↓

Update Cache

↓

Automatic UI Re-render
```

---

# Common Interview Questions

## What is Apollo Cache?

Apollo Cache is an in-memory normalized data store that caches GraphQL query results, reducing unnecessary network requests and improving application performance.

---

## What is Cache Normalization?

Cache normalization stores each object only once using a unique identifier (typically `id` and `__typename`). Multiple queries reference the same object, ensuring consistency and efficient updates.

---

## Why is `__typename` important?

`__typename` identifies the GraphQL type of an object. Combined with `id`, it creates unique cache keys such as `User:1` or `Post:1`, preventing collisions between different object types.

---

## Why is normalization better than storing raw JSON?

Normalization eliminates duplicate objects, reduces memory usage, keeps data synchronized across the application, and allows Apollo Client to update all dependent components automatically after a mutation.

---

## What happens after a mutation?

Apollo writes the returned object into the normalized cache. Any component referencing that object is automatically re-rendered with the updated data.

---

## What is the default fetch policy?

The default fetch policy is **`cache-first`**, which returns cached data when available and falls back to the network if the cache doesn't contain the requested data.

---

## What is the difference between `cache-first` and `network-only`?

| cache-first | network-only |
|--------------|--------------|
| Reads cache before the network. | Always requests fresh data from the server. |
| Faster and reduces network traffic. | Ensures the latest data but increases network usage. |

---

## What does `cache.modify()` do?

`cache.modify()` updates specific fields of a cached object without replacing the entire object. It is commonly used to append items to lists or update individual fields after mutations.

---

## What is garbage collection?

Garbage collection removes cached objects that are no longer referenced by any active query, helping reduce memory usage.

---

# Best Practices

- Always request `id` in your GraphQL queries so Apollo can normalize data.
- Include `__typename` (Apollo adds it automatically by default).
- Prefer updating the cache over refetching when practical.
- Use `cache.modify()` for efficient list updates.
- Define `typePolicies` for custom cache keys when necessary.
- Choose the appropriate `fetchPolicy` based on freshness and performance requirements.
- Avoid disabling normalization (`keyFields: false`) unless you have a specific reason.

---

# Apollo Client Fetch Policies (Interview Guide)

> **Fetch Policies** determine where Apollo Client retrieves data from when executing a GraphQL query: **Cache**, **Network**, or **Both**.

---

# What is a Fetch Policy?

A **Fetch Policy** tells Apollo Client how to fetch data for a query.

It controls whether Apollo should:

- Read from the cache
- Fetch from the GraphQL server
- Use both cache and network

---

# Available Fetch Policies

| Fetch Policy | Description | Best Use Case |
|--------------|-------------|---------------|
| `cache-first` | Reads from cache first. If data is missing, fetches from the server and caches it. *(Default)* | Dashboard, Profile, Product List |
| `cache-only` | Reads only from the cache. Never sends a network request. | Offline mode, Local cached data |
| `network-only` | Always fetches fresh data from the server and updates the cache. | Reports, Admin Dashboard |
| `no-cache` | Always fetches fresh data but does not save it in the cache. | Login, OTP, Payment |
| `cache-and-network` | Returns cached data immediately and also fetches fresh data from the server, updating the UI when it arrives. | News Feed, Social Feed, Dashboard |
| `standby` | Keeps the query inactive until it is manually reactivated or refetched. | Hidden Tabs, Background Screens |

---

# 1. cache-first (Default)

## Definition

Apollo checks the cache first.

- If data exists → Return cached data.
- If data doesn't exist → Fetch from the server and store it in the cache.

### Flow

```text
Cache
   │
   ├── Data Found → Return Cache
   │
   └── Data Missing → Fetch from Server → Save to Cache
```

### Example

```tsx
const { data } = useQuery(GET_USERS, {
  fetchPolicy: "cache-first",
});
```

### Best For

- Dashboard
- User Profile
- Product List
- Blog Posts

### Interview Answer

> **`cache-first` is the default Apollo fetch policy. It checks the cache first and only makes a network request if the requested data is not available.**

---

# 2. cache-only

## Definition

Apollo only reads data from the cache.

No network request is ever made.

### Flow

```text
Cache
   │
   ├── Data Found → Return Data
   │
   └── Data Missing → No Request
```

### Example

```tsx
const { data } = useQuery(GET_USERS, {
  fetchPolicy: "cache-only",
});
```

### Best For

- Offline applications
- Local state
- Previously fetched data

### Interview Answer

> **`cache-only` reads data exclusively from the cache and never contacts the server.**

---

# 3. network-only

## Definition

Apollo ignores the cache and always requests fresh data from the server.

The response is then stored in the cache.

### Flow

```text
Server
   │
   ▼
Fetch Data
   │
   ▼
Save to Cache
   │
   ▼
Render UI
```

### Example

```tsx
const { data } = useQuery(GET_USERS, {
  fetchPolicy: "network-only",
});
```

### Best For

- Reports
- Admin Dashboard
- Frequently changing data

### Interview Answer

> **`network-only` always fetches fresh data from the server and updates the Apollo cache with the response.**

---

# 4. no-cache

## Definition

Apollo always fetches fresh data from the server but never stores the response in the cache.

### Flow

```text
Server
   │
   ▼
Fetch Data
   │
   ▼
Render UI

(No Cache)
```

### Example

```tsx
const { data } = useQuery(GET_USERS, {
  fetchPolicy: "no-cache",
});
```

### Best For

- Login
- OTP Verification
- Payment Processing
- Sensitive Data

### Interview Answer

> **`no-cache` always fetches fresh data and skips writing the response to the Apollo cache.**

---

# 5. cache-and-network

## Definition

Apollo immediately returns cached data and simultaneously requests fresh data from the server.

When the server responds, Apollo updates the cache and automatically re-renders the UI.

### Flow

```text
Cache
   │
   ▼
Show Cached Data
   │
   ▼
Server Request
   │
   ▼
Update Cache
   │
   ▼
Update UI
```

### Example

```tsx
const { data } = useQuery(GET_USERS, {
  fetchPolicy: "cache-and-network",
});
```

### Best For

- Social Media Feed
- News Feed
- Dashboard
- Product Catalog

### Interview Answer

> **`cache-and-network` returns cached data immediately while also fetching fresh data from the server. Once the network response arrives, the cache and UI are updated automatically.**

---

# 6. standby

## Definition

The query remains inactive until it is manually triggered or reactivated.

### Example

```tsx
const { data } = useQuery(GET_USERS, {
  fetchPolicy: "standby",
});
```

### Best For

- Hidden Tabs
- Background Screens
- Optional Components

### Interview Answer

> **`standby` keeps the query inactive until it is explicitly used or refetched.**

---

# Fetch Policy Comparison

| Policy | Cache | Network | Saves Cache | Best Use Case |
|----------|:----:|:-------:|:-----------:|---------------|
| `cache-first` | ✅ | If Needed | ✅ | Dashboard, Profile |
| `cache-only` | ✅ | ❌ | ❌ | Offline Data |
| `network-only` | ❌ | ✅ | ✅ | Reports, Admin |
| `no-cache` | ❌ | ✅ | ❌ | Login, Payment |
| `cache-and-network` | ✅ | ✅ | ✅ | News Feed, Dashboard |
| `standby` | Optional | Optional | ✅ | Hidden Tabs |

---

# Frequently Asked Interview Questions

## What is the default fetch policy?

**Answer:** `cache-first`

---

## Difference between `cache-first` and `network-only`

| cache-first | network-only |
|--------------|--------------|
| Checks cache first | Always requests fresh data |
| Faster | Slower |
| Fewer API calls | More API calls |

---

## Difference between `network-only` and `no-cache`

| network-only | no-cache |
|--------------|-----------|
| Saves response in cache | Doesn't save response in cache |
| Future queries can use cache | Every request goes to the server |

---

## Difference between `cache-first` and `cache-and-network`

| cache-first | cache-and-network |
|--------------|-------------------|
| Uses cache first and fetches only if needed | Returns cached data and always fetches fresh data |
| Better for reducing network requests | Better for balancing speed and freshness |

---

## Which fetch policy is best for login?

**Answer:** `no-cache`

Reason: Login responses are sensitive and usually shouldn't be cached.

---

## Which fetch policy is best for dashboards?

**Answer:**

- `cache-first` for mostly static dashboards.
- `cache-and-network` when data changes frequently and should refresh automatically.

---

# Quick Interview Summary

| Fetch Policy | One-Line Explanation |
|---------------|----------------------|
| **cache-first** | Cache first, then server if needed. *(Default)* |
| **cache-only** | Read only from cache. |
| **network-only** | Always fetch from the server and update cache. |
| **no-cache** | Always fetch from the server without caching. |
| **cache-and-network** | Show cached data immediately, then refresh from the server. |
| **standby** | Keep the query inactive until manually used. |

---

# Apollo Client Fetch Policies – 20+ Real Production Scenarios (Interview Guide)

> These are real-world scenarios commonly discussed in GraphQL and Apollo Client interviews. Learn **which fetch policy to use and why**.

---

# Scenario 1: Dashboard

### Situation

A user opens the dashboard multiple times.

### Fetch Policy

```tsx
fetchPolicy: "cache-first"
```

### Why?

- Dashboard data doesn't change every second.
- Cache provides instant loading.
- Reduces unnecessary API calls.

---

# Scenario 2: User Profile

### Situation

The user visits their profile repeatedly.

### Fetch Policy

```tsx
fetchPolicy: "cache-first"
```

### Why?

Profile information changes infrequently, so cached data improves performance.

---

# Scenario 3: Product Listing (E-commerce)

### Situation

Products are updated occasionally, but users expect fast loading.

### Fetch Policy

```tsx
fetchPolicy: "cache-and-network"
```

### Why?

Show cached products immediately and refresh them in the background.

---

# Scenario 4: News Feed

### Situation

News articles are continuously published.

### Fetch Policy

```tsx
fetchPolicy: "cache-and-network"
```

### Why?

Users see cached news instantly while receiving the latest articles automatically.

---

# Scenario 5: Social Media Feed

### Situation

Posts are added every minute.

### Fetch Policy

```tsx
fetchPolicy: "cache-and-network"
```

### Why?

Fast initial rendering with background updates.

---

# Scenario 6: Stock Market Dashboard

### Situation

Stock prices change every second.

### Fetch Policy

```tsx
fetchPolicy: "network-only"
```

### Why?

Always display the latest prices.

---

# Scenario 7: Admin Dashboard

### Situation

Administrators monitor frequently changing business data.

### Fetch Policy

```tsx
fetchPolicy: "network-only"
```

### Why?

Fresh data is more important than loading speed.

---

# Scenario 8: Analytics Reports

### Situation

Sales reports change frequently.

### Fetch Policy

```tsx
fetchPolicy: "network-only"
```

### Why?

Reports must always display current information.

---

# Scenario 9: Login

### Situation

User authentication.

### Fetch Policy

```tsx
fetchPolicy: "no-cache"
```

### Why?

Authentication responses should not be stored in cache.

---

# Scenario 10: OTP Verification

### Situation

Verify a one-time password.

### Fetch Policy

```tsx
fetchPolicy: "no-cache"
```

### Why?

Every verification request must go to the server.

---

# Scenario 11: Payment Confirmation

### Situation

Processing an online payment.

### Fetch Policy

```tsx
fetchPolicy: "no-cache"
```

### Why?

Payment responses should never be cached.

---

# Scenario 12: Search Results

### Situation

Users search for products or users.

### Fetch Policy

```tsx
fetchPolicy: "network-only"
```

### Why?

Each search query is different and should return fresh results.

---

# Scenario 13: Auto Complete Search

### Situation

Suggestions while typing.

### Fetch Policy

```tsx
fetchPolicy: "network-only"
```

### Why?

Suggestions change with every keystroke.

---

# Scenario 14: Shopping Cart

### Situation

User adds or removes items.

### Fetch Policy

```tsx
fetchPolicy: "cache-first"
```

### Why?

The cart is frequently accessed, and updates are handled through cache after mutations.

---

# Scenario 15: Notifications

### Situation

Unread notification count.

### Fetch Policy

```tsx
fetchPolicy: "cache-and-network"
```

### Why?

Display cached notifications immediately while checking for new ones.

---

# Scenario 16: Chat Messages

### Situation

Real-time messaging.

### Fetch Policy

```tsx
fetchPolicy: "cache-and-network"
```

### Better Option

Use **GraphQL Subscriptions** for live updates.

---

# Scenario 17: Settings Page

### Situation

Application settings rarely change.

### Fetch Policy

```tsx
fetchPolicy: "cache-first"
```

### Why?

Provides instant loading with minimal server requests.

---

# Scenario 18: Offline Mode

### Situation

The application works without internet access.

### Fetch Policy

```tsx
fetchPolicy: "cache-only"
```

### Why?

Only cached data is available.

---

# Scenario 19: Hidden Tab

### Situation

A background or inactive tab.

### Fetch Policy

```tsx
fetchPolicy: "standby"
```

### Why?

Avoid unnecessary updates until the tab becomes active.

---

# Scenario 20: User Logout

### Situation

User signs out.

### Action

```tsx
client.clearStore();
```

or

```tsx
client.resetStore();
```

### Why?

Remove all cached user data to prevent data leakage.

---

# Scenario 21: User Updates Their Profile

### Situation

User changes their name.

### Best Practice

Use:

```tsx
cache.modify()
```

or

```tsx
writeFragment()
```

### Why?

Immediately update the cache without refetching the profile.

---

# Scenario 22: Create a New Post

### Situation

User creates a new social media post.

### Best Practice

```tsx
cache.modify()
```

### Why?

Insert the new post into the cached list instead of refetching the entire feed.

---

# Scenario 23: Delete a Product

### Situation

Admin deletes a product.

### Best Practice

```tsx
cache.modify()
```

### Why?

Remove the deleted product from the cached list.

---

# Scenario 24: Update Product Price

### Situation

Admin edits a product.

### Best Practice

Apollo automatically updates the normalized cache if the mutation returns:

```graphql
{
  id
  price
}
```

### Why?

The cache entry (`Product:id`) is updated, and all components using it re-render automatically.

---

# Scenario 25: Multiple Components Showing the Same User

### Situation

The Dashboard, Profile, and Sidebar all display the logged-in user's information.

### Best Practice

Use Apollo's normalized cache.

### Why?

Updating the user in one place updates every component referencing that user.

---

# Production Scenario Summary

| Scenario | Fetch Policy |
|----------|--------------|
| Dashboard | `cache-first` |
| User Profile | `cache-first` |
| Product Listing | `cache-and-network` |
| News Feed | `cache-and-network` |
| Social Feed | `cache-and-network` |
| Stock Prices | `network-only` |
| Admin Dashboard | `network-only` |
| Reports | `network-only` |
| Search | `network-only` |
| Auto Complete | `network-only` |
| Login | `no-cache` |
| OTP Verification | `no-cache` |
| Payment | `no-cache` |
| Shopping Cart | `cache-first` |
| Notifications | `cache-and-network` |
| Chat | `cache-and-network` + Subscriptions |
| Settings | `cache-first` |
| Offline Mode | `cache-only` |
| Hidden Tab | `standby` |
| Logout | `clearStore()` / `resetStore()` |
| Create Post | `cache.modify()` |
| Delete Product | `cache.modify()` |
| Update Profile | `writeFragment()` / `cache.modify()` |
| Update Product | Normalized Cache |
| Shared User Data | Cache Normalization |

---

# Interview Tips

- Use **`cache-first`** for data that doesn't change often.
- Use **`cache-and-network`** when users should see cached data immediately but still receive fresh updates.
- Use **`network-only`** when accuracy is more important than speed.
- Use **`no-cache`** for sensitive, one-time operations like authentication or payments.
- Use **`cache-only`** for offline or previously loaded data.
- Use **`standby`** for inactive components.
- Prefer updating the cache with **`cache.modify()`** or **`writeFragment()`** after mutations instead of refetching whenever possible.

---

# 30-Second Interview Answer

> **In production, the fetch policy depends on the use case. I use `cache-first` for dashboards and profiles, `cache-and-network` for feeds and product lists, `network-only` for reports and live data, `no-cache` for login and payment flows, `cache-only` for offline features, and `standby` for inactive screens. After mutations, I prefer updating Apollo's normalized cache with `cache.modify()` or `writeFragment()` rather than refetching entire queries whenever possible.**
>
> # Apollo Links (Auth, Error, Retry, Upload, Batch) – Complete Interview Guide

> Learn how Apollo Links work, their purpose, production use cases, and interview questions with examples.

---

# Table of Contents

1. What is Apollo Link?
2. Why Do We Need Apollo Links?
3. Apollo Link Architecture
4. Auth Link
5. Error Link
6. Retry Link
7. Upload Link
8. Batch Link
9. Combining Multiple Links
10. Production Scenarios
11. Interview Questions
12. Best Practices

---

# What is Apollo Link?

Apollo Link is a middleware layer in Apollo Client that allows you to intercept, modify, or handle GraphQL operations before they reach the server and after the response is received.

It is similar to Express middleware for GraphQL requests.

---

## Apollo Link Flow

```text
React Component
       │
       ▼
   Apollo Client
       │
       ▼
   Apollo Links
       │
 ┌─────┼───────────────┐
 │     │       │       │
 ▼     ▼       ▼       ▼
Auth  Retry  Error  Upload
       │
       ▼
    HTTP Link
       │
       ▼
 GraphQL Server
```

---

# Why Do We Need Apollo Links?

Apollo Links allow you to:

- Add authentication headers
- Handle errors globally
- Retry failed requests
- Upload files
- Batch multiple requests
- Log requests and responses
- Modify outgoing operations

Without Apollo Links, these features must be implemented manually in every request.

---

# 1. Auth Link

## What is Auth Link?

Auth Link adds authentication information (such as JWT tokens) to every GraphQL request.

---

## Example

```tsx
import { setContext } from "@apollo/client/link/context";

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
});
```

---

## Request

```http
Authorization: Bearer eyJhbGciOiJIUzI1...
```

---

## Use Cases

- JWT Authentication
- OAuth Tokens
- API Keys
- Session Tokens

---

## Interview Answer

> **Auth Link automatically attaches authentication headers, such as JWT tokens, to every GraphQL request before it is sent to the server.**

---

# 2. Error Link

## What is Error Link?

Error Link intercepts GraphQL and network errors globally.

Instead of handling errors in every component, you can manage them in one place.

---

## Example

```tsx
import { onError } from "@apollo/client/link/error";

const errorLink = onError(
  ({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message }) => {
        console.log(message);
      });
    }

    if (networkError) {
      console.log(networkError);
    }
  }
);
```

---

## Use Cases

- Unauthorized (401)
- Forbidden (403)
- Token Expired
- Server Errors
- Logging Errors

---

## Interview Answer

> **Error Link centrally handles GraphQL and network errors, allowing consistent logging, user notifications, or authentication handling across the application.**

---

# 3. Retry Link

## What is Retry Link?

Retry Link automatically retries failed requests due to temporary issues.

---

## Example

```tsx
import { RetryLink } from "@apollo/client/link/retry";

const retryLink = new RetryLink({
  attempts: {
    max: 3,
  },
});
```

---

## Retry Flow

```text
Request

↓

Network Error

↓

Retry

↓

Retry

↓

Success
```

---

## Use Cases

- Temporary network failures
- Slow internet connections
- Server timeouts
- Mobile applications

---

## Interview Answer

> **Retry Link automatically retries failed GraphQL requests caused by temporary network issues, improving application reliability.**

---

# 4. Upload Link

## What is Upload Link?

Upload Link enables file uploads through GraphQL using multipart requests.

The default HTTP Link does not support file uploads.

---

## Installation

```bash
npm install apollo-upload-client
```

---

## Example

```tsx
import { createUploadLink } from "apollo-upload-client";

const uploadLink = createUploadLink({
  uri: "http://localhost:4000/graphql",
});
```

---

## Mutation Example

```graphql
mutation UploadFile($file: Upload!) {
  uploadFile(file: $file) {
    filename
  }
}
```

---

## React Example

```tsx
uploadFile({
  variables: {
    file,
  },
});
```

---

## Use Cases

- Profile Picture
- Documents
- PDFs
- Images
- Videos

---

## Interview Answer

> **Upload Link enables GraphQL file uploads by sending multipart form-data requests, which are not supported by the standard HTTP Link.**

---

# 5. Batch Link

## What is Batch Link?

Batch Link combines multiple GraphQL operations into a single HTTP request.

---

## Without Batch Link

```text
Query A

↓

HTTP Request

Query B

↓

HTTP Request

Query C

↓

HTTP Request
```

Three network requests.

---

## With Batch Link

```text
Query A

Query B

Query C

↓

Single HTTP Request

↓

Server
```

---

## Example

```tsx
import { BatchHttpLink } from "@apollo/client/link/batch-http";

const batchLink = new BatchHttpLink({
  uri: "http://localhost:4000/graphql",
});
```

---

## Benefits

- Fewer HTTP requests
- Reduced latency
- Better performance

---

## Use Cases

- Dashboard
- Multiple widgets
- Analytics pages
- Mobile applications

---

## Interview Answer

> **Batch Link groups multiple GraphQL operations into a single HTTP request, reducing network overhead and improving performance.**

---

# Combining Multiple Links

Apollo allows multiple links to be chained together.

```tsx
import { ApolloLink } from "@apollo/client";

const link = ApolloLink.from([
  authLink,
  errorLink,
  retryLink,
  uploadLink,
]);
```

---

## Complete Flow

```text
React

↓

Auth Link

↓

Retry Link

↓

Error Link

↓

Upload Link

↓

HTTP Link

↓

GraphQL Server
```

---

# Real Production Scenarios

| Scenario | Apollo Link |
|----------|-------------|
| JWT Authentication | Auth Link |
| OAuth Login | Auth Link |
| API Key | Auth Link |
| Expired Token | Error Link |
| Global Error Logging | Error Link |
| Retry on Network Failure | Retry Link |
| Mobile Internet Drops | Retry Link |
| Upload Profile Image | Upload Link |
| Upload Resume | Upload Link |
| Upload Product Images | Upload Link |
| Dashboard Widgets | Batch Link |
| Analytics Page | Batch Link |
| Reduce Mobile Requests | Batch Link |

---

# Comparison

| Link | Purpose | Common Use Case |
|------|---------|----------------|
| Auth Link | Add authentication headers | JWT, OAuth |
| Error Link | Handle GraphQL and network errors | 401, 500, Logging |
| Retry Link | Retry failed requests | Network failures |
| Upload Link | Upload files | Images, PDFs |
| Batch Link | Combine multiple operations | Dashboards |

---

# Interview Questions

## What is Apollo Link?

Apollo Link is middleware that intercepts GraphQL operations before they are sent to the server and after responses are received, enabling features such as authentication, error handling, retries, uploads, and batching.

---

## Why do we use Auth Link?

Auth Link automatically attaches authentication headers, such as JWT tokens or API keys, to every GraphQL request.

---

## Why use Error Link?

Error Link provides centralized handling of GraphQL and network errors, making it easier to log errors, show notifications, or redirect users after authentication failures.

---

## What is Retry Link?

Retry Link automatically retries failed requests caused by temporary issues like network interruptions or server timeouts.

---

## Why is Upload Link needed?

The default HTTP Link cannot upload files. Upload Link supports multipart form-data requests for GraphQL file uploads.

---

## What is Batch Link?

Batch Link combines multiple GraphQL operations into a single HTTP request, reducing the number of network calls and improving performance.

---

## Can multiple Apollo Links be used together?

Yes. Apollo Links are composable and can be chained using `ApolloLink.from()`.

Example:

```tsx
ApolloLink.from([
  authLink,
  errorLink,
  retryLink,
  httpLink,
]);
```

---

# Best Practices

- Use **Auth Link** for authentication headers.
- Handle authentication failures globally with **Error Link**.
- Retry only temporary failures using **Retry Link**.
- Use **Upload Link** for file uploads instead of the default HTTP Link.
- Use **Batch Link** to reduce network requests on pages with many queries.
- Keep Apollo Links modular and reusable.

---

# Quick Interview Summary

| Apollo Link | One-Line Explanation |
|-------------|----------------------|
| **Auth Link** | Adds authentication headers to every request. |
| **Error Link** | Handles GraphQL and network errors globally. |
| **Retry Link** | Retries failed requests automatically. |
| **Upload Link** | Enables GraphQL file uploads using multipart requests. |
| **Batch Link** | Combines multiple GraphQL operations into a single HTTP request. |

---

# Real-Time Subscriptions in Apollo Client – Complete Interview Guide

> Learn how GraphQL Subscriptions work, how Apollo Client implements real-time communication, and common production use cases.

---

# Table of Contents

1. What are GraphQL Subscriptions?
2. Why Do We Need Subscriptions?
3. How Subscriptions Work
4. HTTP vs WebSocket
5. Apollo Client Subscription Architecture
6. Setting Up Subscriptions
7. useSubscription Hook
8. Passing Variables
9. Handling Subscription Events
10. Production Scenarios
11. Best Practices
12. Interview Questions

---

# What are GraphQL Subscriptions?

A **GraphQL Subscription** is an operation that allows the server to **push real-time updates** to the client whenever data changes.

Unlike Queries and Mutations:

- **Query** → Read data once
- **Mutation** → Modify data
- **Subscription** → Listen for live updates

---

## GraphQL Operations

| Operation | Purpose | Communication |
|-----------|----------|---------------|
| Query | Read data | Client → Server |
| Mutation | Create/Update/Delete | Client → Server |
| Subscription | Receive live updates | Server → Client |

---

# Why Do We Need Subscriptions?

Without subscriptions, the client must repeatedly request data.

Example:

```text
Client

↓

GET Messages

↓

Wait 5 Seconds

↓

GET Messages Again

↓

Wait

↓

GET Messages Again
```

This is called **Polling**.

Problems:

- More network requests
- Higher server load
- Slower updates
- Poor user experience

---

With subscriptions:

```text
Client

↓

Connect Once

↓

Server Pushes Updates

↓

UI Updates Automatically
```

No repeated requests are needed.

---

# How Subscriptions Work

Subscriptions use **WebSockets**, which provide a persistent connection between the client and server.

### Flow

```text
Client

↓

WebSocket Connection

↓

GraphQL Server

↓

Data Changes

↓

Server Pushes Event

↓

Client Receives Update

↓

UI Re-renders
```

---

# HTTP vs WebSocket

| HTTP | WebSocket |
|------|-----------|
| Request-Response | Persistent Connection |
| Client requests data | Server pushes data |
| Short-lived connection | Long-lived connection |
| Best for Queries & Mutations | Best for Subscriptions |

---

# Apollo Client Subscription Architecture

```text
React Component
        │
        ▼
useSubscription()
        │
        ▼
Apollo Client
        │
        ▼
WebSocket Link
        │
        ▼
GraphQL Server
        │
        ▼
Real-Time Events
        │
        ▼
UI Updates
```

---

# Setting Up Subscriptions

## Install Required Package

```bash
npm install graphql-ws
```

---

## Create WebSocket Link

```tsx
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:4000/graphql",
  })
);
```

---

## Split HTTP and WebSocket Links

```tsx
import { split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);

    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);
```

---

# useSubscription Hook

## Syntax

```tsx
const { data, loading, error } =
useSubscription(SUBSCRIPTION);
```

---

## Example

```graphql
subscription MessageAdded {
  messageAdded {
    id
    text
    sender
  }
}
```

---

```tsx
import { gql, useSubscription } from "@apollo/client";

const MESSAGE_ADDED = gql`
subscription {
  messageAdded {
    id
    text
    sender
  }
}
`;

function Chat() {
  const { data, loading, error } =
    useSubscription(MESSAGE_ADDED);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  return <p>{data.messageAdded.text}</p>;
}
```

---

# Passing Variables

Subscriptions can receive variables.

```graphql
subscription Chat($roomId: ID!) {
  messageAdded(roomId: $roomId) {
    id
    text
  }
}
```

---

```tsx
const { data } = useSubscription(CHAT_SUBSCRIPTION, {
  variables: {
    roomId: "123",
  },
});
```

---

# Handling Subscription Events

```tsx
const { data } = useSubscription(MESSAGE_ADDED, {
  onData({ data }) {
    console.log(data);
  },
});
```

---

# Combining Query + Subscription

A common production pattern:

1. Load existing data with a query.
2. Listen for new updates with a subscription.

```text
Page Loads

↓

useQuery()

↓

Existing Messages

↓

useSubscription()

↓

New Messages Arrive

↓

Update UI
```

---

# Real Production Scenarios

## 1. Chat Application

Receive new messages instantly.

```graphql
subscription {
  messageAdded {
    id
    text
  }
}
```

---

## 2. Live Notifications

Push new notifications immediately.

---

## 3. Stock Market

Receive live stock price updates.

---

## 4. Sports Score

Update match scores in real time.

---

## 5. Live Auction

Show the latest bid instantly.

---

## 6. Food Delivery

Track order status changes.

Examples:

- Preparing
- Picked Up
- Out for Delivery
- Delivered

---

## 7. Ride Sharing

Driver location updates.

---

## 8. Cryptocurrency Dashboard

Real-time coin prices.

---

## 9. IoT Dashboard

Display live sensor data.

---

## 10. Online Multiplayer Games

Synchronize player actions.

---

## 11. Collaborative Document Editing

Receive live edits from other users.

---

## 12. Customer Support Chat

Receive agent replies instantly.

---

## 13. Live Dashboard

Update KPIs without refreshing the page.

---

## 14. Social Media

Receive:

- New comments
- Likes
- Followers
- Notifications

---

## 15. Hospital Monitoring

Live patient monitoring systems.

---

# Subscription vs Polling

| Subscription | Polling |
|--------------|----------|
| Server pushes updates | Client repeatedly requests data |
| Uses WebSockets | Uses HTTP |
| Real-time | Delayed updates |
| Lower network traffic | Higher network traffic |
| Better performance | Less efficient |

---

# Best Practices

- Use subscriptions only for real-time features.
- Use queries for initial data loading.
- Combine queries with subscriptions for optimal UX.
- Handle WebSocket reconnection gracefully.
- Authenticate WebSocket connections.
- Close subscriptions when components unmount.
- Avoid subscriptions for data that changes infrequently.

---

# Interview Questions

## What is a GraphQL Subscription?

A GraphQL Subscription allows the server to push real-time updates to connected clients whenever subscribed data changes.

---

## What protocol do GraphQL Subscriptions use?

GraphQL Subscriptions typically use **WebSockets**, which maintain a persistent, bidirectional connection between the client and server.

---

## What is the difference between Query and Subscription?

| Query | Subscription |
|--------|--------------|
| Fetches data once | Listens for continuous updates |
| HTTP | WebSocket |
| Client requests data | Server pushes data |

---

## Why use WebSockets instead of HTTP?

HTTP requires a new request for every update. WebSockets keep a persistent connection open, allowing the server to push updates instantly without repeated requests.

---

## When should you use subscriptions?

Use subscriptions for:

- Chat applications
- Live notifications
- Stock prices
- Sports scores
- Order tracking
- Live dashboards
- Collaborative editing

---

## What is the difference between Polling and Subscriptions?

Polling repeatedly requests data at fixed intervals, while subscriptions receive updates instantly from the server through a persistent WebSocket connection.

---

## Can Queries and Subscriptions be used together?

Yes. A common production pattern is to use a query to load initial data and a subscription to receive future updates in real time.

---

# Quick Interview Summary

| Concept | Summary |
|---------|---------|
| **Subscription** | Receives real-time updates from the server. |
| **Protocol** | WebSocket |
| **Apollo Hook** | `useSubscription()` |
| **Best For** | Chat, Notifications, Live Tracking |
| **Advantage** | Instant updates with fewer network requests |
| **Alternative** | Polling (less efficient) |

---

# 30-Second Interview Answer

> **GraphQL Subscriptions enable real-time communication between the client and server using WebSockets. Unlike queries, which fetch data once, subscriptions keep a persistent connection open and allow the server to push updates whenever data changes. In Apollo Client, we use the `useSubscription()` hook for features such as chat applications, live notifications, stock prices, order tracking, and collaborative editing. A common production approach is to load initial data with `useQuery()` and then keep it updated using `useSubscription()`.**
