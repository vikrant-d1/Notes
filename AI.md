# AI Engineering Interview Preparation — 5 Year Developer

This README contains interview-ready questions and practical answers for a **5-year experienced Full Stack / AI Engineer**.

Topics covered:

* LLMs & AI Platforms
* OpenAI API
* Anthropic API
* RAG
* Embeddings
* Vector Databases
* AI Agents
* Function & Tool Calling
* Prompt Engineering
* LangChain
* LangGraph
* Model Context Protocol (MCP)
* Production AI Architecture
* AI System Design
* Coding & Practical Questions

---

# 1. LLMs & AI Platforms

## Q1. What is an LLM?

### Answer

An LLM (Large Language Model) is a machine-learning model trained on a large amount of text data to understand and generate human-like language.

In an application, we normally interact with an LLM through an API.

Example:

```text
User
  |
  v
Backend Application
  |
  v
LLM API
  |
  v
Generated Response
```

---

## Q2. How does an LLM API work?

### Answer

My application sends a request to the LLM API containing:

* Model
* System instructions
* User input
* Context
* Optional tools/functions
* Configuration parameters

The LLM processes the request and returns generated text or structured output.

In production, I would also handle:

* Authentication
* Timeout
* Retry
* Rate limiting
* Token usage
* Error handling
* Logging
* Streaming

---

## Q3. What are tokens?

### Answer

Tokens are the units of text processed by an LLM.

A token can represent:

* A complete word
* Part of a word
* Punctuation
* Special characters

Token usage is important because it affects:

* Context-window usage
* API cost
* Request size
* Response size

---

## Q4. What is a context window?

### Answer

The context window is the maximum amount of information that a model can process for a request.

In RAG systems, context-window management is important because we should not send an entire large document to the model.

Instead, we retrieve only the most relevant chunks.

---

## Q5. What is temperature?

### Answer

Temperature controls the randomness of model output.

* Lower temperature → more deterministic output
* Higher temperature → more diverse output

For structured extraction or deterministic business logic, I generally prefer lower randomness.

For creative content generation, a higher temperature can be useful.

---

## Q6. What is `top_p`?

### Answer

`top_p` controls token selection using cumulative probability.

It is another way to control output randomness.

In most applications, I would avoid unnecessarily changing both temperature and `top_p` at the same time and tune them based on the use case.

---

# 2. LLM Integration

## Q7. How would you integrate an LLM into a Node.js application?

### Answer

I would create a dedicated AI service instead of directly calling the LLM from controllers.

Architecture:

```text
Controller
    |
    v
AI Service
    |
    +---- Prompt Service
    |
    +---- RAG Retriever
    |
    +---- Tool Manager
    |
    v
LLM Provider
```

The AI service would handle:

* Prompt construction
* Model configuration
* Token limits
* Streaming
* Retry
* Timeout
* Error handling
* Logging
* Cost tracking

This makes the implementation easier to test and maintain.

---

## Q8. How do you handle LLM API failures?

### Answer

I classify errors into retryable and non-retryable errors.

For temporary failures, I use:

```text
Request
   |
   v
LLM API
   |
   +---- Success ----> Response
   |
   +---- Temporary Error
              |
              v
        Retry + Backoff
```

I would use:

* Timeout
* Exponential backoff
* Maximum retry count
* Error logging
* Monitoring

For permanent errors such as invalid input, I would return an appropriate error instead of repeatedly retrying.

---

## Q9. How do you reduce LLM costs?

### Answer

I would:

1. Reduce unnecessary prompt size.
2. Retrieve only relevant RAG chunks.
3. Use smaller models for simple tasks.
4. Limit output tokens.
5. Cache repeated requests where appropriate.
6. Track input and output token usage.
7. Avoid sending duplicate context.
8. Monitor cost per feature/user/request.

---

# 3. RAG

## Q10. What is RAG?

### Answer

RAG stands for **Retrieval-Augmented Generation**.

It combines information retrieval with an LLM.

Instead of asking the LLM to answer only from its pretrained knowledge, we retrieve relevant information from our own knowledge base and provide that information as context.

Typical architecture:

```text
Documents
    |
    v
Document Loader
    |
    v
Text Chunking
    |
    v
Embeddings
    |
    v
Vector Database
```

At query time:

```text
User Question
      |
      v
Query Embedding
      |
      v
Similarity Search
      |
      v
Relevant Chunks
      |
      v
Prompt + Context
      |
      v
LLM
      |
      v
Answer
```

---

## Q11. Why do we need RAG?

### Answer

LLMs don't automatically have access to our private or frequently changing application data.

RAG allows us to connect an LLM with:

* Company documents
* Product documentation
* Internal policies
* FAQs
* Knowledge bases
* Customer data

The advantage is that we can update the knowledge base without retraining the LLM.

---

## Q12. RAG vs Fine-tuning?

### Answer

| RAG                              | Fine-tuning                           |
| -------------------------------- | ------------------------------------- |
| Retrieves information at runtime | Changes model behavior                |
| Good for private/current data    | Good for specialized behavior         |
| Easier to update knowledge       | Requires training process             |
| Uses external knowledge          | Knowledge is incorporated differently |
| Good for document Q&A            | Good for specialized tasks            |

### Interview Answer

> If the main requirement is answering questions from frequently changing company documents, I would normally start with RAG. I would consider fine-tuning when I need specialized model behavior, style, formatting, or task performance.

---

# 4. Embeddings

## Q13. What are embeddings?

### Answer

Embeddings convert text or other data into numerical vectors representing semantic meaning.

Example:

```text
"How do I reset my password?"
              |
              v
       Embedding Model
              |
              v
[0.12, -0.45, 0.78, 0.21, ...]
```

Similar meanings generally produce vectors that are close together.

---

## Q14. What are embeddings used for?

### Answer

Embeddings are commonly used for:

* Semantic search
* RAG
* Document similarity
* Recommendation systems
* Clustering
* Duplicate detection

---

## Q15. Keyword search vs semantic search?

### Answer

Keyword search primarily searches for matching words.

Semantic search searches based on meaning.

Example:

```text
Query:
"How can I change my password?"

Document:
"Users can update their credentials from account settings."
```

The words are different, but the meaning is similar.

Semantic search can therefore retrieve the document more effectively.

---

# 5. Chunking

## Q16. What is document chunking?

### Answer

Chunking means splitting a large document into smaller meaningful sections before generating embeddings.

Instead of:

```text
100-page document
       |
       v
One embedding
```

we create:

```text
100-page document
       |
       v
+-------+-------+-------+
|Chunk 1|Chunk 2|Chunk 3| ...
+-------+-------+-------+
       |
       v
Embedding for each chunk
```

This improves retrieval granularity.

---

## Q17. How do you decide chunk size?

### Answer

I don't use one fixed chunk size for every application.

I consider:

* Document structure
* Paragraph boundaries
* Section headings
* Sentence boundaries
* Type of questions users ask
* Embedding model
* Required context

I would test different strategies and evaluate retrieval quality.

---

## Q18. What is chunk overlap?

### Answer

Chunk overlap means keeping some content from the previous chunk in the next chunk.

Example:

```text
Chunk 1:
A B C D E F

Chunk 2:
        E F G H I J
        ^^^
      overlap
```

Overlap helps prevent information from being lost when an important sentence or concept crosses a chunk boundary.

---

# 6. Vector Databases

## Q19. What is a vector database?

### Answer

A vector database stores high-dimensional vectors and allows efficient similarity searches.

In a RAG application:

```text
Document
   |
Embedding
   |
Vector
   |
Vector Database
   |
Similarity Search
   |
Top-K Results
```

Examples:

* PostgreSQL + pgvector
* Pinecone
* Qdrant
* Weaviate
* Milvus

---

## Q20. What is cosine similarity?

### Answer

Cosine similarity measures how similar two vectors are based on the angle between them.

It is commonly used to compare embeddings.

Conceptually:

```text
Query Vector
     |
     | compare
     v
Document Vectors
     |
     v
Similarity Score
     |
     v
Most Relevant Documents
```

---

## Q21. What is metadata filtering?

### Answer

Metadata filtering allows us to restrict search results based on additional attributes.

Example:

```json
{
  "department": "engineering",
  "documentType": "policy",
  "year": 2026
}
```

We can search only engineering policies from 2026.

This is especially useful for multi-tenant applications where users should only retrieve data they are authorized to access.

---

## Q22. What is hybrid search?

### Answer

Hybrid search combines:

* Keyword search
* Semantic/vector search

This is useful because keyword search can be better for exact terms such as:

```text
Product ID
Error code
Ticket number
API name
```

while semantic search is better for understanding meaning.

---

# 7. Improving RAG

## Q23. How do you improve RAG accuracy?

### Answer

I would investigate the entire retrieval pipeline instead of only changing the prompt.

I would consider:

1. Better document parsing.
2. Better chunking.
3. Better embedding model.
4. Metadata filtering.
5. Hybrid search.
6. Increasing or tuning Top-K.
7. Reranking retrieved documents.
8. Removing irrelevant chunks.
9. Improving the prompt.
10. Adding evaluation datasets.

---

## Q24. What is reranking?

### Answer

Reranking is a second-stage retrieval step.

For example:

```text
Query
 |
 v
Vector Search
 |
 v
Top 20 documents
 |
 v
Reranker
 |
 v
Best 5 documents
 |
 v
LLM
```

The first search retrieves candidates quickly, and the reranker selects the most relevant results.

---

## Q25. How do you handle hallucinations in RAG?

### Answer

I would use several techniques:

* Provide relevant context.
* Instruct the model to answer only from the provided context when appropriate.
* Return "I don't have enough information" when evidence is missing.
* Use citations/source references.
* Improve retrieval quality.
* Validate structured responses.
* Evaluate hallucination rates using test datasets.

---

# 8. AI Agents

## Q26. What is an AI agent?

### Answer

An AI agent is an LLM-based system that can decide which actions or tools are required to complete a task.

Simple LLM:

```text
User
 |
 v
LLM
 |
 v
Answer
```

Agent:

```text
User
 |
 v
LLM
 |
 v
Decision
 |
 +----> Database
 |
 +----> API
 |
 +----> Search
 |
 +----> Tool
 |
 v
Result
 |
 v
LLM
 |
 v
Final Answer
```

---

## Q27. Agent vs chatbot?

### Answer

> A traditional chatbot mainly receives a message and generates a response. An agent can decide what actions are required and interact with external tools or systems before producing the final response.

---

## Q28. Agent vs RAG?

### Answer

> RAG is primarily a retrieval technique. It retrieves relevant information and provides it to the LLM.
>
> An agent is a decision-making system that can select and execute tools.
>
> An agent can use RAG as one of its tools.

Example:

```text
Agent
 |
 +---- RAG Search
 |
 +---- Order API
 |
 +---- Payment API
 |
 +---- Email API
```

---

## Q29. How do you prevent infinite agent loops?

### Answer

I would implement:

* Maximum iteration count.
* Timeout.
* Maximum tool calls.
* State tracking.
* Explicit termination conditions.
* Error handling.
* Monitoring.

Example:

```text
while iterations < MAX_ITERATIONS:
    execute_agent_step()

if iterations >= MAX_ITERATIONS:
    stop_agent()
```

---

# 9. Function / Tool Calling

## Q30. What is function/tool calling?

### Answer

Tool calling allows an LLM to request that our application execute a predefined function.

For example:

```json
{
  "name": "get_order_status",
  "arguments": {
    "orderId": "12345"
  }
}
```

The important point is:

> The LLM generally doesn't execute the function itself. It produces a structured tool call. Our application executes the function and sends the result back to the LLM.

---

## Q31. How does tool calling work?

### Answer

```text
User
 |
 v
LLM
 |
 | Tool required
 v
Tool Call
 |
 v
Backend Application
 |
 v
External API / Database
 |
 v
Tool Result
 |
 v
LLM
 |
 v
Final Response
```

Example:

```text
User:
"What is the status of order 123?"

LLM:
get_order_status(123)

Backend:
{
  "status": "shipped"
}

LLM:
"Your order has been shipped."
```

---

## Q32. How do you secure tools?

### Answer

I would never allow the LLM unrestricted access to backend functionality.

I would use:

* Strict tool schemas.
* Authentication.
* Authorization.
* Input validation.
* Allowlisted tools.
* Rate limits.
* Audit logs.
* Permission checks.
* Timeouts.
* Least-privilege access.

For example, a customer should not be able to invoke an internal `delete_user()` tool simply because the model generated that function call.

---

# 10. Prompt Engineering

## Q33. What is prompt engineering?

### Answer

Prompt engineering is the process of designing instructions and context so that an LLM produces reliable and useful results.

A prompt can contain:

```text
System Instructions
        +
User Request
        +
Application Context
        +
RAG Context
        +
Tool Information
```

---

## Q34. System prompt vs user prompt?

### Answer

### System prompt

Defines the model's general behavior.

```text
You are a customer support assistant.
```

### User prompt

Contains the user's actual request.

```text
Where is my order?
```

The system prompt generally establishes the application-level behavior, while the user message contains the task/request.

---

## Q35. What is zero-shot prompting?

### Answer

Zero-shot prompting means asking the model to perform a task without providing examples.

Example:

```text
Classify this review as positive or negative:

"I love this product."
```

No examples are provided.

---

## Q36. What is few-shot prompting?

### Answer

Few-shot prompting provides examples before asking the model to perform the task.

```text
Review: "Excellent product"
Output: Positive

Review: "Very poor quality"
Output: Negative

Review: "Works perfectly"
Output:
```

The examples help demonstrate the expected behavior.

---

## Q37. How do you prevent prompt injection?

### Answer

I don't rely only on the system prompt.

I use multiple layers:

1. Clearly separate trusted instructions from untrusted user data.
2. Validate tool arguments.
3. Apply authorization outside the LLM.
4. Restrict available tools.
5. Never trust model-generated permissions.
6. Sanitize and classify retrieved content when appropriate.
7. Log suspicious requests.
8. Apply business rules in application code.

The key principle is:

> **Security decisions should be enforced by the application, not by the LLM.**

---

# 11. LangChain

## Q38. What is LangChain?

### Answer

LangChain is a framework for building applications around LLMs.

It provides abstractions for things such as:

* LLMs
* Prompts
* Retrievers
* Vector stores
* Tools
* Agents
* Document loaders
* Chains/workflows

Architecture:

```text
Application
    |
    v
LangChain
    |
    +---- LLM
    +---- Prompt
    +---- Retriever
    +---- Vector DB
    +---- Tools
    +---- Agent
```

---

## Q39. Why use LangChain instead of directly calling an LLM API?

### Answer

> If my application is simple, I may call the provider API directly because it gives me more control and fewer abstractions.
>
> For applications involving multiple components such as retrieval, tools, agents, and model integrations, a framework like LangChain can reduce boilerplate and provide reusable abstractions.
>
> I would avoid introducing a framework if the application's requirements don't justify it.

---

## Q40. What is a retriever?

### Answer

A retriever is a component responsible for finding relevant documents or chunks for a query.

```text
User Query
    |
    v
Retriever
    |
    v
Relevant Documents
```

In RAG, the retriever typically performs vector or hybrid search.

---

# 12. LangGraph

## Q41. What is LangGraph?

### Answer

LangGraph is designed for building stateful, multi-step LLM workflows.

It models an application as:

* Nodes
* Edges
* State
* Conditional transitions

Example:

```text
START
  |
  v
Understand Request
  |
  v
Retrieve Data
  |
  v
Call Tool
  |
  +---- Success ----> Generate
  |
  +---- Failure ----> Retry
                          |
                          v
                       Call Tool
```

---

## Q42. LangChain vs LangGraph?

### Answer

> LangChain provides components and abstractions for building LLM applications, while LangGraph is particularly useful when I need explicit stateful workflows with branching, retries, loops, and human-in-the-loop behavior.

---

## Q43. What is state in LangGraph?

### Answer

State contains information that needs to be passed between workflow steps.

For example:

```json
{
  "userQuery": "...",
  "documents": [],
  "toolResults": [],
  "messages": [],
  "status": "processing"
}
```

Nodes read and update this state.

---

# 13. MCP

## Q44. What is MCP?

### Answer

MCP stands for **Model Context Protocol**.

It provides a standardized way for AI applications to interact with external tools and data sources.

Conceptually:

```text
AI Application
      |
      v
     LLM
      |
      v
     MCP
   /  |  \
  /   |   \
 DB  Git  Files
```

---

## Q45. What is an MCP server?

### Answer

An MCP server exposes capabilities such as tools or resources to an MCP client.

For example:

```text
MCP Server
    |
    +---- get_customer()
    |
    +---- search_orders()
    |
    +---- get_order()
```

The AI application can discover and invoke these capabilities through the MCP protocol.

---

## Q46. MCP vs function calling?

### Answer

> Function calling is a mechanism where an LLM can request a function/tool from an application.
>
> MCP is a protocol that standardizes how AI applications discover and interact with external tools and resources.
>
> So they solve related but different problems. Function calling describes the tool invocation mechanism, while MCP provides a standardized integration protocol around tools/resources.

---

## Q47. MCP vs REST API?

### Answer

| MCP                                  | REST API                    |
| ------------------------------------ | --------------------------- |
| Designed for AI/tool integration     | General web API             |
| Standardized AI-oriented interaction | HTTP resource-oriented API  |
| Supports tool/resource concepts      | Uses HTTP methods/resources |
| Designed for AI clients and servers  | Used by any HTTP client     |

An existing REST API can also be exposed through an MCP server.

---

# 14. Production RAG System Design

## Q48. Design a production-grade AI chatbot using RAG.

### Answer

I would design it like this:

```text
                    Client
                      |
                      v
                 API Gateway
                      |
                      v
                 Backend API
                      |
             +--------+--------+
             |                 |
             v                 v
          Auth/User        AI Service
                               |
                  +------------+------------+
                  |            |            |
                  v            v            v
               Prompt      Retriever      Tools
                               |            |
                               v            v
                           Vector DB    External APIs
                               |
                               v
                           Documents
                               |
                               v
                              LLM
                               |
                               v
                           Response
```

Additional production components:

```text
Redis
 |
 +-- Cache
 +-- Rate Limiting

PostgreSQL
 |
 +-- Users
 +-- Conversations
 +-- Metadata

Object Storage
 |
 +-- Original Documents

Observability
 |
 +-- Logs
 +-- Metrics
 +-- Tracing

Evaluation
 |
 +-- Retrieval Quality
 +-- Answer Quality
 +-- Hallucination
```

---

## Q49. How would you design multi-tenant RAG?

### Answer

This is an important senior-level question.

I would ensure tenant isolation at every layer.

```text
Tenant A
   |
   +---- Documents
   +---- Embeddings
   +---- Metadata

Tenant B
   |
   +---- Documents
   +---- Embeddings
   +---- Metadata
```

Every query should include tenant information.

For example:

```text
tenantId = "company-123"
```

Then retrieval must enforce:

```text
tenantId = currentUser.tenantId
```

I would enforce authorization in backend code rather than trusting the LLM.

---

# 15. AI Evaluation

## Q50. How do you evaluate an AI application?

### Answer

I would create a test dataset containing representative user questions and expected behavior.

I would measure:

### Retrieval

* Recall
* Precision
* Relevant documents retrieved
* Top-K quality

### Generation

* Correctness
* Relevance
* Groundedness
* Hallucination rate
* Response format

### Production

* Latency
* Token usage
* Cost
* Error rate
* Tool failure rate

I would run evaluations whenever prompts, models, retrieval strategies, or application logic change.

---

# 16. Practical Coding Questions

## Q51. How would you implement a simple RAG pipeline?

### Answer

```text
Document
   |
   v
Parse
   |
   v
Chunk
   |
   v
Generate Embeddings
   |
   v
Store in Vector DB
```

Query:

```text
Question
   |
   v
Generate Query Embedding
   |
   v
Vector Search
   |
   v
Top-K Chunks
   |
   v
Build Prompt
   |
   v
LLM
   |
   v
Answer
```

---

## Q52. How would you implement retry logic?

### Answer

I would use exponential backoff.

Conceptually:

```text
Attempt 1
   |
   v
Failure
   |
 wait 1s
   |
Attempt 2
   |
   v
Failure
   |
 wait 2s
   |
Attempt 3
```

I would also have:

* Maximum retry count
* Maximum timeout
* Retry only transient errors

---

# 17. Senior-Level Scenario Questions

## Q53. The RAG chatbot is returning incorrect answers. What would you investigate?

### Answer

I would debug the pipeline from retrieval to generation.

```text
User Query
    ↓
Query Processing
    ↓
Embedding
    ↓
Retrieval
    ↓
Ranking
    ↓
Context
    ↓
Prompt
    ↓
LLM
    ↓
Answer
```

I would check:

1. Is the correct document indexed?
2. Is chunking appropriate?
3. Is the query embedding good?
4. Are relevant chunks being retrieved?
5. Is Top-K appropriate?
6. Is metadata filtering correct?
7. Is reranking required?
8. Is the prompt causing incorrect behavior?
9. Is the model hallucinating despite correct context?

I would use evaluation data rather than changing components randomly.

---

## Q54. Your LLM API is becoming expensive. What would you do?

### Answer

First I would measure the cost.

I would inspect:

```text
Cost
 |
 +-- Input Tokens
 +-- Output Tokens
 +-- Number of Requests
 +-- Model Selection
 +-- Duplicate Requests
```

Then optimize:

* Prompt size
* RAG context
* Model selection
* Output limits
* Caching
* Request batching where applicable
* Repeated calls
* Tool usage

I would monitor cost per request and cost per user/feature.

---

## Q55. How would you design a scalable AI backend?

### Answer

I would separate synchronous API handling from expensive asynchronous processing where possible.

```text
                    Client
                      |
                      v
                Load Balancer
                      |
             +--------+--------+
             |                 |
             v                 v
         API Server        API Server
             |                 |
             +--------+--------+
                      |
                      v
                  AI Service
                      |
        +-------------+-------------+
        |             |             |
        v             v             v
      Redis       Vector DB       LLM
        |
      Cache

Async Processing
      |
      v
    Queue
      |
      v
Workers
      |
      v
Document Processing
      |
      v
Embeddings
      |
      v
Vector DB
```

This separates document ingestion and embedding workloads from user-facing API requests.

---

# 18. Rapid-Fire Interview Questions

Before your interview, make sure you can answer these in **30–60 seconds each**:

### LLM

* What is an LLM?
* What are tokens?
* What is context window?
* Temperature vs top-p?
* What is streaming?
* How do you handle retries?
* How do you control cost?

### RAG

* What is RAG?
* RAG vs fine-tuning?
* What is chunking?
* What is chunk overlap?
* What are embeddings?
* What is semantic search?
* What is hybrid search?
* What is reranking?
* How do you reduce hallucination?

### Vector DB

* What is vector database?
* Cosine similarity?
* Euclidean distance?
* ANN?
* Metadata filtering?
* How do you scale vector search?

### Agents

* What is an AI agent?
* Agent vs chatbot?
* Agent vs RAG?
* How does an agent select tools?
* How do you prevent loops?
* How do you handle tool failures?

### Tool Calling

* What is function calling?
* Who executes the function?
* How do you validate tool parameters?
* How do you secure tools?

### LangChain

* What is LangChain?
* What is a chain?
* What is a retriever?
* What is a document loader?
* What is a vector store?
* What is an agent?

### LangGraph

* What is LangGraph?
* LangChain vs LangGraph?
* What is a node?
* What is an edge?
* What is state?
* How do you implement retry/branching?

### MCP

* What is MCP?
* MCP client vs server?
* MCP tools?
* MCP resources?
* MCP vs function calling?
* MCP vs REST?
* How do you secure MCP?

---

# 19. Most Important Questions for a 5-Year Developer

If the interviewer has limited time, focus heavily on these:

```text
1. Explain RAG end-to-end.
2. RAG vs fine-tuning.
3. Explain embeddings.
4. Explain vector database.
5. Explain cosine similarity.
6. How would you improve RAG accuracy?
7. What is chunking and how do you choose chunk size?
8. What is an AI agent?
9. Agent vs RAG.
10. Explain function/tool calling.
11. How do you secure tools?
12. How do you prevent hallucinations?
13. How do you prevent prompt injection?
14. LangChain vs LangGraph.
15. What is LangGraph state?
16. What is MCP?
17. MCP vs function calling.
18. Design a production RAG system.
19. How do you evaluate an AI system?
20. How do you optimize LLM cost and latency?
```

---

# 20. How to Answer as a 5-Year Developer

Avoid answers like:

> "RAG is Retrieval Augmented Generation."

That sounds theoretical.

Instead use:

> "In my implementation, I would first ingest documents, split them into meaningful chunks, generate embeddings, and store those embeddings with metadata in a vector database. At query time, I generate an embedding for the user's question, retrieve the most relevant chunks, optionally rerank them, and pass the selected context to the LLM. For production, I would also consider tenant-level authorization, caching, observability, evaluation, latency, and cost."

That style demonstrates **real engineering experience**, not just memorization.

## Recommended Interview Preparation Order

```text
Day 1
 ├── LLM Fundamentals
 └── OpenAI / Anthropic APIs

Day 2
 ├── Embeddings
 ├── Chunking
 └── Vector Databases

Day 3
 ├── RAG
 ├── Hybrid Search
 └── Reranking

Day 4
 ├── Tool Calling
 ├── AI Agents
 └── Agent Security

Day 5
 ├── Prompt Engineering
 ├── Prompt Injection
 └── Hallucination

Day 6
 ├── LangChain
 ├── LangGraph
 └── MCP

Day 7
 ├── AI System Design
 ├── Production Architecture
 └── Mock Interview
```

**For a 5-year interview, don't just memorize these answers.** Be prepared to explain **why you chose an approach, what trade-offs you considered, how you would implement it in Node.js/Python, and how you would make it production-ready.**
