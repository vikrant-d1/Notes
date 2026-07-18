### Build a simple EventEmitter
```javascript
class EventEmitter {
    constructor(){
        this.events = {};
    }

    on(eventName,listiner){
        if(!this.events[eventName]){
            this.events[eventName]=[];
        }
        this.events[eventName].push(listiner);
        return this;
    }

    emit(eventName,...args){
        const listiners = this.events[eventName];
        if(!listiners) return false;
        listiners.forEach(listiner => {
            listiner(...args);
        });
        return true;
    }

   off(eventName,listiner){
    const listiners = this.events[eventName];
     if(!listiners) return this;
     this.events[eventName] = listiners.filter((fn)=>fn !== listiner);
     return this;
   }

}

const emitter = new EventEmitter();

function handleLogin(user) {
  console.log(`${user} logged in`);
}

emitter.on("login", handleLogin);

emitter.emit("login", "Vikrant");
// Vikrant logged in

emitter.off("login", handleLogin);

emitter.emit("login", "Rahul");
```

### Build an Express middleware
```javascript

const loggerMiddleware = (req,res,next)=>{
       console.log(`method: ${req.method}, url: ${req.url}`);
       console.log(`time: ${new Date().toISOString()}`);
       next();
}

```

### JWT authentication middleware
```javascript
const jwt = require('jsonwebtoken');

const authonticate = (req,res,next) =>{
    try{

    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startWith(`Bearer`)){
        return res.status(401).json({
            success:false,
            message:"Authentication token is require."
        })
    }

    const token = authHeader.split(' ')[1];
    const decode = jwt.verify(token,process.env.JWT_SECRET);

    req.user = decode;
    next();
            
    }catch(err){
        return res.status(401).json({
            success:false,
            message:"Invalid or expaire token."
        })
    }
}

module.exports = authonticate;


// use of authontication

route.get("/profile",authonticate,controller.userProfile);
```

### File upload API

### Stream a large file

### Read a 5GB file efficiently

### CSV parser using streams

### Worker Threads example

### Cluster example

### Child Process example

### Cache with Redis

### API rate limiter

### Request queue

### WebSocket chat server

### URL shortener

### Job queue implementation

### Pub/Sub example

### API pagination

### Cursor pagination

### Graceful shutdown

### Connection pool example

### Advanced Promise and async patterns

### Linked List and Binary Tree problems

### Graph algorithms

### Sliding Window techniques

### Heap/Priority Queue problems

### LRU Cache and Rate Limiter

### Event Loop output questions

### Node.js system-design coding tasks

### EventEmitter and stream implementations
