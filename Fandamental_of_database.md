# Fanamental of Database

### ACID
**A**tomicity, **C**onsistency, **I**solation and **D**urability in Relational Database Systems

### Transaction

#### What is a Transaction?
- A collection of queries
- One unit of work
- E.g. Account deposit (SELECT, UPDATE, UPDATE)

#### Transaction Lifespan
- Transaction **BEGIN**
- Transaction **COMMIT**
- Transaction **ROLLBACK**
- Transaction unexpected ending = ROLLBACK (e.g. crash)

#### Nature of Transactions
- Usually Transactions are used to change and modify data
- However, it is perfectly normal to have a read only transaction
- Example, you want to generate a report and you want to get consistent snapshot based at the time of transaction
- We will learn more about this in the Isolation section

#### Atomicity
- All queries in a transaction must succeed.
- If one query fails, all prior successful queries in the transaction should rollback.
- If the database went down prior to a commit of a transaction,
- all the successful queries in the transactions should rollback
- After we restarted the machine the first account has been debited but the other account has not been credited.
- This is really bad as we just lost data, and the information is inconsistent
- An atomic transaction is a transaction that will rollback all queries if one or more queries failed.
- The database should clean this up after restart.

#### Isolation
- Can my inflight transaction see changes made by other transactions?
- Read phenomena
- Isolation Levels
- Isolation - Read phenomena
- Dirty reads
- Non-repeatable reads
- Phantom reads
- Lost updates

#### Isolation - Isolation Levels for inflight transactions
- Read uncommitted - No Isolation, any change from the outside is visible to the transaction, committed or not.
- Read committed - Each query in a transaction only sees committed changes by other transactions
- Repeatable Read - The transaction will make sure that when a query reads a row,
- that row will remain unchanged while its running.
- Snapshot - Each query in a transaction only sees changes that have been committed up to the start of the transaction. It's like a snapshot version of the database at that moment.
- Serializable - Transactions are run as if they serialized one after the other.
- Each DBMS implements Isolation level differently 

#### Database Implementation of Isolation
- Each DBMS implements Isolation level differently
- Pessimistic - Row level locks, table locks, page locks to avoid lost updates
- Optimistic - No locks, just track if things changed and fail the transaction if so
- Repeatable read “locks” the rows it reads but it could be expensive if you read a lot of rows, postgres implements RR as snapshot. That is why you don’t get phantom reads with postgres in repeatable read
- Serializable are usually implemented with optimistic concurrency control, you can implement it pessimistically with SELECT FOR UPDATE 

