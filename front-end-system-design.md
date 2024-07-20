## Server side Events 

#### Set request header 
- Connection:Keep-alive
- Event-Stream
- event | data | Id

#### Where to use server side event
- Long live unidirectional communication
- Single HTTP Connection
- Feed, Notification,
- Monetering, Dashboard

#### Challenges:
- Browser Campatibility
- Connection Limit
- Connection timeout
- Background tab behaviour
- Resource Utilization
- Load Balancer
- Sticky Connection
- Proxy/Firewall
- Testing
- Broadcasting
  
#### Example of serverside Events
```javascript
   app.get('/sse',(req,res)=>{
   res.setHeader('Content-Type','text/event-stream');
   res.setHeader('Connection','keep-alive');
   res.setHeader('Cache-Control','no-cache');
   res.write('data:welcome to server \n\n');
   const intervelId = setIntervel(()=>{
       res.write(`data: server time ${new Date().toLocalDateSting()} \n\n`);
   },5000)

  req.on('close',()=>{
   clearIntervel(intervelId);
  });
})
```

#### Example of front ent side .html
```javascript
const evtSource = new EventSource("sse");
evtSource.onmessage = (e) => {
  const newElement = document.createElement("li");
  newElement.textContent = `message: ${e.data}`;
  eventList.appendChild(newElement);
};
```

*[Know more about EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)*

