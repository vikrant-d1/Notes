# GraphQL Client Interview Guide (React + Apollo Client)


# What is a GraphQL Client?

A GraphQL Client is a frontend library that communicates with a GraphQL server. It executes queries, mutations, and subscriptions while providing built-in caching, loading and error state management, authentication, pagination, optimistic UI updates, and automatic cache synchronization.

---

## Using Apollo Client vs Fetch

Using `fetch()` requires manually handling authentication, loading states, errors, caching, retries, pagination, and UI updates. A GraphQL client like Apollo Client provides these features out of the box, reducing boilerplate code and improving performance and developer productivity.

---

# Why is Caching Important?

Caching stores previously fetched data locally, reducing unnecessary network requests, improving application performance, and delivering a faster user experience.

---

# What is Cache Normalization?
Cache normalization stores every object only once using a unique identifier, typically `id` and `__typename`. Multiple queries reference the same cached object, ensuring consistency and efficient updates throughout the application.

---

# What is Optimistic UI?
Optimistic UI immediately updates the interface after a user action by assuming the server request will succeed. If the request later fails, the client rolls back the optimistic changes to maintain consistency.

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

`useQuery()` automatically executes when the component renders, making it ideal for loading initial page data. `useLazyQuery()` waits until its trigger function is called, making it suitable for search, filters, or button-triggered requests.

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

## What is a GraphQL Client?
 A GraphQL Client is a library that communicates with a GraphQL server and provides features such as executing queries, mutations, subscriptions, caching, authentication, loading and error state management, pagination, and automatic UI synchronization.

---

## Why not use `fetch()`?

Because `fetch()` requires manually implementing authentication, loading states, error handling, caching, retries, pagination, and state management. GraphQL clients handle these concerns automatically.

---

## Why is caching important?

Caching stores previously fetched data locally, reducing unnecessary network requests, improving application performance, and providing a faster user experience.

---

## What is cache normalization?

Cache normalization stores each object only once using a unique identifier (typically `id` and `__typename`), allowing all queries to reference the same object and keeping data consistent across the application.

---

## What is Optimistic UI?

Optimistic UI immediately updates the interface before receiving the server response, providing a smoother user experience. If the request fails, the client automatically rolls back the optimistic update.

---

## Difference between `useQuery()` and `useLazyQuery()`?

`useQuery()` executes automatically when the component renders, making it suitable for initial page data. `useLazyQuery()` executes only when explicitly triggered, making it ideal for search forms, filters, or button clicks.

---


# Apollo Client Hooks 

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

## Interview Definition

useQuery() automatically executes a GraphQL query when a component mounts and returns loading, error, and data states while integrating with Apollo Client's cache.*

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

## Interview Definition

useLazyQuery() provides manual control over query execution. Unlike useQuery(), it runs only when the returned function is called.

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

## Interview Definition

> useMutation() executes GraphQL mutations for creating, updating, or deleting data and provides loading, error, and response states.

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

## Interview Definition

useSubscription() listens for real-time GraphQL events over a WebSocket connection and updates the UI automatically when new data is received.

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

useFragment() reads normalized data directly from Apollo Client's cache using GraphQL fragments, avoiding unnecessary network requests.

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

useReactiveVar() subscribes a component to Apollo Reactive Variables, allowing local state updates without external state management libraries.

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

useApolloClient() returns the Apollo Client instance, allowing manual execution of queries, mutations, cache updates, and store management.

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
Learn how Apollo Client's cache works internally, how cache normalization improves performance, and how to answer interview questions confidently.

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

In production, the fetch policy depends on the use case. I use `cache-first` for dashboards and profiles, `cache-and-network` for feeds and product lists, `network-only` for reports and live data, `no-cache` for login and payment flows, `cache-only` for offline features, and `standby` for inactive screens. After mutations, I prefer updating Apollo's normalized cache with `cache.modify()` or `writeFragment()` rather than refetching entire queries whenever possible.
>
> # Apollo Links (Auth, Error, Retry, Upload, Batch) – Complete Interview Guide


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

Error Link centrally handles GraphQL and network errors, allowing consistent logging, user notifications, or authentication handling across the application.

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

Retry Link automatically retries failed GraphQL requests caused by temporary network issues, improving application reliability.

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

Batch Link groups multiple GraphQL operations into a single HTTP request, reducing network overhead and improving performance.

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

## What is the difference between Polling and Subscriptions?

Polling repeatedly requests data at fixed intervals, while subscriptions receive updates instantly from the server through a persistent WebSocket connection.

---

## Can Queries and Subscriptions be used together?

Yes. A common production pattern is to use a query to load initial data and a subscription to receive future updates in real time.

---



# 30-Second Interview Answer

GraphQL Subscriptions enable real-time communication between the client and server using WebSockets. Unlike queries, which fetch data once, subscriptions keep a persistent connection open and allow the server to push updates whenever data changes. In Apollo Client, we use the `useSubscription()` hook for features such as chat applications, live notifications, stock prices, order tracking, and collaborative editing. A common production approach is to load initial data with `useQuery()` and then keep it updated using `useSubscription()`.


# GraphQL Refresh Token Flow Guide

A straightforward, practical guide to understanding, architecting, and implementing a robust **Access & Refresh Token Authentication Flow** in GraphQL APIs.

---


## Overview

In JWT-based authentication, keeping tokens short-lived enhances security. However, requiring users to log in repeatedly creates a poor user experience. 

The **Refresh Token Flow** balances security and UX using two distinct tokens:

* **Access Token:** Short-lived (e.g., 15 minutes). Sent with every GraphQL request to authorize operations.
* **Refresh Token:** Long-lived (e.g., 7–30 days). Used exclusively to request a new Access Token once the current one expires.

---

## How the Flow Works

```
  +--------+                                           +----------------+
  | Client |                                           | GraphQL Server |
  +---+----+                                           +-------+--------+
      |                                                        |
      |---------------- 1. Login Mutation -------------------->|
      |<--------------- 2. Returns Access + Refresh Token -----|
      |                                                        |
      |---------------- 3. Query / Mutation with Access Token ->|
      |<--------------- 4. Returns Request Data ---------------|
      |                                                        |
  [ Access Token Expires ]                                     |
      |                                                        |
      |---------------- 5. Query / Mutation (Expired) -------->|
      |<--------------- 6. Auth Error (UNAUTHENTICATED) -------|
      |                                                        |
      |---------------- 7. Refresh Token Mutation ------------>|
      |<--------------- 8. Returns New Access Token -----------|
      |                                                        |
      |---------------- 9. Retry Original Query / Mutation --->|
      |<--------------- 10. Returns Request Data --------------|
      |                                                        |
```

---

## Architecture & Storage Options

### Option 1: GraphQL Mutation (Mobile & Cross-Platform)

* **Access Token:** Saved in memory or encrypted mobile storage (e.g., Keychain / Keystore).
* **Refresh Token:** Saved in secure storage and sent manually via a `refreshToken` GraphQL mutation argument.
* **Best for:** Mobile apps (React Native, iOS, Android) and desktop clients.

### Option 2: HTTP-Only Cookies (Web Security Best Practice)

* **Access Token:** Kept in-memory within JavaScript (e.g., a React state or Apollo cache variable).
* **Refresh Token:** Set by the server in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
* **Best for:** Web applications (protects against XSS attacks stealing refresh tokens).

---

## GraphQL Schema Design

```graphql
type User {
  id: ID!
  email: String!
  name: String!
}

type AuthPayload {
  accessToken: String!
  refreshToken: String
  user: User!
}

type TokenRefreshPayload {
  accessToken: String!
  refreshToken: String
}

type Query {
  me: User
}

type Mutation {
  login(email: String!, password: String!): AuthPayload!
  refreshToken(refreshToken: String): TokenRefreshPayload!
  logout: Boolean!
}
```

---

## Client Implementation (Apollo Client Example)

Below is an automated token-refresh setup using Apollo Client's `onError` link to catch `UNAUTHENTICATED` errors, refresh the access token silently, and retry failed operations.

```javascript
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { onError } from '@apollo/link-error';
import { setContext } from '@apollo/client/link/context';

let accessToken = ''; // Held safely in memory

const httpLink = createHttpLink({
  uri: 'https://api.yourdomain.com/graphql',
});

// Middleware: Attach current Access Token to Authorization header
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `Bearer ${accessToken}` : '',
    },
  };
});

// Helper: Fetch a new access token using the refresh token flow
async function getNewAccessToken() {
  const response = await fetch('https://api.yourdomain.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation RefreshToken {
          refreshToken {
            accessToken
          }
        }
      `,
    }),
    credentials: 'include', // Needed if refresh token is in an HttpOnly cookie
  });

  const result = await response.json();
  const newToken = result?.data?.refreshToken?.accessToken;

  if (!newToken) {
    throw new Error('Failed to refresh token');
  }

  return newToken;
}

// Error Link: Catch 401/UNAUTHENTICATED errors and handle retries
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        return from(
          getNewAccessToken()
            .then((newToken) => {
              accessToken = newToken;

              // Update original operation headers
              const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${newToken}`,
                },
              });

              // Retry the failed operation
              return forward(operation);
            })
            .catch((refreshErr) => {
              // Refresh failed - redirect to login or clear app state
              accessToken = '';
              window.location.href = '/login';
            })
        );
      }
    }
  }
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
```

---

## Server-Side Implementation (Node.js Example)

Here is how you handle the token verification and refresh mutation on an Express / GraphQL server context:

```javascript
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

export const resolvers = {
  Mutation: {
    refreshToken: async (_, { refreshToken: tokenInput }, { req, res }) => {
      // Get refresh token from cookie or mutation argument
      const token = req.cookies?.refreshToken || tokenInput;

      if (!token) {
        throw new Error('Refresh token missing');
      }

      try {
        // Verify token payload
        const payload = jwt.verify(token, REFRESH_SECRET);

        // Optional: Check database / Redis to verify token hasn't been revoked
        // const isValid = await checkTokenInDb(payload.userId, token);
        // if (!isValid) throw new Error('Token revoked');

        // Generate new Access Token
        const newAccessToken = jwt.sign(
          { userId: payload.userId },
          ACCESS_SECRET,
          { expiresIn: '15m' }
        );

        return {
          accessToken: newAccessToken,
        };
      } catch (err) {
        throw new Error('Invalid or expired refresh token');
      }
    },
  },
};
```

---

## Security Best Practices

1. **Token Rotation:** Issue a new Refresh Token alongside every new Access Token. Invalidate the old Refresh Token immediately.
2. **Reuse Detection:** If a revoked or previously used Refresh Token is presented, immediately revoke all active Refresh Tokens for that user account (signals potential theft).
3. **Database / Redis Whitelist or Blacklist:** Store active Refresh Token IDs (or family UUIDs) in Redis so users can log out from all devices or revoke sessions instantly.
4. **Prevent Retry Loops:** Limit token refresh attempts on the client to a single retry per request. If the refresh request fails, log out the user.
5. **Secure Cookie Settings:** When using cookies for refresh tokens on web apps, enforce:
   * `HttpOnly: true` (prevents client-side JS access)
   * `Secure: true` (ensures transmission over HTTPS only)
   * `SameSite: Strict` or `Lax` (protects against CSRF)


# GraphQL Pagination with Apollo Client (`fetchMore` + `merge`)

A comprehensive guide to implementing seamless, cache-aware pagination in GraphQL applications using Apollo Client's `fetchMore` function and `InMemoryCache` `typePolicies` (`merge` functions).

---


## Overview

Handling paginated data efficiently in GraphQL requires coordinating two main responsibilities:
1. **Executing the Next Page Request (`fetchMore`):** Triggering network requests with updated pagination parameters (e.g., `offset`, `after` cursor).
2. **Normalized Cache Management (`merge` function):** Telling Apollo Client’s `InMemoryCache` how to combine newly arrived pages with existing cached data rather than overwriting it.

In **Apollo Client v3+**, field merging is decoupled from UI components and configured globally inside `typePolicies`.

---

## Core Architecture

```
  +------------------+         1. Trigger fetchMore(variables)        +-------------------+
  |  React Component | ----------------------------------------------> |   Apollo Client   |
  +------------------+                                                +---------+---------+
           ^                                                                    |
           | 5. Re-renders UI                                                   | 2. Network Query
           |    with merged list                                                v
  +--------+---------+                                                +-------------------+
  |  InMemoryCache   | <--------------------------------------------- |   GraphQL Server  |
  +------------------+         4. Merges & stores array               +-------------------+
                               3. Executes field `merge()` policy
```

---

## GraphQL Schema & Query Design

### Offset-Based Query Example

```graphql
query GetPosts($offset: Int!, $limit: Int!) {
  posts(offset: $offset, limit: $limit) {
    id
    title
    createdAt
    author {
      id
      name
    }
  }
}
```

---

## Cache Configuration (`typePolicies` & `merge`)

By default, Apollo Client replaces field values when new data arrives. To append paginated data seamlessly, configure a field policy.

### Option A: Custom Offset-Based Merge Function

```javascript
import { ApolloClient, InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        posts: {
          // Key arguments determine when separate cache arrays are created.
          // Set to `false` if all args relate only to pagination.
          // Include filter fields if filtering is supported (e.g., keyArgs: ['category']).
          keyArgs: false,

          merge(existing = [], incoming, { args }) {
            const merged = existing.slice(0);
            const offset = args?.offset ?? 0;

            for (let i = 0; i < incoming.length; ++i) {
              merged[offset + i] = incoming[i];
            }

            return merged;
          },
        },
      },
    },
  },
});
```

### Option B: Using Apollo's Built-in Helpers

Apollo Client provides utility functions for standard pagination patterns:

```javascript
import { InMemoryCache } from '@apollo/client';
import { offsetLimitPagination, concatPagination } from '@apollo/client/utilities';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Automatically handles offset & limit array merging
        posts: offsetLimitPagination(['category']),

        // Simple concatenation (ideal for infinite scrolling feeds without offsets)
        // notifications: concatPagination(),
      },
    },
  },
});
```

---

## Client UI Integration (React Example)

Use the `fetchMore` function returned by `useQuery` to load subsequent data pages.

```jsx
import React from 'react';
import { useQuery, gql } from '@apollo/client';

const GET_POSTS = gql`
  query GetPosts($offset: Int!, $limit: Int!) {
    posts(offset: $offset, limit: $limit) {
      id
      title
    }
  }
`;

export function PostList() {
  const { data, loading, fetchMore } = useQuery(GET_POSTS, {
    variables: { offset: 0, limit: 10 },
  });

  const loadMore = () => {
    fetchMore({
      variables: {
        offset: data.posts.length, // Shift offset by current items count
      },
    });
  };

  if (loading && !data) return <p>Loading initial posts...</p>;

  return (
    <div>
      <h2>Posts</h2>
      <ul>
        {data?.posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>

      <button onClick={loadMore} disabled={loading}>
        {loading ? 'Loading more...' : 'Load More'}
      </button>
    </div>
  );
}
```

---

## Cursor-Based Pagination (Relay Connection Specification)

For production systems handling frequent writes, cursor-based pagination prevents items from being skipped or duplicated.

### Field Policy Setup:

```javascript
import { InMemoryCache } from '@apollo/client';
import { relayStylePagination } from '@apollo/client/utilities';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        postsConnection: relayStylePagination(['filter']),
      },
    },
  },
});
```

### React Component Implementation:

```jsx
import React from 'react';
import { useQuery, gql } from '@apollo/client';

const GET_POSTS_CURSOR = gql`
  query GetPosts($after: String, $first: Int!) {
    postsConnection(after: $after, first: $first) {
      edges {
        cursor
        node {
          id
          title
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function CursorPostList() {
  const { data, loading, fetchMore } = useQuery(GET_POSTS_CURSOR, {
    variables: { first: 10, after: null },
  });

  const connection = data?.postsConnection;
  const pageInfo = connection?.pageInfo;

  const loadMore = () => {
    if (pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          after: pageInfo.endCursor,
        },
      });
    }
  };

  return (
    <div>
      <ul>
        {connection?.edges.map(({ node }) => (
          <li key={node.id}>{node.title}</li>
        ))}
      </ul>

      {pageInfo?.hasNextPage && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

---

## Best Practices & Common Pitfalls

1. **Configure `keyArgs` Carefully:** If your paginated query accepts filter/search arguments (e.g., `category`, `searchTerm`), pass them into `keyArgs` (e.g., `keyArgs: ['category']`). Otherwise, results from different filters will merge into a single list.
2. **Avoid `updateQuery` in Apollo Client v3:** Do not pass `updateQuery` inside `fetchMore()`. Centralizing merge logic in `typePolicies` maintains a single source of truth for cache operations.
3. **Prevent Duplicate Keys:** Ensure unique identifiers (`id`) are returned for each entity in the list so React and Apollo Client can track items accurately.
4. **Handle Refetching Cleanly:** When re-running a search query or resetting filters, use `refetch()` or clear the cache variable to reset the pagination state to page 1.

# Apollo Client Type Policies Guide

In Apollo Client v3+, **Type Policies** are the primary mechanism for customizing how the `InMemoryCache` stores, reads, and merges data for specific GraphQL types and fields.

Setting up type policies moves client-side state and caching logic out of UI components and into a centralized, predictable cache configuration.

----


## Overview

By default, Apollo Client's `InMemoryCache` normalizes incoming GraphQL objects using their `__typename` and `id` (or `_id`) properties. 

**Type Policies** allow you to override default behaviors to:
* Customize primary keys for normalized entity storage.
* Define computed or client-only local state fields using `@client`.
* Centralize array pagination (`merge`) logic.
* Control how field arguments affect cache key separation (`keyArgs`).

---

## Basic Type Policy Structure

Type policies are declared inside the `typePolicies` map when initializing `InMemoryCache`.

```javascript
import { ApolloClient, InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    // Key matches a GraphQL Type name or 'Query' / 'Mutation'
    Product: {
      keyFields: ['sku'], // Custom primary key
      fields: {
        priceWithTax: {
          read(price) {
            return price * 1.2; // Computed field transformation
          },
        },
      },
    },
  },
});
```

---

## Key Features

### 1. Customizing Record Identification (`keyFields`)

If an entity does not use `id` as its unique identifier or uses a composite key, configure `keyFields`.

```javascript
const cache = new InMemoryCache({
  typePolicies: {
    User: {
      // Use 'uuid' instead of 'id'
      keyFields: ['uuid'],
    },
    Book: {
      // Composite primary key (ISBN + Edition)
      keyFields: ['isbn', 'edition'],
    },
    SystemSettings: {
      // Singleton object: always stored under a single cache key
      keyFields: [],
    },
  },
});
```

---

### 2. Managing Field Behaviors (`fields`)

The `fields` mapping specifies field-level policy configurations for a given type:

```javascript
typePolicies: {
  User: {
    fields: {
      // Define read, merge, or keyArgs for specific fields
    },
  },
}
```

---

### 3. Reading Cached Values (`read` functions)

A field's `read` function derives or formats values on the fly whenever the cache is queried.

```javascript
const cache = new InMemoryCache({
  typePolicies: {
    User: {
      fields: {
        // Derive a full name dynamically from cached fields
        fullName: {
          read(_, { readField }) {
            const firstName = readField('firstName');
            const lastName = readField('lastName');
            return `${firstName} ${lastName}`;
          },
        },
      },
    },
  },
});
```

---

### 4. Customizing Cache Merges (`merge` functions)

When new query data arrives, Apollo Client replaces old field values by default. A `merge` function defines how to combine new data with existing data in the cache (essential for paginated arrays).

```javascript
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        feed: {
          keyArgs: false, // Treat all page requests as part of the same list

          merge(existing = [], incoming, { args }) {
            const merged = existing.slice(0);
            const offset = args?.offset ?? 0;

            for (let i = 0; i < incoming.length; ++i) {
              merged[offset + i] = incoming[i];
            }

            return merged;
          },
        },
      },
    },
  },
});
```

---

### 5. Filtering Arguments (`keyArgs`)

`keyArgs` determines which field arguments cause Apollo Client to create separate cache instances.

* `keyArgs: false` — Ignore all arguments (useful for pagination where args like `offset` shouldn't split the array into separate cache entries).
* `keyArgs: ['category']` — Maintain independent cache lists per `category` argument value.

```javascript
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        products: {
          // Maintain separate lists per category, ignoring pagination arguments
          keyArgs: ['category'],
        },
      },
    },
  },
});
```

---

## Complete Real-World Example

A complete `InMemoryCache` setup using custom entity keys, reactive variables, computed local fields, and built-in pagination helpers:

```javascript
import { ApolloClient, InMemoryCache, makeVar } from '@apollo/client';
import { offsetLimitPagination } from '@apollo/client/utilities';

// Reactive Variable for local state
export const isLoggedInVar = makeVar(false);

export const cache = new InMemoryCache({
  typePolicies: {
    // Root Query type policies
    Query: {
      fields: {
        // 1. Client-only field backed by Reactive Variables
        isLoggedIn: {
          read() {
            return isLoggedInVar();
          },
        },
        // 2. Paginated field using standard helper
        searchResults: offsetLimitPagination(['query']),
      },
    },

    // Entity type policies
    Article: {
      keyFields: ['slug'], // Identify articles by 'slug' instead of 'id'
      fields: {
        // Formatted timestamp string computed at read-time
        publishedAtFormatted: {
          read(_, { readField }) {
            const rawDate = readField('publishedAt');
            return rawDate ? new Date(rawDate).toLocaleDateString() : '';
          },
        },
      },
    },
  },
});
```

---

## Best Practices

1. **Centralize Cache Logic:** Define `merge` and `read` functions inside `typePolicies` instead of passing inline `updateQuery` functions to `fetchMore`.
2. **Safely Access Fields with `readField`:** Always use the `readField('fieldName')` helper function inside `read` and `merge` policies to ensure safe entity references.
3. **Set `keyArgs` Explicitly for Filtered Lists:** Specify `keyArgs` on list queries to prevent search or category filters from corrupting or merging into a single list.
4. **Leverage Built-in Utilities:** Prefer using standard Apollo helpers (`offsetLimitPagination()`, `relayStylePagination()`) before writing custom `merge` functions.

# 🚀 Apollo Client Testing Guide

A practical guide and reference for testing GraphQL operations, cache interactions, reactive variables, and custom field policies in React applications using Apollo Client.

---

## Overview

Testing Apollo Client code usually falls into two main categories:

1. **Integration Tests (React Components):** Testing how components behave during loading, error, and success states using Apollo's official `MockedProvider` or `mock-apollo-client`.
2. **Unit Tests (Logic & Cache):** Directly testing `InMemoryCache`, `typePolicies`, or `makeVar` functions in pure JavaScript without rendering React components.

---

## 1. Testing Components with Static Mocks

Apollo Client provides `<MockedProvider />` from `@apollo/client/testing` to simulate network responses without running a GraphQL server.

### Queries

```jsx
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { UserProfile, GET_USER } from './UserProfile';

const mocks = [
  {
    request: {
      query: GET_USER,
      variables: { id: '1' },
    },
    result: {
      data: {
        user: { __typename: 'User', id: '1', name: 'Alex Johnson' },
      },
    },
  },
];

it('renders user data after loading', async () => {
  render(
    <MockedProvider mocks={mocks}>
      <UserProfile userId="1" />
    </MockedProvider>
  );

  // Assert initial loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Assert async success state
  expect(await screen.findByText('Alex Johnson')).toBeInTheDocument();
});
```

### Mutations

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { UpdateUserForm, UPDATE_USER_NAME } from './UpdateUserForm';

const mutationMocks = [
  {
    request: {
      query: UPDATE_USER_NAME,
      variables: { id: '1', name: 'Sam Smith' },
    },
    result: {
      data: {
        updateUser: { __typename: 'User', id: '1', name: 'Sam Smith' },
      },
    },
  },
];

it('submits updated user name', async () => {
  render(
    <MockedProvider mocks={mutationMocks}>
      <UpdateUserForm userId="1" />
    </MockedProvider>
  );

  await userEvent.type(screen.getByRole('textbox'), 'Sam Smith');
  await userEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(await screen.findByText('Name updated successfully!')).toBeInTheDocument();
});
```

### Handling GraphQL & Network Errors

```js
// GraphQL Error (Server returns errors array)
const graphqlErrorMock = {
  request: { query: GET_USER, variables: { id: '99' } },
  result: {
    errors: [{ message: 'User not found' }],
  },
};

// Network Error (Connection drop or failure)
const networkErrorMock = {
  request: { query: GET_USER, variables: { id: '99' } },
  error: new Error('Failed to connect to server'),
};
```

---

## 2. Testing Cache Updates

### Integration Tests (`update` functions)

Pass a custom `InMemoryCache` seeded with initial state into `<MockedProvider>` to verify that a mutation updates the local cache and re-renders dependent components.

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { InMemoryCache } from '@apollo/client';
import { TodoList, GET_TODOS } from './TodoList';
import { AddTodo, ADD_TODO } from './AddTodo';

it('updates the cache and appends new item to list', async () => {
  const cache = new InMemoryCache();

  // 1. Seed initial cache
  cache.writeQuery({
    query: GET_TODOS,
    data: {
      todos: [{ __typename: 'Todo', id: '1', text: 'Initial Task' }],
    },
  });

  const mocks = [
    {
      request: { query: ADD_TODO, variables: { text: 'New Task' } },
      result: {
        data: { addTodo: { __typename: 'Todo', id: '2', text: 'New Task' } },
      },
    },
  ];

  render(
    <MockedProvider cache={cache} mocks={mocks}>
      <div>
        <TodoList />
        <AddTodo />
      </div>
    </MockedProvider>
  );

  expect(screen.getByText('Initial Task')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /add task/i }));

  // Verified from local cache update without needing a GET_TODOS mock refetch
  expect(await screen.findByText('New Task')).toBeInTheDocument();
});
```

### Direct Cache Unit Tests (`readQuery` / `writeQuery`)

Unit test cache helper logic in pure JavaScript without rendering React components:

```js
import { InMemoryCache } from '@apollo/client';
import { appendTodoToCache } from './cacheHelpers';
import { GET_TODOS } from './queries';

it('appends todo item directly to cache', () => {
  const cache = new InMemoryCache();

  cache.writeQuery({
    query: GET_TODOS,
    data: { todos: [{ __typename: 'Todo', id: '1', text: 'Task 1' }] },
  });

  appendTodoToCache(cache, { __typename: 'Todo', id: '2', text: 'Task 2' });

  const updated = cache.readQuery({ query: GET_TODOS });

  expect(updated.todos).toHaveLength(2);
  expect(updated.todos[1].text).toBe('Task 2');
});
```

---

## 3. Testing Custom `typePolicies` & Field Policies

Field policies dictate how `InMemoryCache` reads, normalizes, and merges fields. Test them by instantiating `InMemoryCache` directly with your custom configuration.

### Pagination `merge` Functions

```js
import { InMemoryCache, gql } from '@apollo/client';

const cacheConfig = {
  typePolicies: {
    Query: {
      fields: {
        todos: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
  },
};

const GET_TODOS = gql`
  query GetTodos($offset: Int) {
    todos(offset: $offset) {
      id
      text
    }
  }
`;

it('merges paginated pages in cache', () => {
  const cache = new InMemoryCache(cacheConfig);

  // Page 1
  cache.writeQuery({
    query: GET_TODOS,
    variables: { offset: 0 },
    data: { todos: [{ __typename: 'Todo', id: '1', text: 'Task 1' }] },
  });

  // Page 2
  cache.writeQuery({
    query: GET_TODOS,
    variables: { offset: 1 },
    data: { todos: [{ __typename: 'Todo', id: '2', text: 'Task 2' }] },
  });

  const data = cache.readQuery({ query: GET_TODOS });
  expect(data.todos).toHaveLength(2);
});
```

### Local Computed `read` Fields

```js
import { InMemoryCache, gql } from '@apollo/client';

const userTypePolicy = {
  typePolicies: {
    User: {
      fields: {
        fullName: {
          read(_, { readField }) {
            return `${readField('firstName')} ${readField('lastName')}`;
          },
        },
      },
    },
  },
};

const GET_USER = gql`
  query GetUser {
    user {
      id
      firstName
      lastName
      fullName @client
    }
  }
`;

it('computes local field using read policy', () => {
  const cache = new InMemoryCache(userTypePolicy);

  cache.writeQuery({
    query: GET_USER,
    data: {
      user: { __typename: 'User', id: '1', firstName: 'John', lastName: 'Doe' },
    },
  });

  const data = cache.readQuery({ query: GET_USER });
  expect(data.user.fullName).toBe('John Doe');
});
```

---

## 4. Testing Reactive Variables (`makeVar`)

### Pure Unit Tests

```js
import { makeVar } from '@apollo/client';

export const cartItemsVar = makeVar([]);

describe('cartItemsVar', () => {
  beforeEach(() => {
    cartItemsVar([]); // Reset state
  });

  it('updates reactive variable state', () => {
    cartItemsVar([{ id: '1', name: 'Item A' }]);
    expect(cartItemsVar()).toEqual([{ id: '1', name: 'Item A' }]);
  });

  it('notifies subscribers on update', () => {
    const spy = jest.fn();
    const unsubscribe = cartItemsVar.onNextChange(spy);

    cartItemsVar([{ id: '2', name: 'Item B' }]);

    expect(spy).toHaveBeenCalledWith([{ id: '2', name: 'Item B' }]);
    unsubscribe();
  });
});
```

### Testing Reactive Variables with Component Integration

Pass the custom `InMemoryCache` to `<MockedProvider>` when components rely on `@client` fields backed by `makeVar`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { InMemoryCache, makeVar, gql, useQuery } from '@apollo/client';

const isDarkModeVar = makeVar(false);

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        isDarkMode: {
          read() {
            return isDarkModeVar();
          },
        },
      },
    },
  },
});

const GET_THEME = gql`
  query GetTheme {
    isDarkMode @client
  }
`;

function ThemeToggle() {
  const { data } = useQuery(GET_THEME);
  return (
    <button onClick={() => isDarkModeVar(!isDarkModeVar())}>
      Theme: {data?.isDarkMode ? 'Dark' : 'Light'}
    </button>
  );
}

it('updates UI when reactive variable toggles', async () => {
  isDarkModeVar(false);

  render(
    <MockedProvider cache={cache}>
      <ThemeToggle />
    </MockedProvider>
  );

  expect(screen.getByText('Theme: Light')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button'));

  expect(await screen.findByText('Theme: Dark')).toBeInTheDocument();
});
```

---

## 5. Flexible Testing with `mock-apollo-client`

For dynamic resolver logic or wildcard responses without static mock objects, use [`mock-apollo-client`](https://github.com/mike-plaid/mock-apollo-client).

```jsx
import { render, screen } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client';
import { createMockClient } from 'mock-apollo-client';
import { UserProfile, GET_USER } from './UserProfile';

it('handles dynamic queries using resolver functions', async () => {
  const mockClient = createMockClient();

  // Handle dynamic requests based on incoming variables
  const handler = jest.fn().mockImplementation((variables) =>
    Promise.resolve({
      data: {
        user: { __typename: 'User', id: variables.id, name: `User ${variables.id}` },
      },
    })
  );

  mockClient.setRequestHandler(GET_USER, handler);

  render(
    <ApolloProvider client={mockClient}>
      <UserProfile userId="42" />
    </ApolloProvider>
  );

  expect(await screen.findByText('User 42')).toBeInTheDocument();
  expect(handler).toHaveBeenCalledWith({ id: '42' });
});
```

---

## Best Practices & Caveats

1. **Always Include `__typename`:** Apollo Client relies on `__typename` for normalization. Omitting it in mock responses can break cache operations.
2. **Match Variables Exactly:** In `<MockedProvider>`, query variables must match the request object **1:1**, including types and key ordering.
3. **Reset State in `beforeEach`:** Reactive variables (`makeVar`) live in global module scope. Reset them before each test run to avoid inter-test leaks.
4. **Duplicate Mocks for Re-runs:** Each mock object in `<MockedProvider>`'s `mocks` array is consumed once. If a query fires twice during a test, supply the mock object twice in the array.