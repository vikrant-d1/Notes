## Prisma

### Step 1: Set Up Prisma with PostgreSQL
1. Install Node.js and PostgreSQL
Before we begin, make sure you have:

Node.js (v22 or later) installed – check with node -v
PostgreSQL installed and running – check with psql --version
2. Create a New Node.js Project
Run the following in your terminal:
```javascript
mkdir prisma-project && cd prisma-project
npm init -y
This creates a new project directory and initializes package.json.
```

3. Install Prisma and PostgreSQL Client`` javascript
npm install prisma --save-dev
npm install @prisma/client
prisma is the CLI for managing Prisma.
@prisma/client is the database client for interacting with PostgreSQL.
4. Initialize Prisma
Run:
`` javascript
npx prisma init
This creates:

.env – stores the database connection URL.
prisma/schema.prisma – defines your database schema.
5. Configure PostgreSQL Connection
Open .env and update the DATABASE_URL to match your PostgreSQL setup:

env
Copy
Edit
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"
Replace:

user → Your PostgreSQL username
password → Your PostgreSQL password
mydatabase → Your database name
6. Create Your First Model
Edit prisma/schema.prisma to define a User model:

prisma
Copy
Edit
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int     @id @default(autoincrement())
  name      String
  email     String  @unique
  createdAt DateTime @default(now())
}
This defines a User table with:

id (Auto-incremented primary key)
name (String)
email (Unique String)
createdAt (Auto-generated timestamp)
7. Run Migration to Create the Table
Run:
`` javascript
npx prisma migrate dev --name init
This creates the User table in PostgreSQL.
It generates a migration file in prisma/migrations/.
8. Generate Prisma Client
After migration, generate the client:
`` javascript
npx prisma generate
This makes Prisma Client available in your project.

Next Step
Now that Prisma is set up, do you want to:

Insert and fetch data using Prisma Client?
Learn about database relationships (one-to-one, one-to-many)?






You said:
yes Next Step
ChatGPT said:
Step 2: Insert and Fetch Data Using Prisma Client
Now that Prisma is set up, let's interact with the database using Prisma Client.

1. Create a Prisma Client Instance
Inside your project, create a new file prismaClient.js:

js
Copy
Edit
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
This allows you to reuse Prisma Client across your app.

2. Insert Data (Create a User)
Create a new file createUser.js:

js
Copy
Edit
import prisma from './prismaClient.js';

async function createUser() {
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john.doe@example.com",
    },
  });

  console.log("User Created:", user);
}

createUser()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
Run it:
`` javascript
node createUser.js
It should output:

yaml
Copy
Edit
User Created: { id: 1, name: 'John Doe', email: 'john.doe@example.com', createdAt: ... }
3. Fetch Data (Get All Users)
Create a new file getUsers.js:

js
Copy
Edit
import prisma from './prismaClient.js';

async function getUsers() {
  const users = await prisma.user.findMany();
  console.log("All Users:", users);
}

getUsers()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
Run:
`` javascript
node getUsers.js
It should output all users in the database.

4. Find a Single User by Email
Modify getUsers.js:

js
Copy
Edit
async function getUserByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  console.log("User Found:", user);
}

getUserByEmail("john.doe@example.com");
Run:
`` javascript
node getUsers.js
This fetches a specific user by email.

