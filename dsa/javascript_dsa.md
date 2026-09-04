

##  Move Zeroes
**Pattern:** Two Pointer

**Complexity:** O(n) time, O(1) space

```javascript
function moveZeroes(nums) {
  let write = 0;

  for (const num of nums) {
    if (num !== 0) {
      nums[write++] = num;
    }
  }

  while (write < nums.length) {
    nums[write++] = 0;
  }

  return nums;
}
```



### Example Input

```javascript
const nums = [0, 1, 0, 3, 12];
console.log(moveZeroes(nums));
```

### Example Output

```text
[1, 3, 12, 0, 0]
```
## 8. Rotate Array
**Pattern:** Array / In-place

**Complexity:** O(n) time, O(1) space

```javascript
function rotate(nums, k) {
  k %= nums.length;

  const reverse = (left, right) => {
    while (left < right) {
      [nums[left], nums[right]] = [nums[right], nums[left]];
      left++;
      right--;
    }
  };

  reverse(0, nums.length - 1);
  reverse(0, k - 1);
  reverse(k, nums.length - 1);

  return nums;
}
```



### Example Input

```javascript
const nums = [1, 2, 3, 4, 5, 6, 7];
const k = 3;
console.log(rotate(nums, k));
```

### Example Output

```text
[5, 6, 7, 1, 2, 3, 4]
```

```javascript
function missingNumber(nums) {
  let result = nums.length;

  for (let i = 0; i < nums.length; i++) {
    result ^= i ^ nums[i];
  }

  return result;
}
```



### Example Input

```javascript
const nums = [3, 0, 1];
console.log(missingNumber(nums));
```

### Example Output

```text
2
```


### Convert a flat array of objects into a hierarchical tree structure based on id and parentId.
```javascript
const data = [
  { id: 1, parentId: null },
  { id: 2, parentId: 1 },
  { id: 3, parentId: 1 },
  { id: 4, parentId: 2 },
  { id: 5, parentId: 3 }
];

function buildTree(objArr) {
  let map = new Map();
  let tree = [];

  // Step 1: Create all nodes
  for (let i = 0; i < objArr.length; i++) {
    map.set(objArr[i].id, {
      ...objArr[i],
      children: []
    });
  }

  // Step 2: Build parent-child relationship
  for (let j = 0; j < objArr.length; j++) {
    let item = map.get(objArr[j].id);

    if (item.parentId === null) {
      tree.push(item);
    } else {
      const parent = map.get(item.parentId);

      if (parent) {
        parent.children.push(item);
      }
    }
  }

  return tree;
}

console.log(buildTree(data));

//output
[
  {
    id: 1,
    parentId: null,
    children: [
      {
        id: 2,
        parentId: 1,
        children: [
          {
            id: 4,
            parentId: 2,
            children: []
          }
        ]
      },
      {
        id: 3,
        parentId: 1,
        children: [
          {
            id: 5,
            parentId: 3,
            children: []
          }
        ]
      }
    ]
  }
]
```

### Convert a deeply nested object into a flat object using dot notation.

```javascript 
const input = {
  user: {
    name: "Shikhar",
    address: {
      city: "Delhi",
      pin: 110001
    }
  }
};

function bindObjectName(obj,parentKey=''){
      let result = {};
      for(let key in obj){
         const isObject = (typeof obj[key] == "object");
         let currentKey = parentKey ? `${parentKey}.${key}` : key;
          if(isObject && obj[key] !== null){
           const nextedResult = bindObjectName(obj[key],currentKey);
           Object.assign(result, nextedResult);
          }else{
          result[currentKey]=obj[key]; 
          }
      }
    return result;
}

console.log(bindObjectName(input));

// Output:
// {
//   "user.name": "Shikhar",
//   "user.address.city": "Delhi",
//   "user.address.pin": 110001
// }

```

### Swap value inplace
output: c$b#a
```javascript
let str = "a$b#c";

let arr = str.split("");

let left = 0;
let right = arr.length - 1;

const isAlphabet = (char) => /[a-zA-Z]/.test(char);

while (left < right) {
    if (!isAlphabet(arr[left])) {
        left++;
    } else if (!isAlphabet(arr[right])) {
        right--;
    } else {
        [arr[left], arr[right]] = [arr[right], arr[left]];
        left++;
        right--;
    }
}

console.log(arr.join(""));

```

### Count degits 
```javascript
function countDigit(number){
     let count = 0;
     number = Math.abs(number);
     while(number>0){
       number = Math.floor(number/10);
       count++
     }
     return count;
}

console.log(countDigit(-12348887773))
// output 11
```


### Given an input string s, reverse the order of the words.

A word is defined as a sequence of non-space characters. The words in s will be separated by at least one space.

```javascript
//Input: s = “the sky is blue”

//Output: “blue is sky the”

//Example 2:
//Input: s = ” hello world “

//Output: “world hello”

var reverseWords = function(s) {
    s = s.trim();

    let wordArray = [];
    let word = "";

    for (let c of s) {
        if (c !== " ") {
            word += c;
        } else if (word.length > 0) {
            wordArray.unshift(word);
            word = "";
        }
    }

    // push the last word
    if (word.length > 0) {
        wordArray.unshift(word);
    }

    return wordArray.join(" ");
};
```

### A parentheses string is valid if and only if:

It is the empty string,
It can be written as AB (A concatenated with B), where A and B are valid strings, or
It can be written as (A), where A is a valid string.
You are given a parentheses string s. In one move, you can insert a parenthesis at any position of the string.

For example, if s = “()))”, you can insert an opening parenthesis to be “(()))” or a closing parenthesis to be “())))”.
Return the minimum number of moves required to make s valid.
```javascript
Examples:
Example 1:
Input: s = “())”

Output: 1

Example 2:
Input: s = “(((“

Output: 3

var minAddToMakeValid = function(s) {
    let openCount = 0, moves = 0;

    for (let c of s) {
        if (c == "(") {
            openCount++;
        } else {
            if (openCount == 0) {
                moves++;
            } else {
                openCount--; // FIXED
            }
        }
    }

    return moves + openCount;
};

```


### Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same. Then return the number of unique elements in nums.
```javascript
//Example 1:
//Input: nums = [1,1,2]

//Output: 2, nums = [1,2,_]

// Example 2:
// Input: nums = [0,0,1,1,1,2,2,3,3,4]

// Output: 5, nums = [0,1,2,3,4,_,_,_,_,_]

 var removeDuplicates = function(nums) {
      let x = 0;
      for (let i = 0; i < nums.length; i++) {
          if (nums[i] > nums[x]) {
              x++;
              nums[x] = nums[i];
          }
      }
      return x + 1;
  }; 

```

### Binary Search is an efficient algorithm used to find the position of a target value within a sorted array. Unlike linear search, it repeatedly divides the search interval in half, significantly reducing the number of comparisons.

```javascript

// Input: [1, 3, 5, 7, 9]

// Output: 7

let val = [1, 3, 5, 7, 9];

function binarySearch(arr, target){
   let left = 0;
   let right = arr.length -1;
   
   while(right>=left){
     let middle = Math.floor((left+right)/2);
     if(target===arr[middle]){
       return middle;
     }else if(target< arr[middle]){
          right = middle-1; 
     }else{
       left = middle+1;
     }
   }
   
   return -1;
}

console.log(binarySearch(val,7));
//output index is 3
```

###  Given an integer array nums and an integer val, remove all occurrences of val in-place. The order of the elements may be changed. Then return the number of elements in nums which are not equal to val.

```javascript
//Example 1:
//Input: nums = [3,2,2,3], val = 3

//Output: 2, nums = [2,2,_,_]

//Explanation: The first 2 elements should be 2. Underscores represent irrelevant values.

//Example 2:
//Input: nums = [0,1,2,2,3,0,4,2], val = 2

//Output: 5, nums = [0,1,4,0,3,_,_,_]

//Explanation: The first 5 elements should be any order of [0,1,4,0,3].

var removeElement = function(nums, val) {
  let x = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] != val) {
      nums[x] = nums[i];
      x++;
    }
  }
  return x;
};
```

```javascript
/**
 * Merge Sorted Array
 * Input:
 * nums1 = [1,2,3,0,0,0], m = 3
 * nums2 = [2,5,6], n = 3
 *
 * Explanation:
 * nums1 contains the first 3 valid elements: [1,2,3]
 * nums2 contains: [2,5,6]
 *
 * After merging both sorted arrays:
 * Output: [1,2,2,3,5,6]

 */

 let nums1 = [1,2,3,0,0,0], m = 3;
let nums2 = [2,5,6], n = 3;



function sortMerge(arr1, ln, arr2, lr) {
    for (let i = 0; i < lr; i++) {
        arr1[ln + i] = arr2[i];
    }
    return arr1.sort((a, b) => a - b);
}

const data = sortMerge(nums1,m,nums2,n);
console.log(data);
```
### Write a recursive function isPowerOfTwo(n) that returns true if n is a power of 2, otherwise false.

```javascript 
function isPowerOfTwo(num){
      if(num==1){
        return true;
      }
      
      if((num%2)!=0 || num<1) return false;
      
       return isPowerOfTwo(num/2);
}

console.log(isPowerOfTwo(3));
```

### The Fibonacci sequence is a famous mathematical series in which each number is the sum of two preceding ones It’s defined by the recurrence relation:
```javascript
//F(0) = 0
//F(1) = 1
//F(n) = F(n-1) + F(n-2) for n > 1

function febo(n){
    if(n<=1) return n;
    return febo(n-1)+febo(n-2);
}

console.log(febo(10));
```



### 0.1. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

```javascript 
let stockprice = [4, 1, 9, 8, 12, 2];

function maxProfitfn(arr) {
  if (!Array.isArray(arr)) return false;
  if (arr.length === 0) return false;

  let buyPrice = arr[0];
  let maxProfit = 0;

  for (let i = 1; i < arr.length; i++) {
    if (typeof arr[i] !== 'number' || !Number.isFinite(arr[i])) {
      return false;
    }

    // Calculate profit if sold today
    let profit = arr[i] - buyPrice;

    // Update max profit
    if (profit > maxProfit) {
      maxProfit = profit;
    }

    // Update minimum buy price
    if (arr[i] < buyPrice) {
      buyPrice = arr[i];
    }
  }

  return maxProfit;
}

console.log(maxProfitfn(stockprice)); // 11

console.log(findMaxmumProfit(stocksArr));
```
```javascript 
let stocksArr = [7,6,4,3,1];
 
var maxProfit = function(prices) {
      let maxProfit = 0;
      for (let i = 0; i < prices.length; i++) {
          for (let j = i + 1; j < prices.length; j++) {
              if ((prices[j] - prices[i]) > maxProfit) {
                  maxProfit = prices[j] - prices[i];
              }
          }
      }
      return maxProfit;
  };   

console.log(maxProfit(stocksArr));
```

### 0.2. swap string value in place
 
 ```javascript 
 let stringValue = ['h','e','l','l','o'];
 
  function reverseString(str){
       let strLen = str.length;
       let halfLen  = Math.floor(strLen/2)
      for(let i=0;i<halfLen; i++){
          let temp = str[i];
          str[i] =  str[strLen-1-i]; 
          str[strLen-1-i] = temp
      }
      
      return str;
  }
  
  console.log(reverseString(stringValue))
// Output:[“o”,”l”,”l”,”e”,”h”]
```

### 0.3. Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.
```javascript 
// Example 1:
// Input: nums = [2, 2, 1]

// Output: 1

// Example 2:
// Input: nums = [4, 1, 2, 1, 2]

// Output: 4

// Example 3:
// Input: nums = [1]

// Output: 1

 function findNundublicate(arr){
     let unique = {};
     for(let i=0; i<arr.length; i++){
        if(!unique[arr[i]]){
           unique[arr[i]]=1;
        }else{
          unique[arr[i]]+=1;
        }
     }
     
     for(let i=0; i<arr.length; i++){
          if(unique[arr[i]]==1){
            return arr[i];
          }
     }
 }
 
 let nums = [4, 1, 2, 1, 2]
 
 console.log(findNundublicate(nums))
```

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

const transformName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
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
    if (num <= 1) return false;

    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) {
            return false;
        }
    }

    return true;
}
console.log(checkPrimeNumber(11)); // true
console.log(checkPrimeNumber(12)); // false

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
function printName(city, country) {
    console.log(`${this.firstName} ${this.lastName}, ${city} - ${country}`);
}

const myName = {
    firstName: "Ankit",
    lastName: "Saxena"
};

Function.prototype.myCall = function (context, ...args) {

    // add function temporarily
    context.fn = this;

    // call function
    context.fn(...args);

    // remove temporary function
    delete context.fn;
};

printName.myCall(myName, "Palia", "India");
```
### 31.Pollyfill of apply 
```javascript 

function printName(city, country) {
    console.log(`${this.firstName} ${this.lastName}, ${city} - ${country}`);
}

const myName = {
    firstName: "Ankit",
    lastName: "Saxena"
};

Function.prototype.myApply = function (context, args) {

    // add function temporarily
    context.fn = this;

    // call function with array arguments
    context.fn(...args);

    // remove temporary function
    delete context.fn;
};

printName.myApply(myName, ["Palia", "India"]);
````
### 32. PollyFill of the bind function
```javascript 
let obj = {
  name: "Jack",
};

function myFunc(id, city) {
  console.log(`${this.name}, ${id}, ${city}`);
}

Function.prototype.myBind = function (context, ...args) {

  let fn = this;

  return function (...newArgs) {

    fn.apply(context, [...args, ...newArgs]);

  };
};

let newFunc = myFunc.myBind(obj, "a_random_id");

newFunc("New York");
```

### 33. debouncing function
Debouncing is a technique that delays the execution of a function until the user stops performing a certain action for a specified amount of time. 
```javascript 
function debounce(fn, delay = 300) {
  let timerId;

  return function (...args) {
    const context = this;

    clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

function search(text) {
  console.log("Searching:", text);
}

const debouncedSearch = debounce(search, 1000);

debouncedSearch("R");
debouncedSearch("Re");
debouncedSearch("Rea");
debouncedSearch("React");

```

### 34.Implimenting Throtaling function
Throttling is a technique that limits the execution of a function to once in every specified time interval. 
```javascript 
function throttle(callback, delay = 1000) {
  let isThrottled = false;

  return function (...args) {
    if (isThrottled) return;

    callback.apply(this, args);

    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;
    }, delay);
  };
}

function logMessage(message) {
  console.log(message);
}

const throttledLogMessage = throttle(logMessage, 1000);

throttledLogMessage("Hello"); // Executes
throttledLogMessage("World"); // Ignored

setTimeout(() => {
  throttledLogMessage("Again"); // Executes after 1 second
}, 1100);
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
output: [
  { name: [ 'kashyapyy' ], count: 3 },
  { name: [ 'hellooo' ], count: 3 },
  { name: [ 'sanjayyyyy' ], count: 5 },
  { name: [ 'worlddddd' ], count: 5 }
]
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
const array = [10, 5, 20, 8, 12];

function finSecondLargest(arr){
     let largest = -Infinity;
     let secondLargest = -Infinity;
     for(let num of arr){
        if(num>largest){
            secondLargest=largest;
            largest=num;
        }else if(num<largest && num>secondLargest){
            secondLargest = num;
        }
     }
     return secondLargest;
}

console.log(finSecondLargest(array)); // Output: 12
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

or:

function encodeString(str) {
  return str.replace(/(.)\1*/g, match => {
    return match.length + match[0];
  });
}

console.log(encodeString("abbcccddddeea"));
// 1a2b3c4d2e1a
```

### Deep clone with recurive function
```javascript 
function deepClone(value){
    if(value === null || typeof value !== "object"){
        return value;
    }

    const result = Array.isArray(value) ? [] :{};

    for (const key in value){
        result[key] = deepClone(value[key]);
    }

    return result;
}

// test deep clone function
const user = {
  name: "Vikrant",
  age: 30,
  address: {
    city: "Gurugram",
    country: "India"
  },
  skills: ["JavaScript", "Node.js"],
  projects: [
    {
      name: "E-commerce",
      tech: ["React", "Node"]
    }
  ]
};

const clonedUser = deepClone(user);

clonedUser.address.city = "Delhi";
clonedUser.skills.push("TypeScript");
clonedUser.projects[0].tech.push("MongoDB");

console.log(clonedUser)

```

