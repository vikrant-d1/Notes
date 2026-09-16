# LangGraph JavaScript — Interview Questions & Answers

## 📚 Official Documentation

- **[LangGraph JavaScript Documentation](https://docs.langchain.com/oss/javascript/langgraph/overview)**
- [LangGraph JavaScript Quickstart](https://docs.langchain.com/oss/javascript/langgraph/quickstart)
- [Choosing between Graph API and Functional API](https://docs.langchain.com/oss/javascript/langgraph/choosing-apis)
- [LangGraph Functional API](https://docs.langchain.com/oss/javascript/langgraph/use-functional-api)
- [LangGraph Application Structure](https://docs.langchain.com/oss/javascript/langgraph/application-structure)

---

# 🔥 Top 15 LangGraph Interview Questions

1. [What is LangGraph and why do we need it?](#1-what-is-langgraph-and-why-do-we-need-it)
2. [LangChain vs LangGraph](#2-langchain-vs-langgraph)
3. [What are State, Node, and Edge?](#3-what-are-state-node-and-edge)
4. [What are Conditional Edges?](#4-what-are-conditional-edges)
5. [Graph API vs Functional API](#5-graph-api-vs-functional-api)
6. [What is a Reducer?](#6-what-is-a-reducer)
7. [What is MessagesValue?](#7-what-is-messagesvalue)
8. [What is Checkpointing?](#8-what-is-checkpointing)
9. [What is Durable Execution?](#9-what-is-durable-execution)
10. [How does Memory work in LangGraph?](#10-how-does-memory-work-in-langgraph)
11. [How do you implement Human-in-the-loop?](#11-how-do-you-implement-human-in-the-loop)
12. [How do you implement an LLM + Tool loop?](#12-how-do-you-implement-an-llm--tool-loop)
13. [How do you handle retries and failures?](#13-how-do-you-handle-retries-and-failures)
14. [How would you design a Multi-Agent system?](#14-how-would-you-design-a-multi-agent-system)
15. [How would you design a Production LangGraph application?](#15-how-would-you-design-a-production-langgraph-application)

---

# 1. What is LangGraph and why do we need it?

**Answer:**

LangGraph is a low-level orchestration framework and runtime for building **stateful, long-running AI agents and workflows**.

It models an application using:

- **State** — shared information maintained during execution
- **Nodes** — functions that perform work
- **Edges** — transitions between nodes
- **Conditional edges** — dynamically determine the next step

Key capabilities include:

- Durable execution
- Persistence
- Short-term and long-term memory
- Human-in-the-loop
- Streaming
- Fault recovery
- Complex agent orchestration

A simple LLM chain generally follows a fixed sequence, while LangGraph allows complex branching, loops, state management, and agent workflows.

---

# 2. LangChain vs LangGraph

**Answer:**

LangChain provides higher-level abstractions for building LLM applications and agents.

LangGraph operates at a lower level and gives developers more explicit control over **state and execution flow**.

```text
LangChain
   ↓
Models + Tools + Agents
   ↓
LangGraph
   ↓
State + Nodes + Edges + Persistence + Execution
```

### When would you use each?

**LangChain:**

Use it when you want higher-level abstractions for models, tools, prompts, retrieval, or agents.

**LangGraph:**

Use it when you need fine-grained control over:

- State
- Branching
- Loops
- Persistence
- Human approval
- Retries
- Long-running workflows
- Multi-agent orchestration

A good interview answer:

> "I would use LangChain for higher-level LLM and agent abstractions, while I would use LangGraph when I need explicit control over state, workflow execution, branching, persistence, and human-in-the-loop behavior."

---

# 3. What are State, Node, and Edge?

**Answer:**

These are the core building blocks of the LangGraph Graph API.

## State

State contains information shared between nodes.

Example:

```javascript
const State = new StateSchema({
  messages: MessagesValue
});
```

State might contain:

```javascript
{
  messages: [],
  userId: "123",
  query: "Find my order",
  toolResults: []
}
```

## Node

A node is a function that performs a unit of work.

For example:

```javascript
const callModel = async (state) => {
  const response = await model.invoke(state.messages);

  return {
    messages: [response]
  };
};
```

A node can:

- Call an LLM
- Call a tool
- Query a database
- Call an API
- Validate data
- Execute business logic

## Edge

An edge determines which node executes next.

```text
START
  ↓
LLM
  ↓
Tool
  ↓
END
```

---

# 4. What are Conditional Edges?

**Answer:**

A conditional edge allows the graph to dynamically choose the next node based on the current state.

For example:

```text
                 ┌── Tool ──┐
                 │          │
START → LLM ─────┤          ├──→ END
                 │          │
                 └─ Answer ─┘
```

If the LLM requests a tool:

```text
LLM → Tool
```

Otherwise:

```text
LLM → END
```

Conceptually:

```javascript
.addConditionalEdges(
  "llm",
  route
)
```

The routing function can inspect the state and return the name of the next node.

This is one of the most important patterns for agentic workflows.

---

# 5. Graph API vs Functional API

**Answer:**

LangGraph provides two major ways to define workflows.

## Graph API

The Graph API explicitly defines:

```text
State
  ↓
Nodes
  ↓
Edges
  ↓
Conditional Edges
```

Example:

```javascript
const graph = new StateGraph(State)
  .addNode("classify", classify)
  .addNode("research", research)
  .addNode("answer", answer)
  .addEdge(START, "classify")
  .addConditionalEdges("classify", route)
  .addEdge("answer", END)
  .compile();
```

It is useful when the workflow structure and state transitions are important.

## Functional API

The Functional API allows normal programming constructs such as:

```javascript
if
for
while
function calls
```

It integrates LangGraph capabilities with conventional application code.

### Comparison

| Graph API | Functional API |
|---|---|
| Explicit graph structure | Normal code flow |
| Nodes and edges | Functions/tasks |
| Easy to visualize | Natural for existing code |
| Good for complex branching | Good for dynamic workflows |
| Explicit state | Less graph-oriented |
| More declarative | More imperative |

Both APIs use the LangGraph runtime and can be combined when appropriate.

---

# 6. What is a Reducer?

**Answer:**

A reducer defines **how updates to a state field should be combined**.

For example, suppose a state value contains a counter.

Without a reducer, an update can replace the existing value.

With a reducer:

```text
Old value = 2
New value = 1

Reducer:
2 + 1 = 3
```

Conceptually:

```javascript
new ReducedValue(
  z.number().default(0),
  {
    reducer: (x, y) => x + y
  }
)
```

So the flow becomes:

```text
Existing State
      +
Node Update
      ↓
   Reducer
      ↓
Updated State
```

Reducers are particularly useful when multiple nodes contribute updates to the same state field.

---

# 7. What is MessagesValue?

**Answer:**

`MessagesValue` is a built-in state value for managing message state.

Example:

```javascript
const State = new StateSchema({
  messages: MessagesValue
});
```

It is useful for conversational applications because message updates can be handled as message history rather than simply replacing the complete message list.

Typical state:

```javascript
{
  messages: [
    {
      role: "user",
      content: "What is LangGraph?"
    },
    {
      role: "ai",
      content: "LangGraph is..."
    }
  ]
}
```

This makes `MessagesValue` especially useful for chatbot and agent workflows.

---

# 8. What is Checkpointing?

**Answer:**

Checkpointing means saving graph state during execution so that the application can later resume, inspect, or recover from that state.

Conceptually:

```text
Node A
  ↓
Checkpoint
  ↓
Node B
  ↓
Checkpoint
  ↓
Node C
```

If Node C fails:

```text
Checkpoint
    ↓
Resume
    ↓
Node C
```

Instead of necessarily starting the entire workflow again.

Checkpointing is important for:

- Long-running workflows
- Human approvals
- Fault recovery
- Stateful conversations
- Background jobs

For production systems, use an appropriate persistent checkpointer rather than relying only on in-memory state.

---

# 9. What is Durable Execution?

**Answer:**

Durable execution means an agent can survive failures and continue execution from saved progress instead of restarting the entire workflow.

Consider:

```text
User Request
     ↓
LLM
     ↓
Database
     ↓
Payment API
     ↓
Human Approval
```

If the application crashes after the database operation, durable execution allows the workflow to resume from persisted execution state.

It is useful for:

- Long-running agents
- Background workflows
- Approval processes
- External API operations
- Multi-step business processes

### Important production consideration

Durability should be combined with **idempotency** when calling external services.

For example:

```text
paymentId = unique business identifier
```

If the workflow retries the payment operation, the downstream service can detect an already-processed payment and avoid duplicate charges.

---

# 10. How does Memory work in LangGraph?

**Answer:**

LangGraph supports stateful applications with short-term and long-term memory patterns.

## Short-term memory

Used within an ongoing conversation or thread.

```text
Conversation
     ↓
Graph State
     ↓
Messages
```

Example:

```javascript
{
  messages: [...],
  userId: "123"
}
```

## Long-term memory

Used when information needs to persist across different conversations or sessions.

For example:

```text
User
 ↓
Stored Preferences
 ↓
Future Sessions
```

A production application can combine:

```text
LangGraph State
       +
Checkpointer
       +
Long-term Storage
```

to create persistent, personalized agent experiences.

---

# 11. How do you implement Human-in-the-loop?

**Answer:**

Human-in-the-loop means allowing a human to inspect, approve, reject, or modify an agent's execution.

Example:

```text
User Request
     ↓
AI Agent
     ↓
Generate Refund
     ↓
Human Approval
     ↓
Process Refund
```

The workflow can pause at the approval point and resume after the human provides a decision.

Typical use cases:

- Financial transactions
- Refunds
- Sending important emails
- Production deployments
- Sensitive database operations
- Legal workflows

A good architecture is:

```text
LLM
 ↓
Tool Request
 ↓
Authorization
 ↓
Validation
 ↓
Human Approval
 ↓
Tool Execution
```

The key idea is that the LLM should not automatically perform sensitive actions without appropriate controls.

---

# 12. How do you implement an LLM + Tool loop?

**Answer:**

A common agent pattern is:

```text
START
  ↓
LLM
  ↓
Does LLM request a tool?
  │
  ├── YES → Tool → LLM
  │
  └── NO  → END
```

The LLM decides whether it needs a tool.

For example:

```text
User:
"What's the weather in Delhi?"

        ↓

LLM
        ↓
Weather Tool
        ↓
Weather Result
        ↓
LLM
        ↓
Final Answer
```

This creates an iterative agent loop.

The important parts are:

- Model node
- Tool node
- Conditional routing
- State containing messages/tool results
- Termination condition

---

# 13. How do you handle retries and failures?

**Answer:**

I would combine several mechanisms.

## 1. Retry policies

Retry transient failures such as temporary network errors.

```text
API Call
   ↓
Failure
   ↓
Retry
   ↓
Success
```

## 2. Persistence

Persist state so execution can resume.

## 3. Conditional recovery

Route failures to a recovery node.

```text
API
 ↓
Failure
 ↓
Recovery
 ↓
Retry / END
```

## 4. Human intervention

For failures that require manual decisions:

```text
Failure
   ↓
Human Review
   ↓
Continue / Reject
```

## 5. Idempotency

For external operations such as payments or order creation, use unique operation IDs to prevent duplicate side effects during retries.

A production system should also consider:

- Timeouts
- Rate limits
- Circuit breakers
- Logging
- Tracing
- Alerting

---

# 14. How would you design a Multi-Agent system?

**Answer:**

LangGraph can orchestrate multiple specialized agents.

Example:

```text
                    Supervisor
                        ↓
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
      Researcher       Coder       Reviewer
          │             │             │
          └─────────────┼─────────────┘
                        ↓
                  Final Response
```

Possible responsibilities:

### Supervisor

Determines which agent should execute.

### Research Agent

Collects information.

### Coding Agent

Generates or modifies code.

### Reviewer Agent

Reviews the result.

### Final Agent

Produces the final response.

Each agent can be represented as a node or subgraph.

The graph controls:

- Agent selection
- Shared state
- Agent communication
- Execution order
- Loops
- Error handling
- Human intervention

---

# 15. How would you design a Production LangGraph application?

**Answer:**

I would separate the application into clear layers:

```text
API Layer
    ↓
LangGraph Layer
    ↓
State / Workflow
    ↓
Nodes
    ↓
Tools / Business Logic
    ↓
Database / External Services
```

Example project structure:

```text
src/
├── graphs/
│   ├── customerSupport.ts
│   └── researchAgent.ts
│
├── nodes/
│   ├── classifier.ts
│   ├── researcher.ts
│   └── responder.ts
│
├── tools/
│   ├── database.ts
│   └── search.ts
│
├── state/
│   └── agentState.ts
│
├── services/
│   └── ...
│
└── api/
    └── routes.ts
```

For production, I would consider:

- Persistent checkpointing
- Authentication and authorization
- Input/output validation
- Idempotency
- Retry policies
- Timeouts
- Rate limiting
- Tool permissions
- Human approval for sensitive operations
- Streaming
- Observability and tracing
- Error recovery
- Secure secret management

A typical architecture:

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │     API     │
                    └──────┬──────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   LangGraph     │
                  │      State      │
                  └────────┬────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │     LLM     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Router     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           Search       Database       API
              │            │            │
              └────────────┼────────────┘
                           ▼
                    ┌─────────────┐
                    │Human Review │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Response   │
                    └─────────────┘

              ┌───────────────────────┐
              │ Persistence / Memory  │
              │      Checkpointer     │
              └───────────────────────┘

              ┌───────────────────────┐
              │      LangSmith        │
              │ Trace / Evaluate      │
              └───────────────────────┘
```

---

# 🎯 Bonus Interview Questions

## 16. Can LangGraph work without LangChain?

**Answer:**

Yes.

LangGraph can be used as a standalone orchestration framework. LangChain components can be used alongside it for models, tools, messages, retrieval, and other integrations, but LangGraph itself does not require LangChain.

---

## 17. What is `START` and `END`?

**Answer:**

`START` represents the beginning of graph execution.

`END` represents the termination of graph execution.

Example:

```javascript
.addEdge(START, "llm")
.addEdge("llm", END)
```

Execution:

```text
START → LLM → END
```

---

## 18. What does `compile()` do?

**Answer:**

`compile()` transforms the graph definition into an executable graph.

Example:

```javascript
const graph = new StateGraph(State)
  .addNode("llm", callModel)
  .addEdge(START, "llm")
  .addEdge("llm", END)
  .compile();
```

Then:

```javascript
const result = await graph.invoke(input);
```

can execute the compiled graph.

---

## 19. What is `invoke()`?

**Answer:**

`invoke()` executes the graph and returns the final result after execution completes.

```javascript
const result = await graph.invoke({
  messages: [
    {
      role: "user",
      content: "Hello"
    }
  ]
});
```

Use streaming when the application needs progressive execution updates or streamed model output.

---

## 20. What is a Subgraph?

**Answer:**

A subgraph is a graph used as a component inside another graph.

For example:

```text
Main Graph
    ↓
Research Subgraph
    ↓
Analysis Subgraph
    ↓
Response
```

This is useful for modular multi-agent architectures.

Example:

```text
Main Agent
 ├── Research Agent
 ├── Data Agent
 └── Review Agent
```

Each specialized agent can have its own internal graph.

---

# 💡 Scenario-Based Interview Questions

## Scenario 1: Payment Agent

**Question:**

You have an AI agent that processes payments. The application crashes immediately after the payment API succeeds. How would you prevent a duplicate payment after restart?

**Answer:**

I would combine:

1. Durable execution
2. Checkpointing
3. Idempotency keys
4. Retry policies
5. Persistent state

Architecture:

```text
Validate Payment
      ↓
Generate Idempotency Key
      ↓
Payment API
      ↓
Checkpoint
      ↓
Confirmation
```

The payment service should use the idempotency key to ensure that retries do not create duplicate payments.

---

## Scenario 2: Customer Support Agent

**Question:**

Design a customer-support agent that routes customers to different specialized agents.

**Answer:**

```text
                    START
                      ↓
                 Classifier
                      ↓
          ┌───────────┼───────────┐
          ↓           ↓           ↓
       Billing     Technical    General
          ↓           ↓           ↓
        Agent       Agent       Agent
          └───────────┼───────────┘
                      ↓
                 Human Review
                      ↓
                  Response
                      ↓
                     END
```

State:

```javascript
{
  userId,
  messages,
  category,
  customerData,
  toolResults,
  requiresHumanReview
}
```

Conditional edges can determine which specialized agent should run.

---

## Scenario 3: Sensitive Tool

**Question:**

Your LLM has access to a `deleteUser` tool. How would you prevent unauthorized deletion?

**Answer:**

I would never allow the LLM to directly execute the destructive operation.

Instead:

```text
LLM
 ↓
Tool Request
 ↓
Authentication
 ↓
Authorization
 ↓
Input Validation
 ↓
Human Approval
 ↓
Delete User
```

The tool should enforce authorization independently of the LLM.

---

## Scenario 4: Research Agent

**Question:**

Design an agent that searches multiple sources, evaluates the results, and produces a final answer.

**Answer:**

```text
START
  ↓
Understand Query
  ↓
Search
  ↓
Collect Results
  ↓
Evaluate Results
  ↓
Enough Information?
  │
  ├── NO → Search Again
  │
  └── YES
        ↓
   Generate Answer
        ↓
       END
```

This workflow demonstrates:

- State
- Nodes
- Conditional edges
- Loops
- Tool calling
- Agentic decision making

---

# 🧠 30-Second Interview Answer

> "LangGraph is a low-level orchestration runtime for building stateful and long-running AI agents. It models workflows using state, nodes, and edges, allowing deterministic application logic and LLM-driven decisions to work together. Its important capabilities include persistence, durable execution, memory, streaming, human-in-the-loop, and fault recovery. I would use LangChain for higher-level LLM and agent abstractions, and LangGraph when I need fine-grained control over workflow execution and state."

---

# 🚀 Key Concepts to Remember

```text
LangGraph
│
├── State
│
├── Nodes
│
├── Edges
│   └── Conditional Edges
│
├── Reducers
│
├── Graph API
│
├── Functional API
│
├── Checkpointing
│
├── Persistence
│
├── Durable Execution
│
├── Short-term Memory
│
├── Long-term Memory
│
├── Human-in-the-loop
│
├── Tool Calling
│
├── Multi-Agent Systems
│
├── Subgraphs
│
├── Streaming
│
└── LangSmith Observability
```

---

## 📖 Recommended Official Reading Order

1. **[LangGraph Overview](https://docs.langchain.com/oss/javascript/langgraph/overview)**
2. **[LangGraph Quickstart](https://docs.langchain.com/oss/javascript/langgraph/quickstart)**
3. **[Choosing APIs](https://docs.langchain.com/oss/javascript/langgraph/choosing-apis)**
4. **[Graph API](https://docs.langchain.com/oss/javascript/langgraph/use-graph-api)**
5. **[Functional API](https://docs.langchain.com/oss/javascript/langgraph/use-functional-api)**
6. **[Application Structure](https://docs.langchain.com/oss/javascript/langgraph/application-structure)**

---

## ⭐ Interview Preparation Tip

For a **Senior Full Stack / AI Engineer** interview, don't just memorize definitions.

Be prepared to implement and explain this workflow:

```text
                    User
                     ↓
                  API
                     ↓
              LangGraph State
                     ↓
                    LLM
                     ↓
                 Router
              ↙     ↓      ↘
          Search   DB      API
              ↘     ↓      ↙
                 LLM
                  ↓
          Human Approval
                  ↓
               Response
```

You should be able to explain **why each node exists, how state changes, how conditional routing works, how failures are recovered, how persistence works, and how you would make the workflow safe for production**.
