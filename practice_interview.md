


### 1. create a flat array
```javascript 
let arree = [3,4,[4,5],[[3]],[[[[[4]]]]],3,5];

const arrFlatArr = (arr)=>{
     let flattenArr = [];
      for(let i=0; i<arr.length; i++){
     if(Array.isArray(arr[i])){
    flattenArr= flattenArr.concat(arrFlatArr(arr[i]))
     
     }else{
     flattenArr.push(arr[i]); 
     }
       }
     return flattenArr;
}

console.log('check data',arrFlatArr(arree));
```


### 2. To asending order by gread
```javascript 
let Input = [{"name":"Aima","grade":"A"},{"name":"Arjun","grade":"A+"},{"name":"Iram","grade":"B+"},{"name":"Zia","grade":"C"},{"name":"Reah","grade":"B"},{"name":"Karan","grade":"A"},{"name":"Mithum","grade":"B"},{"name":"Ankur","grade":"B+"}]

 function sortObj(arr){
    if(arr.length>0){
   return arr.sort((a,b)=>{
      let aObj = a.grade.toUpperCase();
      let bObj = b.grade.toUpperCase();
      if(aObj>bObj){
        return -1;
      }else if(aObj<bObj){
        return 1;
      }else{
        return 0;
      }
    })
  }
 }
 console.log(sortObj(Input));

```
### 3. do this reverse string
```javascript 
let a = 'JavaScript is awesome';
let b = a.split(' ');
let reversString = '';

for(let i=b.length-1; i>=0; i--){
console.log(b[i])
   reversString+= b[i]+' ';
}
console.log('string', reversString);
```



### 4. solution word aslo revese
```javascript 
let a = 'JavaScript is awesome';
let b = a.split(' ');
for(let i=b.length-1; i>=0; i--){
console.log(b[i])
   let letterLenth =b[i].split('');
   let reverseword = '';
    for(let j=b[i].length-1; i>=0; j--){
    reverseword =letterLenth[j];
    }
   reversString+= reverseword+' ';
}

console.log('word reverse', reversString);
```

### 5. Upper left triangle
```javascript 
let n = 5;
for (let i = 1; i <= n; i++) {
    let str = "* ";
    console.log(str.repeat(i));
}

```

### 6. Upper right triangle
```javascript 
 let count =5;
 let printResult='';
 for(let i=1; i<=count; i++){
     let printResult = " *";
     let space = '  ';

   console.log(space.repeat(count-i)+printResult.repeat(i));
 }

```
 ### 7. Lower Right Triangle

```javascript 
 let count =5;
 let printResult='';
 for(let i=count; i>=1; i--){
     let printResult = " *";
     let space = '  ';

   console.log(space.repeat(count-i)+printResult.repeat(i));
 }
```


 ### 8. Lower Left Triangle
 ```javascript 
let n = 5;
for (let i = n; i >= 1; i--) {
    let str = "* ";
    console.log(str.repeat(i));
}
```

###  9. Find pair of the sum given total number
```javascript 
const findPair = (arr, target) => {
  const seenValues = new Set();

  for (let i = 0; i < arr.length; i++) {
    const complement = target - arr[i];
    if (seenValues.has(complement)) {
      return [arr[i], complement];
    }
    seenValues.add(arr[i]);
  }

  return "No pair [1, 9] found.";
};

const a = [2, 3, 4, 3, 3, 2, 4, 9, 1, 2, 5, 5];
const result = findPair(a, 10); // Looking for the pair [1, 9] which sums to 10
console.log(result);
```



### 10. All word upper case first letter capital
```javascript 
const transformName = (name:string) => {
    let updated = name.toLowerCase();
    let allWords = updated.split(' ');
    let updatedName = [];
    for (let i = 0; i < allWords.length; i++) {
      let firstLetter = allWords[i].substring(0, 1);
      let restOfWord = allWords[i].substring(1);
      let fullWord = firstLetter.toUpperCase() + restOfWord;
      updatedName.push(fullWord);
    }
    return updatedName.join(' ');
  }
```

### 10.(a) All word upper case first letter capital (updated)
```javascript 
let stringData = 'hi i am check the value of uppercase';

function captilization(stringData){
    let stringArr = stringData.split(' ');
     let updatedString = ' ';
     for(let i=1; i<=stringArr.length-1; i++){
        let capitalLetter = stringArr[i].charAt(0).toUpperCase()+stringArr[i].slice(1,stringArr[i].length);
         updatedString+= capitalLetter+' ';
     }
    return updatedString;
}

console.log('check data',captilization(stringData));
```

### 11. check letter repitation in the word
```javascript 
function checkOccurense(word){
    let wordCount = word.length;
    let words = {};
    for(let i=0; i<wordCount; i++){
        if(words.hasOwnProperty(word[i])){
               words[word[i]]+=1; 
        }else{
             words[word[i]] =1; 
        }
      
    }
    return words;
}
console.log(checkOccurense("apple"));
//{ a: 1, p: 2, l: 1, e: 1 }
```

### 12. find target sum data
```javascript 
const arr = [4, 6, 7, 4, 3, 1, 2, 3, 4, 6, 7];
const targetSum = 9;

 function targetSumdata(arr,target){
     let count = arr.length;
     for(let i=0; i<count; i++){
         for(let j=i+1; j<count;j++){
             if(arr[i]+arr[j]==target){
                 return arr[i]+arr[j];
             }
         }
     }
 }
 
 console.log(targetSumdata(arr,9))
```

### 13. find non repeative first caracter index in the string
```javascript 
let a= 'abcdabc';

function nonRepeativeLetterIndex(str){
    let countOfletter = str.length;
    let wordObj = {};
    for(let i=0; i<countOfletter; i++){
        if(wordObj.hasOwnProperty(str[i])){
          wordObj[str[i]]++
        }else{
           wordObj[str[i]] = 1;
        }
    }
    
  for(let j=0; j<countOfletter; j++){
    if(wordObj[str[j]]===1){
        return j
    }
  }
 return -1
}

console.log('check Data',nonRepeativeLetterIndex(a))
```

### 14. give the letter count using reducer function 
```javascript 
 let newStr = 'checkthevalue';
 function letterCouter(str){
     let obj = {}
    return str.split('').reduce((pre,curr)=>{
          if(pre.hasOwnProperty(curr)){
               pre[curr]++
          }else{
              pre[curr]=1;
          }
        return  pre
     },{})
 }
 console.log(letterCouter(newStr));
 ```

 ### 16.check prime number
```javascript 
  function isPrime(number){
    if(number<2){
        return false;
    }
    for(let i=2; i<Math.sqrt(number); i++){
        if(number%i===0){
            return false;
        }
    }
      return true;
}


console.log(isPrime(6))

```

### 17. get logest word of the string
```javascript 
let sentence = "hello i am vikrant verma";
let preWord = '';
let sentenceArr = sentence.split(' ');

for(let i=1; i<=sentenceArr.length; i++){
if(sentenceArr[i]?.length>preWord?.length){
    preWord = sentenceArr[i];
 }
}

console.log('longest word',preWord);
```


### 18. Write a function that removes duplicates from an array
```javascript 
function removeDublicates(arr){
  return [...new Set(arr)];
}

console.log('remove dublicates',removeDublicates([9,8,4,7,7,7,3,9,8,8,2,7,2,7,2,6,6]));
```

### 19. Write a code to display which character is coming how many times in a given string ?
```javascript
let objString = 'hi i am best coder in the world. my name is vikrant.';
let objCount = {};
let stringArr = objString.split(' ');

for(let i= 0; i<stringArr.length; i++){
    let objWord = stringArr[i].split('');
     for(let j=0; j<objWord.length; j++){
        if(objCount.hasOwnProperty(objWord[j])){
         objCount[objWord[j]] += 1;
        }else{
         objCount[objWord[j]]=1;
        }
     }
}

console.log('check the data',objCount);
```
### 20. Given an array containing some numbers write a code to that will find out the missing number in the array’s range ?
```javascript 
 function returnMissingNumber(arr) {
    let n=arr.length+1;
    let sum=0;
    for(let item of arr) {
      sum+=item;
    }
   let x=(n*(n+1)/2)-sum;
    return x;
   }

   let arr=[1,2,3,5];
   console.log(returnMissingNumber(arr));  //4
```


### 21. How to get the maximum count of consecutive 1’s in an array ?
```javascript 
    function maxCount(arr) {
  let maxCount = 0;
  let currentCount=0;
  for(let i=0;i<arr.length;i++) {
     if(arr[i]==1) {
       currentCount += 1;
       maxCount = Math.max(currentCount, maxCount);
     }
     else {
       currentCount = 0;
     }
   }
   return maxCount;
 }

 let arr = [1,0,0,1,1,1,0,0,1,0,1,1,0,0,1];
 let result = maxCount(arr);
 console.log('result', result); //output:  3
```



 ### 22. How do you write a factorial code in JavaScript ?

```javascript 
  function factorial(num) {
  if(num ==0 || num==1) {
     return 1;
   }
   return num*factorial(num-1);
}

let result = factorial(3)
console.log(result) // output:  6
```

### 23. Given an integer array, find the subarray with the largest sum, and return its sum ?
```javascript 
 function findMaxSumSubArray(arr) {
   let currentSum=0;
   let maxSum=0;
   for(let i=0;i < arr.length;i++) {
     if(currentSum < 0) {
        currentSum = 0;
     }
     currentSum += arr[i];
     maxSum = Math.max(currentSum,currentSum); 
   }
   return maxSum;
}

let arr= [2,-3,4,2]
let result = findMaxSumSubArray(arr); 
console.log('result', result); //output:  result 6
```

### 24. How to merge two sorted arrays in JavaScript ?
```javascript 
function mergeSortedArrays(x, y){
  var i=0,j=0,result=[];
  while(i<x.length && j<y.length) {
      if(x[i]<y[j]) {
        result.push(x[i]);
        i++;
      }    
      else if(x[i]>y[j]) {
          result.push(y[j]);
          j++
      }
     else {
           result.push(x[i]);
           i++;
           j++;
       }
  }
  while(i<x.length) {
    result.push(x[i])
    i++;
  }
  while(j<y.length)
  {
    result.push(y[j]);
    j++;
  }
  return result;
}

let arr1= [1,3,5];
let arr2=[2,4,8];
let result = mergeSortedArrays(arr1,arr2);
console.log('result', result); //output : [1,2,3,4,5,8]
```

### 25. How do you check if a value is a prime number ?
```javascript 
function checkPrimeNumber(num) {
   if(num<=1) {
     return false;
   }
   for(let i=2;i < num;i++) {
      if(num%i == 0) {
        return false;
      }
   }
   return true;
}

let num=11;
let result = checkPrimeNumber(num);
console.log('result', result); //output : tru

```

### 26. How to reverse a string in JavaScript using recursion ?
```javascript 
 function reverse(str) {
  if(str == '') { 
    return '';
  }
  else {  
    lastIndex= str.length-1;
    return str[lastIndex]+ reverse(str.substring(0,lastIndex));
  }
}

let str = 'test'
let result = reverse(str);
console.log('result', result); //output:  tset
```



### 27. create a polly fil of the map function 
```javascript 
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
```

### 28. Create pollyfill funtion of filter function
```javascript 
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
```

### 29. create pollyfill of reduce funtion
```javascript 
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

console.log('reduce Result:',rsData);
```

### 30.Call function pollyfill 

```javascript 

function printName(city, country){
    console.log( `${this.firstName} ${this.lastName}, ${city} - ${country}` );
}

const myName = {
    firstName: 'Ankit',
    lastName: 'Saxena'
};


Function.prototype.myCall = function(context, ...args){
    let currentContext = context || globalThis;
    let randomProp = Math.random();
    while( currentContext[randomProp] !== undefined ){
        randomProp = Math.random();
    }
    currentContext[randomProp] = this;
    let result = currentContext[randomProp](...args);
    delete currentContext[randomProp];
    return result;
}

printName.myCall(myName, "Palia", "India");
```
### 31.Pollyfill of apply 
```javascript 

Function.prototype.myApply = function(context, args){
    let currentContext = context || globalThis;
    let uniqueProp = Math.random();
    while( currentContext[uniqueProp] !== undefined ){
        uniqueProp = Math.random();
    }
    currentContext[uniqueProp] = this;
    let result = currentContext[uniqueProp](...args);
    delete currentContext[uniqueProp];
    return result;
}

printName.myApply(myName, ["Palia", "India"]);
````
### 32. PollyFill of the bind function
```javascript 
let obj = {
  name: 'Jack',
};

let myFunc = function (id, city) {
  console.log(`${this.name}, ${id}, ${city}`);  // id will be undefined
};

// Accepting any number of arguments passed to myBind
Function.prototype.myBind = function (obj, ...args) {
  let func = this;
  // Accepting arguments passed to newFunc
  return function (...newArgs) {
    func.apply(obj, [...args, ...newArgs]);
  };
};

let newFunc = myFunc.myBind(obj, 'a_random_id')
newFunc('New York') // Jack, a_random_id, New York
```

### 33. debouncing function
Debouncing is a technique that delays the execution of a function until the user stops performing a certain action for a specified amount of time. 
```javascript 
function debounce(func, delay) {
    let timerId;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timerId);
        timerId = setTimeout(function () {
            func.apply(context, args);
        }, delay);
    };
}


function delayFuncExec() { 
    console.log("I AM GFG "); 
} 
  
let timerId = setTimeout(delayFuncExec, 1000) 

```

### 34.Implimenting Throtaling function
Throttling is a technique that limits the execution of a function to once in every specified time interval. 
```javascript 
function throttle(callback, delay = 1000) {
      let shouldWait = false;
      return (...args) => {
        if (shouldWait) return;
        callback(...args);
        shouldWait = true;
        setTimeout(() => {
              shouldWait = false;
        }, delay);
      };
}

function logMessage(message) { 
    console.log(message); 
} 

const throttledLogMessage = throttle(logMessage, 1000); 
  
// Logs 'Hello' 
throttledLogMessage('Hello'); 
```

### 35.sort accoding to max count of reppetted letter
```javascript 
const arrs = ['sanjayyyyy','kashyapyy','hellooo','worlddddd'];

function sordOrder(arr){
    let obj = [];
    for(let i=0; i<arr.length;i++){
        let maxCount ={};
        let word = arr[i].split('');
        for(let j=0; j<word.length; j++){
            if(maxCount.hasOwnProperty(word[j])){
                maxCount[word[j]]++
            }else{
                maxCount[word[j]] =1;
            }
        }
        let findMax = 0;
        for(let item in maxCount){
           if(findMax<maxCount[item]){
            findMax =maxCount[item];
           }
        }
        obj.push({
            name:[arr[i]],
            count:findMax
        });
    }
    
    return obj.sort((a,b)=>{
        if(b.count>a.count){
           return -1;
        }
        if(a.count>b.count){
            return 1;
         }
      
            return 0
    })
}

console.log('check data',sordOrder(arrs))
```

### 36. return targeted sum from the array possible number of pair
```javascript 
function findPairsWithSum(arr, targetSum) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === targetSum) {
        result.push([arr[i], arr[j]]);
      }
    }
  }
  return result;
}

const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const targetSum = 12;

const pairsWithSum9 = findPairsWithSum(arr, targetSum);
console.log(pairsWithSum9);
```

### 37.Write a function which converts string input into an object
```javascript
function stringToObject(str, finalValue){
    let keys = str.split('.');
    let result = {};
    let current = result;

    for(let i = 0; i < keys.length; i++){
        let key = keys[i];

        if(i === keys.length - 1){
            current[key] = finalValue;
        } else {
            current[key] = {};
            current = current[key]; // 🔥 move deeper
        }
    }

    return result;
}

// Test
const output = stringToObject("a.b.c", "someValue");
console.log(output);
// Output: {a: {b: {c: "someValue"}}}
```

##### Cleaner Short Version
```javascript
const stringToObject = (str, value) =>
  str.split('.').reduceRight((acc, key) => ({ [key]: acc }), value);

console.log(stringToObject("a.b.c", "someValue"));
```
### 38.Given an array, return an array where the each value is the product of the next two items: E.g. [3, 4, 5] -> [20, 15, 12]
```javascript
   function productOfNextTwo(arr){
        let result =[];
        let n = arr.length;
       for(let i = 0; i < n; i++){
        let next1 = arr[(i + 1) % n];
        let next2 = arr[(i + 2) % n];

        result.push(next1 * next2);
    }
    return result;
    }
    const inputArray = [3, 4, 5];
const outputArray = productOfNextTwo(inputArray);
console.log(outputArray); // Output: [20, 15, 12]
```
### 39.Find the 2nd largest element from a given array ? [100,20,112,22]
```javascript
function findSecondLargest(arr){
        let largestNum = -Infinity;
        let secondLargestNum = -Infinity;
        for(let i=0; i<arr.length; i++){
            if(arr[i]>largestNum){
                secondLargestNum = largestNum;
                largestNum = arr[i];
            }else if (arr[i]>secondLargestNum && arr[i]< largestNum){
              secondLargestNum = arr[i];
            }
        }

        return secondLargestNum;
    }
    
    const array = [10, 5, 20, 8, 12];
console.log(findSecondLargest(array)); // Output: 12
```
### 40.Program challenge: Find the pairs from given input ?
input1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
input2 = 10;
output = [[4, 6], [3, 7], [2, 8], [1, 9]]

```javascript
function findPairs(input1, input2) {
const pairs = [];
const seen = new Set();
for (const num of input1) {
const complement = input2 - num;
if (seen.has(complement)) {
pairs.push([complement, num]);
}
seen.add(num);
}
return pairs;
}
const input1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const input2 = 10;
const output = findPairs(input1, input2);
console.log(output);
// [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]]
```

### 41.Write a javascript program to get below output from given
input ?
I/P: abbcccddddeea
O/P: 1a2b3c4d2e1a

```javascript
function encodeString(str){
    let count = 1;
    let output = '';

    for(let i = 1; i < str.length; i++){
        if(str[i] === str[i - 1]){
            count++;
        } else {
            output += count + str[i - 1];
            count = 1;
        }
    }

    // Fix: append instead of overwrite
    output += count + str[str.length - 1];

    return output;
}

const input = "abbcccddddeea";
const output = encodeString(input);
console.log(output); // 1a2b3c4d2e1a
```
