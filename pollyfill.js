// 1. create a polly fil of the map function 

Array.prototype.myMap = function(cb){
  let newArr = [];
  for(let i =0; i<this.length; i++){
    newArr.push(cb(this[i],i,this));
  }
  return newArr;
}

let trans = [2,1,3].myMap(function(item,i){
    return item*2;
})

console.log('Map result:',trans);


// 2. Create pollyfill funtion of filter function

Array.prototype.myFilter = function(cb){
    let newArr = [];
    for(let i=0; i<this.length; i++){
        if(cb(this[i],i,this)){
            newArr.push(this[i]);
        }
    }

    return newArr;
}

let flData = [2,1,3].myFilter(function(item,i){
    return item>2;
})

console.log('filter Result:',flData);

// 3. create pollyfill of reduce funtion

Array.prototype.myReduce = function(cb,initialValue){
    let accumulator = initialValue;
    for(let i=0; i<this.length; i++){
        accumulator = cb(accumulator,this[i],i,this);
    }
    return accumulator;
}

let rsData = [2,1,3].myReduce(function(curr,per){
    return curr+per;
},0)

console.log('filter Result:',rsData);