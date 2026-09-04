# Senior Node.js / Full-Stack — 100 DSA Problems With JavaScript Programs

This README contains the **100 selected DSA problems with JavaScript implementations** for Senior Node.js / Full-Stack interview preparation.

The focus is on learning the **pattern + implementation + complexity**, rather than memorizing random LeetCode solutions.

> **Important:** Some problems have a deliberately simple implementation first. In a senior interview, be prepared to discuss and implement the optimized version using the appropriate data structure (for example, a real Min Heap for Kth Largest / Merge K Sorted Lists, and two heaps for Median From Data Stream).

---

## How to Use This README

For every problem:

1. Understand the problem.
2. Try a brute-force solution first.
3. Identify the optimal pattern.
4. Implement it yourself without looking.
5. Explain time and space complexity.
6. Test edge cases.
7. Explain why the chosen data structure works.

## Priority

- ⭐⭐⭐ = Must know
- ⭐⭐ = Important
- No star = Complete after the high-priority problems

---

## 100-Problem Map

| # | Topic | Problems |
|---|---|---|
| 1-15 | Arrays | HashMap, Prefix Sum, Kadane, Sorting, Two Pointers |
| 16-25 | Strings | HashMap, String processing, Sliding Window |
| 26-33 | Sliding Window | Fixed/Variable windows |
| 34-39 | Two Pointers | Array/string pointer techniques |
| 40-46 | Binary Search | Normal, rotated, answer-space search |
| 47-54 | Stack | Stack + Monotonic Stack |
| 55-64 | Linked List | Fast/slow pointers, LRU |
| 65-74 | Trees/BST | DFS, BFS, BST |
| 75-79 | Heap | Top K, Priority Queue, Median |
| 80-87 | Graph | BFS, DFS, Topological Sort, Dijkstra, DSU |
| 88-95 | DP | 1D, 2D, Grid, String DP |
| 96-100 | Greedy/Backtracking/Trie | Greedy, recursion, prefix tree |

---

## 1. Two Sum
**Pattern:** HashMap

**Complexity:** O(n) time, O(n) space

```javascript
function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    seen.set(nums[i], i);
  }

  return [];
}
```



### Example Input

```javascript
const nums = [2, 7, 11, 15];
const target = 9;
console.log(twoSum(nums, target));
```

### Example Output

```text
[0, 1]
```
## 2. Best Time to Buy and Sell Stock
**Pattern:** Greedy

**Complexity:** O(n) time, O(1) space

```javascript
function maxProfit(prices) {
  let minPrice = Infinity;
  let profit = 0;

  for (const price of prices) {
    minPrice = Math.min(minPrice, price);
    profit = Math.max(profit, price - minPrice);
  }

  return profit;
}
```



### Example Input

```javascript
const prices = [7, 1, 5, 3, 6, 4];
console.log(maxProfit(prices));
```

### Example Output

```text
5
```
## 3. Contains Duplicate
**Pattern:** HashSet

**Complexity:** O(n) time, O(n) space

```javascript
function containsDuplicate(nums) {
  return new Set(nums).size !== nums.length;
}
```



### Example Input

```javascript
const nums = [1, 2, 3, 1];
console.log(containsDuplicate(nums));
```

### Example Output

```text
true
```
## 4. Product of Array Except Self
**Pattern:** Prefix + Suffix

**Complexity:** O(n) time, O(1) extra space excluding output

```javascript
function productExceptSelf(nums) {
  const result = new Array(nums.length).fill(1);

  let prefix = 1;
  for (let i = 0; i < nums.length; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }

  let suffix = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
}
```



### Example Input

```javascript
const nums = [1, 2, 3, 4];
console.log(productExceptSelf(nums));
```

### Example Output

```text
[24, 12, 8, 6]
```
## 5. Maximum Subarray
**Pattern:** Kadane's Algorithm

**Complexity:** O(n) time, O(1) space

```javascript
function maxSubArray(nums) {
  let current = nums[0];
  let best = nums[0];

  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }

  return best;
}
```



### Example Input

```javascript
const nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
console.log(maxSubArray(nums));
```

### Example Output

```text
6
```
## 6. Maximum Product Subarray
**Pattern:** DP

**Complexity:** O(n) time, O(1) space

```javascript
function maxProduct(nums) {
  let maxHere = nums[0];
  let minHere = nums[0];
  let result = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const value = nums[i];

    if (value < 0) {
      [maxHere, minHere] = [minHere, maxHere];
    }

    maxHere = Math.max(value, maxHere * value);
    minHere = Math.min(value, minHere * value);

    result = Math.max(result, maxHere);
  }

  return result;
}
```



### Example Input

```javascript
const nums = [2, 3, -2, 4];
console.log(maxProduct(nums));
```

### Example Output

```text
6
```
## 7. Move Zeroes
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
## 9. Majority Element
**Pattern:** Boyer-Moore Voting

**Complexity:** O(n) time, O(1) space

```javascript
function majorityElement(nums) {
  let candidate = null;
  let count = 0;

  for (const num of nums) {
    if (count === 0) candidate = num;
    count += num === candidate ? 1 : -1;
  }

  return candidate;
}
```



### Example Input

```javascript
const nums = [2, 2, 1, 1, 1, 2, 2];
console.log(majorityElement(nums));
```

### Example Output

```text
2
```
## 10. Missing Number
**Pattern:** XOR

**Complexity:** O(n) time, O(1) space

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
## 11. Find All Duplicates in an Array
**Pattern:** In-place marking

**Complexity:** O(n) time, O(1) extra space

```javascript
function findDuplicates(nums) {
  const result = [];

  for (const num of nums) {
    const index = Math.abs(num) - 1;

    if (nums[index] < 0) {
      result.push(Math.abs(num));
    } else {
      nums[index] *= -1;
    }
  }

  return result;
}
```



### Example Input

```javascript
const nums = [4, 3, 2, 7, 8, 2, 3, 1];
console.log(findDuplicates(nums));
```

### Example Output

```text
[2, 3]
```
## 12. Sort Colors
**Pattern:** Dutch National Flag

**Complexity:** O(n) time, O(1) space

```javascript
function sortColors(nums) {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;

  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }

  return nums;
}
```



### Example Input

```javascript
const nums = [2, 0, 2, 1, 1, 0];
console.log(sortColors(nums));
```

### Example Output

```text
[0, 0, 1, 1, 2, 2]
```
## 13. 3Sum
**Pattern:** Sorting + Two Pointers

**Complexity:** O(n²) time, O(1) extra space excluding output

```javascript
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);

        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}
```



### Example Input

```javascript
const nums = [-1, 0, 1, 2, -1, -4];
console.log(threeSum(nums));
```

### Example Output

```text
[[-1, -1, 2], [-1, 0, 1]]
```
## 14. Subarray Sum Equals K
**Pattern:** Prefix Sum + HashMap

**Complexity:** O(n) time, O(n) space

```javascript
function subarraySum(nums, k) {
  const prefixCount = new Map([[0, 1]]);
  let sum = 0;
  let count = 0;

  for (const num of nums) {
    sum += num;

    if (prefixCount.has(sum - k)) {
      count += prefixCount.get(sum - k);
    }

    prefixCount.set(sum, (prefixCount.get(sum) || 0) + 1);
  }

  return count;
}
```



### Example Input

```javascript
const nums = [1, 1, 1];
const k = 2;
console.log(subarraySum(nums, k));
```

### Example Output

```text
2
```
## 15. Merge Intervals
**Pattern:** Sorting + Greedy

**Complexity:** O(n log n) time, O(n) space

```javascript
function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];

  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = result[result.length - 1];

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      result.push(current);
    }
  }

  return result;
}
```



### Example Input

```javascript
const intervals = [[1, 3], [2, 6], [8, 10], [15, 18]];
console.log(mergeIntervals(intervals));
```

### Example Output

```text
[[1, 6], [8, 10], [15, 18]]
```
## 16. Valid Anagram
**Pattern:** Frequency Map

**Complexity:** O(n) time, O(k) space

```javascript
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const count = new Map();

  for (const char of s) {
    count.set(char, (count.get(char) || 0) + 1);
  }

  for (const char of t) {
    if (!count.has(char)) return false;

    count.set(char, count.get(char) - 1);
    if (count.get(char) === 0) count.delete(char);
  }

  return count.size === 0;
}
```



### Example Input

```javascript
const s = "anagram";
const t = "nagaram";
console.log(isAnagram(s, t));
```

### Example Output

```text
true
```
## 17. Group Anagrams
**Pattern:** HashMap

**Complexity:** O(n * k log k) time

```javascript
function groupAnagrams(strs) {
  const groups = new Map();

  for (const str of strs) {
    const key = [...str].sort().join("");

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(str);
  }

  return [...groups.values()];
}
```



### Example Input

```javascript
const strs = ["eat", "tea", "tan", "ate", "nat", "bat"];
console.log(groupAnagrams(strs));
```

### Example Output

```text
[["eat","tea","ate"], ["tan","nat"], ["bat"]]
```
## 18. Valid Palindrome
**Pattern:** Two Pointers

**Complexity:** O(n) time, O(1) space

```javascript
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    while (left < right && !/[a-zA-Z0-9]/.test(s[left])) left++;
    while (left < right && !/[a-zA-Z0-9]/.test(s[right])) right--;

    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }

    left++;
    right--;
  }

  return true;
}
```



### Example Input

```javascript
const s = "A man, a plan, a canal: Panama";
console.log(isPalindrome(s));
```

### Example Output

```text
true
```
## 19. Longest Common Prefix
**Pattern:** String Traversal

**Complexity:** O(n * m) worst case

```javascript
function longestCommonPrefix(strs) {
  if (!strs.length) return "";

  let prefix = strs[0];

  for (let i = 1; i < strs.length; i++) {
    while (!strs[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }

  return prefix;
}
```



### Example Input

```javascript
const strs = ["flower", "flow", "flight"];
console.log(longestCommonPrefix(strs));
```

### Example Output

```text
"fl"
```
## 20. First Unique Character
**Pattern:** Frequency Map

**Complexity:** O(n) time, O(k) space

```javascript
function firstUniqChar(s) {
  const count = new Map();

  for (const char of s) {
    count.set(char, (count.get(char) || 0) + 1);
  }

  for (let i = 0; i < s.length; i++) {
    if (count.get(s[i]) === 1) return i;
  }

  return -1;
}
```



### Example Input

```javascript
const s = "leetcode";
console.log(firstUniqChar(s));
```

### Example Output

```text
0
```
## 21. Longest Palindromic Substring
**Pattern:** Expand Around Center

**Complexity:** O(n²) time, O(1) space

```javascript
function longestPalindrome(s) {
  let start = 0;
  let end = 0;

  function expand(left, right) {
    while (
      left >= 0 &&
      right < s.length &&
      s[left] === s[right]
    ) {
      left--;
      right++;
    }

    return [left + 1, right - 1];
  }

  for (let i = 0; i < s.length; i++) {
    const odd = expand(i, i);
    const even = expand(i, i + 1);

    if (odd[1] - odd[0] > end - start) {
      [start, end] = odd;
    }

    if (even[1] - even[0] > end - start) {
      [start, end] = even;
    }
  }

  return s.slice(start, end + 1);
}
```



### Example Input

```javascript
const s = "babad";
console.log(longestPalindrome(s));
```

### Example Output

```text
"bab"  // "aba" is also valid
```
## 22. String Compression
**Pattern:** Two Pointers

**Complexity:** O(n) time, O(1) extra space

```javascript
function compress(chars) {
  let write = 0;
  let read = 0;

  while (read < chars.length) {
    const char = chars[read];
    let count = 0;

    while (read < chars.length && chars[read] === char) {
      read++;
      count++;
    }

    chars[write++] = char;

    if (count > 1) {
      for (const digit of String(count)) {
        chars[write++] = digit;
      }
    }
  }

  return write;
}
```



### Example Input

```javascript
const chars = ["a", "a", "b", "b", "c", "c", "c"];
const length = compress(chars);
console.log(chars.slice(0, length));
```

### Example Output

```text
["a", "2", "b", "2", "c", "3"]
```
## 23. Encode and Decode Strings
**Pattern:** Length-prefix encoding

**Complexity:** O(n) time

```javascript
function encode(strings) {
  return strings.map(s => `${s.length}#${s}`).join("");
}

function decode(encoded) {
  const result = [];
  let i = 0;

  while (i < encoded.length) {
    let j = i;

    while (encoded[j] !== "#") j++;

    const length = Number(encoded.slice(i, j));
    const start = j + 1;

    result.push(encoded.slice(start, start + length));
    i = start + length;
  }

  return result;
}
```



### Example Input

```javascript
const strings = ["hello", "world", "#test"];
const encoded = encode(strings);
console.log(encoded);
console.log(decode(encoded));
```

### Example Output

```text
"5#hello5#world5##test"
["hello", "world", "#test"]
```
## 24. Isomorphic Strings
**Pattern:** Bidirectional HashMap

**Complexity:** O(n) time, O(k) space

```javascript
function isIsomorphic(s, t) {
  if (s.length !== t.length) return false;

  const sToT = new Map();
  const tToS = new Map();

  for (let i = 0; i < s.length; i++) {
    const a = s[i];
    const b = t[i];

    if (
      (sToT.has(a) && sToT.get(a) !== b) ||
      (tToS.has(b) && tToS.get(b) !== a)
    ) {
      return false;
    }

    sToT.set(a, b);
    tToS.set(b, a);
  }

  return true;
}
```



### Example Input

```javascript
const s = "egg";
const t = "add";
console.log(isIsomorphic(s, t));
```

### Example Output

```text
true
```
## 25. Minimum Window Substring
**Pattern:** Sliding Window

**Complexity:** O(n) time, O(k) space

```javascript
function minWindow(s, t) {
  if (!s || !t || t.length > s.length) return "";

  const need = new Map();
  for (const char of t) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  let have = 0;
  let left = 0;
  let bestStart = 0;
  let bestLength = Infinity;
  const window = new Map();

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    if (need.has(char)) {
      window.set(char, (window.get(char) || 0) + 1);

      if (window.get(char) <= need.get(char)) {
        have++;
      }
    }

    while (have === t.length) {
      if (right - left + 1 < bestLength) {
        bestLength = right - left + 1;
        bestStart = left;
      }

      const leftChar = s[left++];

      if (need.has(leftChar)) {
        if (window.get(leftChar) <= need.get(leftChar)) {
          have--;
        }

        window.set(leftChar, window.get(leftChar) - 1);
      }
    }
  }

  return bestLength === Infinity
    ? ""
    : s.slice(bestStart, bestStart + bestLength);
}
```



### Example Input

```javascript
const s = "ADOBECODEBANC";
const t = "ABC";
console.log(minWindow(s, t));
```

### Example Output

```text
"BANC"
```
## 26. Longest Substring Without Repeating Characters
**Pattern:** Sliding Window

**Complexity:** O(n) time, O(k) space

```javascript
function lengthOfLongestSubstring(s) {
  const lastSeen = new Map();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    if (lastSeen.has(char) && lastSeen.get(char) >= left) {
      left = lastSeen.get(char) + 1;
    }

    lastSeen.set(char, right);
    best = Math.max(best, right - left + 1);
  }

  return best;
}
```



### Example Input

```javascript
const s = "abcabcbb";
console.log(lengthOfLongestSubstring(s));
```

### Example Output

```text
3
```
## 27. Longest Substring With At Most K Distinct Characters
**Pattern:** Sliding Window

**Complexity:** O(n) time, O(k) space

```javascript
function lengthAtMostKDistinct(s, k) {
  const count = new Map();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    count.set(s[right], (count.get(s[right]) || 0) + 1);

    while (count.size > k) {
      const char = s[left++];
      count.set(char, count.get(char) - 1);
      if (count.get(char) === 0) count.delete(char);
    }

    best = Math.max(best, right - left + 1);
  }

  return best;
}
```



### Example Input

```javascript
const s = "eceba";
const k = 2;
console.log(lengthAtMostKDistinct(s, k));
```

### Example Output

```text
3
```
## 28. Longest Repeating Character Replacement
**Pattern:** Sliding Window

**Complexity:** O(n) time, O(k) space

```javascript
function characterReplacement(s, k) {
  const count = new Map();
  let left = 0;
  let maxFrequency = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    count.set(char, (count.get(char) || 0) + 1);
    maxFrequency = Math.max(maxFrequency, count.get(char));

    while (right - left + 1 - maxFrequency > k) {
      const leftChar = s[left++];
      count.set(leftChar, count.get(leftChar) - 1);
    }

    best = Math.max(best, right - left + 1);
  }

  return best;
}
```



### Example Input

```javascript
const s = "AABABBA";
const k = 1;
console.log(characterReplacement(s, k));
```

### Example Output

```text
4
```
## 29. Permutation in String
**Pattern:** Fixed Sliding Window

**Complexity:** O(n) time, O(k) space

```javascript
function checkInclusion(s1, s2) {
  if (s1.length > s2.length) return false;

  const need = new Map();
  for (const char of s1) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  const window = new Map();
  let left = 0;
  let matched = 0;

  for (let right = 0; right < s2.length; right++) {
    const char = s2[right];

    if (need.has(char)) {
      window.set(char, (window.get(char) || 0) + 1);

      if (window.get(char) <= need.get(char)) matched++;
    }

    while (right - left + 1 > s1.length) {
      const leftChar = s2[left++];

      if (need.has(leftChar)) {
        if (window.get(leftChar) <= need.get(leftChar)) matched--;
        window.set(leftChar, window.get(leftChar) - 1);
      }
    }

    if (matched === s1.length) return true;
  }

  return false;
}
```



### Example Input

```javascript
const s1 = "ab";
const s2 = "eidbaooo";
console.log(checkInclusion(s1, s2));
```

### Example Output

```text
true
```
## 30. Find All Anagrams in a String
**Pattern:** Fixed Sliding Window

**Complexity:** O(n) time, O(k) space

```javascript
function findAnagrams(s, p) {
  if (p.length > s.length) return [];

  const need = new Map();
  for (const char of p) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  const window = new Map();
  const result = [];
  let left = 0;
  let matched = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    if (need.has(char)) {
      window.set(char, (window.get(char) || 0) + 1);
      if (window.get(char) <= need.get(char)) matched++;
    }

    while (right - left + 1 > p.length) {
      const leftChar = s[left++];

      if (need.has(leftChar)) {
        if (window.get(leftChar) <= need.get(leftChar)) matched--;
        window.set(leftChar, window.get(leftChar) - 1);
      }
    }

    if (matched === p.length) result.push(left);
  }

  return result;
}
```



### Example Input

```javascript
const s = "cbaebabacd";
const p = "abc";
console.log(findAnagrams(s, p));
```

### Example Output

```text
[0, 6]
```
## 31. Maximum Sum Subarray of Size K
**Pattern:** Fixed Sliding Window

**Complexity:** O(n) time, O(1) space

```javascript
function maxSumSubarrayK(nums, k) {
  if (k > nums.length) return null;

  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];

  let best = sum;

  for (let right = k; right < nums.length; right++) {
    sum += nums[right] - nums[right - k];
    best = Math.max(best, sum);
  }

  return best;
}
```



### Example Input

```javascript
const nums = [2, 1, 5, 1, 3, 2];
const k = 3;
console.log(maxSumSubarrayK(nums, k));
```

### Example Output

```text
9
```
## 32. Minimum Size Subarray Sum
**Pattern:** Variable Sliding Window

**Complexity:** O(n) time, O(1) space

```javascript
function minSubArrayLen(target, nums) {
  let left = 0;
  let sum = 0;
  let best = Infinity;

  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];

    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= nums[left++];
    }
  }

  return best === Infinity ? 0 : best;
}
```



### Example Input

```javascript
const target = 7;
const nums = [2, 3, 1, 2, 4, 3];
console.log(minSubArrayLen(target, nums));
```

### Example Output

```text
2
```
## 33. Max Consecutive Ones III
**Pattern:** Sliding Window

**Complexity:** O(n) time, O(1) space

```javascript
function longestOnes(nums, k) {
  let left = 0;
  let zeros = 0;
  let best = 0;

  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeros++;

    while (zeros > k) {
      if (nums[left++] === 0) zeros--;
    }

    best = Math.max(best, right - left + 1);
  }

  return best;
}
```



### Example Input

```javascript
const nums = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0];
const k = 2;
console.log(longestOnes(nums, k));
```

### Example Output

```text
6
```
## 34. Container With Most Water
**Pattern:** Two Pointers

**Complexity:** O(n) time, O(1) space

```javascript
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let best = 0;

  while (left < right) {
    const area = Math.min(height[left], height[right]) * (right - left);
    best = Math.max(best, area);

    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return best;
}
```



### Example Input

```javascript
const height = [1, 8, 6, 2, 5, 4, 8, 3, 7];
console.log(maxArea(height));
```

### Example Output

```text
49
```
## 35. Trapping Rain Water
**Pattern:** Two Pointers

**Complexity:** O(n) time, O(1) space

```javascript
function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;

  while (left < right) {
    if (height[left] <= height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }

  return water;
}
```



### Example Input

```javascript
const height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
console.log(trap(height));
```

### Example Output

```text
6
```
## 36. Remove Duplicates from Sorted Array II
**Pattern:** In-place Two Pointer

**Complexity:** O(n) time, O(1) space

```javascript
function removeDuplicatesII(nums) {
  let write = 0;

  for (const num of nums) {
    if (write < 2 || num !== nums[write - 2]) {
      nums[write++] = num;
    }
  }

  return write;
}
```



### Example Input

```javascript
const nums = [0, 0, 1, 1, 1, 1, 2, 3, 3];
const length = removeDuplicatesII(nums);
console.log(nums.slice(0, length));
```

### Example Output

```text
[0, 0, 1, 1, 2, 3, 3]
```
## 37. Valid Palindrome
**Pattern:** Two Pointers

**Complexity:** O(n) time, O(1) space

```javascript
function validPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }

  return true;
}
```



### Example Input

```javascript
const s = "racecar";
console.log(validPalindrome(s));
```

### Example Output

```text
true
```
## 38. Squares of a Sorted Array
**Pattern:** Two Pointers

**Complexity:** O(n) time, O(n) output space

```javascript
function sortedSquares(nums) {
  const result = new Array(nums.length);
  let left = 0;
  let right = nums.length - 1;

  for (let write = nums.length - 1; write >= 0; write--) {
    const leftValue = Math.abs(nums[left]);
    const rightValue = Math.abs(nums[right]);

    if (leftValue > rightValue) {
      result[write] = leftValue * leftValue;
      left++;
    } else {
      result[write] = rightValue * rightValue;
      right--;
    }
  }

  return result;
}
```



### Example Input

```javascript
const nums = [-4, -1, 0, 3, 10];
console.log(sortedSquares(nums));
```

### Example Output

```text
[0, 1, 9, 16, 100]
```
## 39. 3Sum
**Pattern:** Sorting + Two Pointers

```javascript
// See problem #13.
// Same core solution: sort + two pointers + duplicate skipping.
```



### Example Input

```javascript
// Same input as #13
const nums = [-1, 0, 1, 2, -1, -4];
console.log(threeSum(nums));
```

### Example Output

```text
[[-1, -1, 2], [-1, 0, 1]]
```
## 40. Search Insert Position
**Pattern:** Binary Search

**Complexity:** O(log n) time, O(1) space

```javascript
function searchInsert(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return left;
}
```



### Example Input

```javascript
const nums = [1, 3, 5, 6];
const target = 5;
console.log(searchInsert(nums, target));
```

### Example Output

```text
2
```
## 41. First and Last Position
**Pattern:** Boundary Binary Search

**Complexity:** O(log n) time, O(1) space

```javascript
function searchRange(nums, target) {
  function bound(findFirst) {
    let left = 0;
    let right = nums.length - 1;
    let answer = -1;

    while (left <= right) {
      const mid = left + Math.floor((right - left) / 2);

      if (nums[mid] === target) {
        answer = mid;
        if (findFirst) right = mid - 1;
        else left = mid + 1;
      } else if (nums[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return answer;
  }

  return [bound(true), bound(false)];
}
```



### Example Input

```javascript
const nums = [5, 7, 7, 8, 8, 10];
const target = 8;
console.log(searchRange(nums, target));
```

### Example Output

```text
[3, 4]
```
## 42. Search in Rotated Sorted Array
**Pattern:** Modified Binary Search

**Complexity:** O(log n) time, O(1) space

```javascript
function searchRotated(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) return mid;

    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}
```



### Example Input

```javascript
const nums = [4, 5, 6, 7, 0, 1, 2];
const target = 0;
console.log(searchRotated(nums, target));
```

### Example Output

```text
4
```
## 43. Find Minimum in Rotated Sorted Array
**Pattern:** Binary Search

**Complexity:** O(log n) time, O(1) space

```javascript
function findMin(nums) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return nums[left];
}
```



### Example Input

```javascript
const nums = [3, 4, 5, 1, 2];
console.log(findMin(nums));
```

### Example Output

```text
1
```
## 44. Find Peak Element
**Pattern:** Binary Search

**Complexity:** O(log n) time, O(1) space

```javascript
function findPeakElement(nums) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] > nums[mid + 1]) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }

  return left;
}
```



### Example Input

```javascript
const nums = [1, 2, 3, 1];
console.log(findPeakElement(nums));
```

### Example Output

```text
2
```
## 45. Koko Eating Bananas
**Pattern:** Binary Search on Answer

**Complexity:** O(n log maxPile) time

```javascript
function minEatingSpeed(piles, h) {
  let left = 1;
  let right = Math.max(...piles);

  function canFinish(speed) {
    let hours = 0;

    for (const pile of piles) {
      hours += Math.ceil(pile / speed);
      if (hours > h) return false;
    }

    return true;
  }

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (canFinish(mid)) right = mid;
    else left = mid + 1;
  }

  return left;
}
```



### Example Input

```javascript
const piles = [3, 6, 7, 11];
const h = 8;
console.log(minEatingSpeed(piles, h));
```

### Example Output

```text
4
```
## 46. Capacity to Ship Packages Within D Days
**Pattern:** Binary Search on Answer

**Complexity:** O(n log sum(weights)) time

```javascript
function shipWithinDays(weights, days) {
  let left = Math.max(...weights);
  let right = weights.reduce((sum, weight) => sum + weight, 0);

  function canShip(capacity) {
    let usedDays = 1;
    let current = 0;

    for (const weight of weights) {
      if (current + weight > capacity) {
        usedDays++;
        current = 0;
      }

      current += weight;
    }

    return usedDays <= days;
  }

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (canShip(mid)) right = mid;
    else left = mid + 1;
  }

  return left;
}
```



### Example Input

```javascript
const weights = [1, 2, 3, 1, 1];
const days = 4;
console.log(shipWithinDays(weights, days));
```

### Example Output

```text
3
```
## 47. Valid Parentheses
**Pattern:** Stack

**Complexity:** O(n) time, O(n) space

```javascript
function isValidParentheses(s) {
  const stack = [];
  const pairs = {
    ")": "(",
    "]": "[",
    "}": "{"
  };

  for (const char of s) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char);
    } else {
      if (stack.pop() !== pairs[char]) return false;
    }
  }

  return stack.length === 0;
}
```



### Example Input

```javascript
const s = "()[]{}";
console.log(isValidParentheses(s));
```

### Example Output

```text
true
```
## 48. Min Stack
**Pattern:** Stack + Auxiliary Stack

**Complexity:** O(1) per operation

```javascript
class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = [];
  }

  push(value) {
    this.stack.push(value);

    const min = this.minStack.length
      ? Math.min(value, this.minStack[this.minStack.length - 1])
      : value;

    this.minStack.push(min);
  }

  pop() {
    this.minStack.pop();
    return this.stack.pop();
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  getMin() {
    return this.minStack[this.minStack.length - 1];
  }
}
```



### Example Input

```javascript
const minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);
console.log(minStack.getMin());
minStack.pop();
console.log(minStack.top());
console.log(minStack.getMin());
```

### Example Output

```text
-3
0
-2
```
## 49. Evaluate Reverse Polish Notation
**Pattern:** Stack

**Complexity:** O(n) time, O(n) space

```javascript
function evalRPN(tokens) {
  const stack = [];

  for (const token of tokens) {
    if (!Number.isNaN(Number(token))) {
      stack.push(Number(token));
      continue;
    }

    const b = stack.pop();
    const a = stack.pop();

    switch (token) {
      case "+": stack.push(a + b); break;
      case "-": stack.push(a - b); break;
      case "*": stack.push(a * b); break;
      case "/": stack.push(Math.trunc(a / b)); break;
    }
  }

  return stack[0];
}
```



### Example Input

```javascript
const tokens = ["2", "1", "+", "3", "*"];
console.log(evalRPN(tokens));
```

### Example Output

```text
9
```
## 50. Daily Temperatures
**Pattern:** Monotonic Stack

**Complexity:** O(n) time, O(n) space

```javascript
function dailyTemperatures(temperatures) {
  const result = new Array(temperatures.length).fill(0);
  const stack = [];

  for (let i = 0; i < temperatures.length; i++) {
    while (
      stack.length &&
      temperatures[i] > temperatures[stack[stack.length - 1]]
    ) {
      const index = stack.pop();
      result[index] = i - index;
    }

    stack.push(i);
  }

  return result;
}
```



### Example Input

```javascript
const temperatures = [73, 74, 75, 71, 69, 72, 76, 73];
console.log(dailyTemperatures(temperatures));
```

### Example Output

```text
[1, 1, 4, 2, 1, 1, 0, 0]
```
## 51. Next Greater Element
**Pattern:** Monotonic Stack

**Complexity:** O(n) time, O(n) space

```javascript
function nextGreaterElement(nums1, nums2) {
  const stack = [];
  const next = new Map();

  for (const num of nums2) {
    while (stack.length && num > stack[stack.length - 1]) {
      next.set(stack.pop(), num);
    }
    stack.push(num);
  }

  return nums1.map(num => next.get(num) ?? -1);
}
```



### Example Input

```javascript
const nums1 = [4, 1, 2];
const nums2 = [1, 3, 4, 2];
console.log(nextGreaterElement(nums1, nums2));
```

### Example Output

```text
[-1, 3, -1]
```
## 52. Next Greater Element II
**Pattern:** Circular Monotonic Stack

**Complexity:** O(n) time, O(n) space

```javascript
function nextGreaterElements(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = [];

  for (let i = 0; i < 2 * n; i++) {
    const index = i % n;

    while (
      stack.length &&
      nums[index] > nums[stack[stack.length - 1]]
    ) {
      result[stack.pop()] = nums[index];
    }

    if (i < n) stack.push(index);
  }

  return result;
}
```



### Example Input

```javascript
const nums = [1, 2, 1];
console.log(nextGreaterElements(nums));
```

### Example Output

```text
[2, -1, 2]
```
## 53. Largest Rectangle in Histogram
**Pattern:** Monotonic Stack

**Complexity:** O(n) time, O(n) space

```javascript
function largestRectangleArea(heights) {
  const stack = [];
  let best = 0;

  for (let i = 0; i <= heights.length; i++) {
    const current = i === heights.length ? 0 : heights[i];

    while (
      stack.length &&
      current < heights[stack[stack.length - 1]]
    ) {
      const height = heights[stack.pop()];
      const left = stack.length ? stack[stack.length - 1] : -1;
      const width = i - left - 1;

      best = Math.max(best, height * width);
    }

    stack.push(i);
  }

  return best;
}
```



### Example Input

```javascript
const heights = [2, 1, 5, 6, 2, 3];
console.log(largestRectangleArea(heights));
```

### Example Output

```text
10
```
## 54. Decode String
**Pattern:** Stack

**Complexity:** O(n) excluding generated output

```javascript
function decodeString(s) {
  const countStack = [];
  const stringStack = [];

  let current = "";
  let number = 0;

  for (const char of s) {
    if (/[0-9]/.test(char)) {
      number = number * 10 + Number(char);
    } else if (char === "[") {
      countStack.push(number);
      stringStack.push(current);
      number = 0;
      current = "";
    } else if (char === "]") {
      const repeat = countStack.pop();
      const previous = stringStack.pop();
      current = previous + current.repeat(repeat);
    } else {
      current += char;
    }
  }

  return current;
}
```



### Example Input

```javascript
const s = "3[a2[c]]";
console.log(decodeString(s));
```

### Example Output

```text
"accaccacc"
```
## 55. Reverse Linked List
**Pattern:** Pointer Manipulation

**Complexity:** O(n) time, O(1) space

```javascript
function reverseList(head) {
  let previous = null;
  let current = head;

  while (current) {
    const next = current.next;
    current.next = previous;
    previous = current;
    current = next;
  }

  return previous;
}
```



### Example Input

```javascript
// Linked list: 1 -> 2 -> 3 -> null
const head = { val: 1, next: { val: 2, next: { val: 3, next: null } } };
const result = reverseList(head);
console.log(result.val, result.next.val, result.next.next.val);
```

### Example Output

```text
3 2 1
```
## 56. Reverse Linked List Recursively
**Pattern:** Recursion

**Complexity:** O(n) time, O(n) call stack

```javascript
function reverseListRecursive(head) {
  if (!head || !head.next) return head;

  const newHead = reverseListRecursive(head.next);

  head.next.next = head;
  head.next = null;

  return newHead;
}
```



### Example Input

```javascript
// Linked list: 1 -> 2 -> 3 -> null
const head = { val: 1, next: { val: 2, next: { val: 3, next: null } } };
const result = reverseListRecursive(head);
console.log(result.val, result.next.val, result.next.next.val);
```

### Example Output

```text
3 2 1
```
## 57. Middle of Linked List
**Pattern:** Fast / Slow Pointers

**Complexity:** O(n) time, O(1) space

```javascript
function middleNode(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow;
}
```



### Example Input

```javascript
// Linked list: 1 -> 2 -> 3 -> 4 -> 5 -> null
const head = { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: null } } } } };
console.log(middleNode(head).val);
```

### Example Output

```text
3
```
## 58. Linked List Cycle
**Pattern:** Floyd Cycle Detection

**Complexity:** O(n) time, O(1) space

```javascript
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) return true;
  }

  return false;
}
```



### Example Input

```javascript
// Linked list: 3 -> 2 -> 0 -> -4, where -4 points back to 2
const node2 = { val: 2, next: null };
const node3 = { val: 3, next: node2 };
const node0 = { val: 0, next: null };
const node4 = { val: -4, next: node2 };
node2.next = node0;
node0.next = node4;
console.log(hasCycle(node3));
```

### Example Output

```text
true
```
## 59. Linked List Cycle II
**Pattern:** Floyd Cycle Detection

**Complexity:** O(n) time, O(1) space

```javascript
function detectCycle(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      let entry = head;

      while (entry !== slow) {
        entry = entry.next;
        slow = slow.next;
      }

      return entry;
    }
  }

  return null;
}
```



### Example Input

```javascript
// Linked list: 3 -> 2 -> 0 -> -4, where -4 points back to 2
const node2 = { val: 2, next: null };
const head = { val: 3, next: node2 };
const node0 = { val: 0, next: null };
const node4 = { val: -4, next: node2 };
node2.next = node0;
node0.next = node4;
console.log(detectCycle(head) === node2);
```

### Example Output

```text
true
```
## 60. Merge Two Sorted Lists
**Pattern:** Two Pointers

**Complexity:** O(n + m) time, O(1) extra space

```javascript
function mergeTwoLists(list1, list2) {
  const dummy = { next: null };
  let current = dummy;

  while (list1 && list2) {
    if (list1.val <= list2.val) {
      current.next = list1;
      list1 = list1.next;
    } else {
      current.next = list2;
      list2 = list2.next;
    }

    current = current.next;
  }

  current.next = list1 || list2;

  return dummy.next;
}
```



### Example Input

```javascript
// list1: 1 -> 2 -> 4, list2: 1 -> 3 -> 4
const list1 = { val: 1, next: { val: 2, next: { val: 4, next: null } } };
const list2 = { val: 1, next: { val: 3, next: { val: 4, next: null } } };
const result = mergeTwoLists(list1, list2);
console.log(result.val, result.next.val, result.next.next.val, result.next.next.next.val, result.next.next.next.next.val, result.next.next.next.next.next.val);
```

### Example Output

```text
1 1 2 3 4 4
```
## 61. Remove Nth Node From End
**Pattern:** Fast / Slow Pointers

**Complexity:** O(n) time, O(1) space

```javascript
function removeNthFromEnd(head, n) {
  const dummy = { next: head };
  let fast = dummy;
  let slow = dummy;

  for (let i = 0; i < n; i++) {
    fast = fast.next;
  }

  while (fast.next) {
    fast = fast.next;
    slow = slow.next;
  }

  slow.next = slow.next.next;

  return dummy.next;
}
```



### Example Input

```javascript
// Linked list: 1 -> 2 -> 3 -> 4 -> 5, remove n = 2
const head = { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: null } } } } };
const result = removeNthFromEnd(head, 2);
console.log(result.val, result.next.val, result.next.next.val, result.next.next.next.val);
```

### Example Output

```text
1 2 3 5
```
## 62. Reorder List
**Pattern:** Middle + Reverse + Merge

**Complexity:** O(n) time, O(1) space

```javascript
function reorderList(head) {
  if (!head || !head.next) return head;

  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  let second = slow.next;
  slow.next = null;

  let previous = null;
  while (second) {
    const next = second.next;
    second.next = previous;
    previous = second;
    second = next;
  }

  let first = head;
  second = previous;

  while (second) {
    const firstNext = first.next;
    const secondNext = second.next;

    first.next = second;
    second.next = firstNext;

    first = firstNext;
    second = secondNext;
  }

  return head;
}
```



### Example Input

```javascript
// Linked list: 1 -> 2 -> 3 -> 4 -> 5
// Reorder to: 1 -> 5 -> 2 -> 4 -> 3
```

### Example Output

```text
1 -> 5 -> 2 -> 4 -> 3
```
## 63. Palindrome Linked List
**Pattern:** Fast/Slow + Reverse

**Complexity:** O(n) time, O(1) extra space

```javascript
function isPalindromeList(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  let previous = null;
  while (slow) {
    const next = slow.next;
    slow.next = previous;
    previous = slow;
    slow = next;
  }

  let left = head;
  let right = previous;

  while (right) {
    if (left.val !== right.val) return false;
    left = left.next;
    right = right.next;
  }

  return true;
}
```



### Example Input

```javascript
// Linked list: 1 -> 2 -> 2 -> 1
const head = { val: 1, next: { val: 2, next: { val: 2, next: { val: 1, next: null } } } };
console.log(isPalindromeList(head));
```

### Example Output

```text
true
```
## 64. LRU Cache
**Pattern:** HashMap + Doubly Linked List

**Complexity:** O(1) get/put

```javascript
class LRUNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();

    this.head = new LRUNode(0, 0);
    this.tail = new LRUNode(0, 0);

    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  insertAtFront(node) {
    node.next = this.head.next;
    node.prev = this.head;

    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    const node = this.cache.get(key);

    this.remove(node);
    this.insertAtFront(node);

    return node.value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;

      this.remove(node);
      this.insertAtFront(node);
      return;
    }

    const node = new LRUNode(key, value);

    this.cache.set(key, node);
    this.insertAtFront(node);

    if (this.cache.size > this.capacity) {
      const leastRecentlyUsed = this.tail.prev;
      this.remove(leastRecentlyUsed);
      this.cache.delete(leastRecentlyUsed.key);
    }
  }
}
```



### Example Input

```javascript
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1));
cache.put(3, 3);
console.log(cache.get(2));
cache.put(4, 4);
console.log(cache.get(1));
console.log(cache.get(3));
console.log(cache.get(4));
```

### Example Output

```text
1
-1
-1
3
4
```
## 65. Binary Tree Inorder Traversal
**Pattern:** Iterative DFS

**Complexity:** O(n) time, O(h) space

```javascript
function inorderTraversal(root) {
  const result = [];
  const stack = [];
  let current = root;

  while (current || stack.length) {
    while (current) {
      stack.push(current);
      current = current.left;
    }

    current = stack.pop();
    result.push(current.val);
    current = current.right;
  }

  return result;
}
```



### Example Input

```text
Tree:       1
           / \
          2   3
         / \
        4   5

Input root = [1,2,3,4,5]
```

### Example Output

```text
[4, 2, 5, 1, 3]
```
## 66. Binary Tree Preorder Traversal
**Pattern:** Iterative DFS

**Complexity:** O(n) time, O(h) space

```javascript
function preorderTraversal(root) {
  if (!root) return [];

  const result = [];
  const stack = [root];

  while (stack.length) {
    const node = stack.pop();
    result.push(node.val);

    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }

  return result;
}
```



### Example Input

```text
Tree:       1
           / \
          2   3
         / \
        4   5

Input root = [1,2,3,4,5]
```

### Example Output

```text
[1, 2, 4, 5, 3]
```
## 67. Binary Tree Level Order Traversal
**Pattern:** BFS

**Complexity:** O(n) time, O(n) space

```javascript
function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];
  let index = 0;

  while (index < queue.length) {
    const levelSize = queue.length - index;
    const level = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue[index++];
      level.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(level);
  }

  return result;
}
```



### Example Input

```text
Tree:       3
           / \
          9  20
             /  \
            15   7

Input root = [3,9,20,null,null,15,7]
```

### Example Output

```text
[[3], [9, 20], [15, 7]]
```
## 68. Maximum Depth of Binary Tree
**Pattern:** DFS

**Complexity:** O(n) time, O(h) call stack

```javascript
function maxDepth(root) {
  if (!root) return 0;

  return 1 + Math.max(
    maxDepth(root.left),
    maxDepth(root.right)
  );
}
```



### Example Input

```text
Tree:       3
           / \
          9  20
             /  \
            15   7

Input root = [3,9,20,null,null,15,7]
```

### Example Output

```text
3
```
## 69. Diameter of Binary Tree
**Pattern:** Tree DFS

**Complexity:** O(n) time, O(h) space

```javascript
function diameterOfBinaryTree(root) {
  let diameter = 0;

  function depth(node) {
    if (!node) return 0;

    const left = depth(node.left);
    const right = depth(node.right);

    diameter = Math.max(diameter, left + right);

    return 1 + Math.max(left, right);
  }

  depth(root);
  return diameter;
}
```



### Example Input

```text
Tree:       1
           / \
          2   3
         / \
        4   5

Input root = [1,2,3,4,5]
```

### Example Output

```text
3
```
## 70. Balanced Binary Tree
**Pattern:** Bottom-Up DFS

**Complexity:** O(n) time, O(h) space

```javascript
function isBalanced(root) {
  function height(node) {
    if (!node) return 0;

    const left = height(node.left);
    if (left === -1) return -1;

    const right = height(node.right);
    if (right === -1) return -1;

    if (Math.abs(left - right) > 1) return -1;

    return 1 + Math.max(left, right);
  }

  return height(root) !== -1;
}
```



### Example Input

```text
Tree:       3
           / \
          9  20
             /  \
            15   7

Input root = [3,9,20,null,null,15,7]
```

### Example Output

```text
true
```
## 71. Validate Binary Search Tree
**Pattern:** DFS + Bounds

**Complexity:** O(n) time, O(h) space

```javascript
function isValidBST(root) {
  function validate(node, min, max) {
    if (!node) return true;

    if (node.val <= min || node.val >= max) {
      return false;
    }

    return (
      validate(node.left, min, node.val) &&
      validate(node.right, node.val, max)
    );
  }

  return validate(root, -Infinity, Infinity);
}
```



### Example Input

```text
Tree:       2
           / \
          1   3

Input root = [2,1,3]
```

### Example Output

```text
true
```
## 72. Lowest Common Ancestor of Binary Tree
**Pattern:** Tree DFS

**Complexity:** O(n) time, O(h) space

```javascript
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) {
    return root;
  }

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  if (left && right) return root;

  return left || right;
}
```



### Example Input

```text
Tree:       3
           / \
          5   1
         / \ / \
        6  2 0  8
          / \
         7   4

p = 5, q = 1
```

### Example Output

```text
3
```
## 73. Kth Smallest Element in BST
**Pattern:** BST Inorder

**Complexity:** O(h + k) time, O(h) space

```javascript
function kthSmallest(root, k) {
  const stack = [];
  let current = root;

  while (current || stack.length) {
    while (current) {
      stack.push(current);
      current = current.left;
    }

    current = stack.pop();

    if (--k === 0) return current.val;

    current = current.right;
  }

  return null;
}
```



### Example Input

```text
BST:        3
           / \
          1   4
           \
            2

k = 1
```

### Example Output

```text
1
```
## 74. Serialize and Deserialize Binary Tree
**Pattern:** DFS + Serialization

**Complexity:** O(n) time, O(n) space

```javascript
function serialize(root) {
  if (!root) return "";

  const result = [];

  function dfs(node) {
    if (!node) {
      result.push("#");
      return;
    }

    result.push(String(node.val));
    dfs(node.left);
    dfs(node.right);
  }

  dfs(root);
  return result.join(",");
}

function deserialize(data) {
  if (!data) return null;

  const values = data.split(",");
  let index = 0;

  function dfs() {
    const value = values[index++];

    if (value === "#") return null;

    const node = {
      val: Number(value),
      left: null,
      right: null
    };

    node.left = dfs();
    node.right = dfs();

    return node;
  }

  return dfs();
}
```



### Example Input

```text
Tree:       1
           / \
          2   3
         / \
        4   5

Input root = [1,2,3,4,5]
```

### Example Output

```text
Serialized: "1,2,4,#,#,5,#,#,3,#,#"
After deserialize: same tree structure
```
## 75. Kth Largest Element in an Array
**Pattern:** Sorting (simple interview version)

**Complexity:** O(n log n) time

```javascript
function findKthLargest(nums, k) {
  nums.sort((a, b) => b - a);
  return nums[k - 1];
}
```



### Example Input

```javascript
const nums = [3, 2, 1, 5, 6, 4];
const k = 2;
console.log(findKthLargest(nums, k));
```

### Example Output

```text
5
```
## 76. Top K Frequent Elements
**Pattern:** HashMap + Bucket Sort

**Complexity:** O(n) average time, O(n) space

```javascript
function topKFrequent(nums, k) {
  const count = new Map();

  for (const num of nums) {
    count.set(num, (count.get(num) || 0) + 1);
  }

  const buckets = Array.from(
    { length: nums.length + 1 },
    () => []
  );

  for (const [num, frequency] of count) {
    buckets[frequency].push(num);
  }

  const result = [];

  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
    result.push(...buckets[i]);
  }

  return result.slice(0, k);
}
```



### Example Input

```javascript
const nums = [1, 1, 1, 2, 2, 3];
const k = 2;
console.log(topKFrequent(nums, k));
```

### Example Output

```text
[1, 2]
```
## 77. K Closest Points to Origin
**Pattern:** Sorting / Heap alternative

**Complexity:** O(n log n) time

```javascript
function kClosest(points, k) {
  return points
    .sort((a, b) =>
      (a[0] ** 2 + a[1] ** 2) -
      (b[0] ** 2 + b[1] ** 2)
    )
    .slice(0, k);
}
```



### Example Input

```javascript
const points = [[1, 3], [-2, 2], [5, 8]];
const k = 2;
console.log(kClosest(points, k));
```

### Example Output

```text
[[-2, 2], [1, 3]]
```
## 78. Merge K Sorted Lists
**Pattern:** Simple sorting solution; optimize with Min Heap in interviews

**Complexity:** O(N log N) time

```javascript
function mergeKLists(lists) {
  const values = [];

  for (const head of lists) {
    let current = head;

    while (current) {
      values.push(current.val);
      current = current.next;
    }
  }

  values.sort((a, b) => a - b);

  const dummy = { next: null };
  let current = dummy;

  for (const value of values) {
    current.next = { val: value, next: null };
    current = current.next;
  }

  return dummy.next;
}
```



### Example Input

```text
Input lists:
1 -> 4 -> 5
1 -> 3 -> 4
2 -> 6
```

### Example Output

```text
1 -> 1 -> 2 -> 3 -> 4 -> 4 -> 5 -> 6
```
## 79. Find Median From Data Stream
**Pattern:** Sorted structure; optimize with two heaps

**Complexity:** add O(n), median O(1)

```javascript
class MedianFinder {
  constructor() {
    this.values = [];
  }

  addNum(num) {
    let left = 0;
    let right = this.values.length;

    while (left < right) {
      const mid = left + Math.floor((right - left) / 2);

      if (this.values[mid] < num) left = mid + 1;
      else right = mid;
    }

    this.values.splice(left, 0, num);
  }

  findMedian() {
    const n = this.values.length;

    if (n % 2 === 1) {
      return this.values[Math.floor(n / 2)];
    }

    return (
      this.values[n / 2 - 1] +
      this.values[n / 2]
    ) / 2;
  }
}
```



### Example Input

```javascript
const finder = new MedianFinder();
finder.addNum(1);
console.log(finder.findMedian());
finder.addNum(2);
console.log(finder.findMedian());
finder.addNum(3);
console.log(finder.findMedian());
```

### Example Output

```text
1
1.5
2
```
## 80. Number of Islands
**Pattern:** DFS

**Complexity:** O(rows * cols) time

```javascript
function numIslands(grid) {
  let islands = 0;

  function dfs(row, col) {
    if (
      row < 0 ||
      col < 0 ||
      row >= grid.length ||
      col >= grid[0].length ||
      grid[row][col] !== "1"
    ) {
      return;
    }

    grid[row][col] = "0";

    dfs(row + 1, col);
    dfs(row - 1, col);
    dfs(row, col + 1);
    dfs(row, col - 1);
  }

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col] === "1") {
        islands++;
        dfs(row, col);
      }
    }
  }

  return islands;
}
```



### Example Input

```javascript
const grid = [
  ["1", "1", "0", "0", "0"],
  ["1", "1", "0", "0", "0"],
  ["0", "0", "1", "0", "0"],
  ["0", "0", "0", "1", "1"]
];
console.log(numIslands(grid));
```

### Example Output

```text
3
```
## 81. Clone Graph
**Pattern:** DFS + HashMap

**Complexity:** O(V + E) time

```javascript
function cloneGraph(node) {
  if (!node) return null;

  const clones = new Map();

  function dfs(current) {
    if (clones.has(current)) {
      return clones.get(current);
    }

    const copy = {
      val: current.val,
      neighbors: []
    };

    clones.set(current, copy);

    for (const neighbor of current.neighbors) {
      copy.neighbors.push(dfs(neighbor));
    }

    return copy;
  }

  return dfs(node);
}
```



### Example Input

```text
Graph adjacency list:
1: [2,4]
2: [1,3]
3: [2,4]
4: [1,3]

Input node = 1
```

### Example Output

```text
A cloned graph with the same adjacency structure, but different node objects.
```
## 82. Course Schedule
**Pattern:** Topological Sort

**Complexity:** O(V + E) time

```javascript
function canFinish(numCourses, prerequisites) {
  const graph = Array.from(
    { length: numCourses },
    () => []
  );

  const indegree = new Array(numCourses).fill(0);

  for (const [course, prerequisite] of prerequisites) {
    graph[prerequisite].push(course);
    indegree[course]++;
  }

  const queue = [];

  for (let i = 0; i < numCourses; i++) {
    if (indegree[i] === 0) queue.push(i);
  }

  let completed = 0;

  for (let index = 0; index < queue.length; index++) {
    const course = queue[index];
    completed++;

    for (const next of graph[course]) {
      indegree[next]--;

      if (indegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  return completed === numCourses;
}
```



### Example Input

```javascript
const numCourses = 2;
const prerequisites = [[1, 0]];
console.log(canFinish(numCourses, prerequisites));
```

### Example Output

```text
true
```
## 83. Course Schedule II
**Pattern:** Topological Sort

**Complexity:** O(V + E) time

```javascript
function findOrder(numCourses, prerequisites) {
  const graph = Array.from(
    { length: numCourses },
    () => []
  );

  const indegree = new Array(numCourses).fill(0);

  for (const [course, prerequisite] of prerequisites) {
    graph[prerequisite].push(course);
    indegree[course]++;
  }

  const queue = [];

  for (let i = 0; i < numCourses; i++) {
    if (indegree[i] === 0) queue.push(i);
  }

  const order = [];

  for (let i = 0; i < queue.length; i++) {
    const course = queue[i];
    order.push(course);

    for (const next of graph[course]) {
      if (--indegree[next] === 0) {
        queue.push(next);
      }
    }
  }

  return order.length === numCourses ? order : [];
}
```



### Example Input

```javascript
const numCourses = 4;
const prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]];
console.log(findOrder(numCourses, prerequisites));
```

### Example Output

```text
[0, 1, 2, 3]  // [0, 2, 1, 3] is also valid
```
## 84. Rotting Oranges
**Pattern:** Multi-source BFS

**Complexity:** O(rows * cols) time

```javascript
function orangesRotting(grid) {
  const queue = [];
  let fresh = 0;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      if (grid[r][c] === 1) fresh++;
    }
  }

  let minutes = 0;
  let index = 0;
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  while (index < queue.length && fresh > 0) {
    const size = queue.length - index;

    for (let i = 0; i < size; i++) {
      const [r, c] = queue[index++];

      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;

        if (
          nr >= 0 &&
          nc >= 0 &&
          nr < grid.length &&
          nc < grid[0].length &&
          grid[nr][nc] === 1
        ) {
          grid[nr][nc] = 2;
          fresh--;
          queue.push([nr, nc]);
        }
      }
    }

    minutes++;
  }

  return fresh === 0 ? minutes : -1;
}
```



### Example Input

```javascript
const grid = [[2,1,1],[1,1,0],[0,1,1]];
console.log(orangesRotting(grid));
```

### Example Output

```text
4
```
## 85. Number of Connected Components
**Pattern:** Union-Find / DSU

**Complexity:** Near O(V + E)

```javascript
function countComponents(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);

  function find(x) {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);
    }
    return parent[x];
  }

  function union(a, b) {
    let rootA = find(a);
    let rootB = find(b);

    if (rootA === rootB) return false;

    if (rank[rootA] < rank[rootB]) {
      [rootA, rootB] = [rootB, rootA];
    }

    parent[rootB] = rootA;

    if (rank[rootA] === rank[rootB]) {
      rank[rootA]++;
    }

    return true;
  }

  let components = n;

  for (const [a, b] of edges) {
    if (union(a, b)) components--;
  }

  return components;
}
```



### Example Input

```javascript
const n = 5;
const edges = [[0,1],[1,2],[3,4]];
console.log(countComponents(n, edges));
```

### Example Output

```text
2
```
## 86. Shortest Path in Binary Matrix
**Pattern:** BFS

**Complexity:** O(n²) time

```javascript
function shortestPathBinaryMatrix(grid) {
  const n = grid.length;

  if (grid[0][0] !== 0 || grid[n - 1][n - 1] !== 0) {
    return -1;
  }

  const queue = [[0, 0, 1]];
  grid[0][0] = 1;

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  let index = 0;

  while (index < queue.length) {
    const [r, c, distance] = queue[index++];

    if (r === n - 1 && c === n - 1) {
      return distance;
    }

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;

      if (
        nr >= 0 &&
        nc >= 0 &&
        nr < n &&
        nc < n &&
        grid[nr][nc] === 0
      ) {
        grid[nr][nc] = 1;
        queue.push([nr, nc, distance + 1]);
      }
    }
  }

  return -1;
}
```



### Example Input

```javascript
const grid = [[0,1],[1,0]];
console.log(shortestPathBinaryMatrix(grid));
```

### Example Output

```text
2
```
## 87. Network Delay Time
**Pattern:** Dijkstra

**Complexity:** O(V² + E) with simple implementation

```javascript
function networkDelayTime(times, n, k) {
  const graph = Array.from({ length: n + 1 }, () => []);

  for (const [from, to, weight] of times) {
    graph[from].push([to, weight]);
  }

  const distances = new Array(n + 1).fill(Infinity);
  distances[k] = 0;

  // Simple O(V²) Dijkstra implementation.
  const visited = new Set();

  for (let i = 1; i <= n; i++) {
    let current = -1;
    let best = Infinity;

    for (let node = 1; node <= n; node++) {
      if (!visited.has(node) && distances[node] < best) {
        best = distances[node];
        current = node;
      }
    }

    if (current === -1) break;

    visited.add(current);

    for (const [next, weight] of graph[current]) {
      const candidate = distances[current] + weight;

      if (candidate < distances[next]) {
        distances[next] = candidate;
      }
    }
  }

  let answer = 0;

  for (let node = 1; node <= n; node++) {
    if (distances[node] === Infinity) return -1;
    answer = Math.max(answer, distances[node]);
  }

  return answer;
}
```



### Example Input

```javascript
const times = [[2,1,1],[2,3,1],[3,4,1]];
const n = 4;
const k = 2;
console.log(networkDelayTime(times, n, k));
```

### Example Output

```text
2
```
## 88. Climbing Stairs
**Pattern:** 1D DP

**Complexity:** O(n) time, O(1) space

```javascript
function climbStairs(n) {
  if (n <= 2) return n;

  let one = 1;
  let two = 2;

  for (let i = 3; i <= n; i++) {
    const current = one + two;
    one = two;
    two = current;
  }

  return two;
}
```



### Example Input

```javascript
const n = 5;
console.log(climbStairs(n));
```

### Example Output

```text
8
```
## 89. House Robber
**Pattern:** 1D DP

**Complexity:** O(n) time, O(1) space

```javascript
function rob(nums) {
  let previousTwo = 0;
  let previousOne = 0;

  for (const money of nums) {
    const current = Math.max(
      previousOne,
      previousTwo + money
    );

    previousTwo = previousOne;
    previousOne = current;
  }

  return previousOne;
}
```



### Example Input

```javascript
const nums = [2, 7, 9, 3, 1];
console.log(rob(nums));
```

### Example Output

```text
12
```
## 90. Coin Change
**Pattern:** Unbounded Knapsack / DP

**Complexity:** O(amount * coins) time

```javascript
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let value = 1; value <= amount; value++) {
    for (const coin of coins) {
      if (coin <= value) {
        dp[value] = Math.min(
          dp[value],
          dp[value - coin] + 1
        );
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
```



### Example Input

```javascript
const coins = [1, 2, 5];
const amount = 11;
console.log(coinChange(coins, amount));
```

### Example Output

```text
3
```
## 91. Longest Increasing Subsequence
**Pattern:** DP + Binary Search

**Complexity:** O(n log n) time

```javascript
function lengthOfLIS(nums) {
  const tails = [];

  for (const num of nums) {
    let left = 0;
    let right = tails.length;

    while (left < right) {
      const mid = left + Math.floor((right - left) / 2);

      if (tails[mid] < num) left = mid + 1;
      else right = mid;
    }

    tails[left] = num;
  }

  return tails.length;
}
```



### Example Input

```javascript
const nums = [10, 9, 2, 5, 3, 7, 101, 18];
console.log(lengthOfLIS(nums));
```

### Example Output

```text
4
```
## 92. Longest Common Subsequence
**Pattern:** 2D DP

**Complexity:** O(n*m) time, O(n*m) space

```javascript
function longestCommonSubsequence(text1, text2) {
  const dp = Array.from(
    { length: text1.length + 1 },
    () => new Array(text2.length + 1).fill(0)
  );

  for (let i = 1; i <= text1.length; i++) {
    for (let j = 1; j <= text2.length; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(
          dp[i - 1][j],
          dp[i][j - 1]
        );
      }
    }
  }

  return dp[text1.length][text2.length];
}
```



### Example Input

```javascript
const text1 = "abcde";
const text2 = "ace";
console.log(longestCommonSubsequence(text1, text2));
```

### Example Output

```text
3
```
## 93. Word Break
**Pattern:** DP + HashSet

**Complexity:** O(n²) substring checks

```javascript
function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }

  return dp[s.length];
}
```



### Example Input

```javascript
const s = "leetcode";
const wordDict = ["leet", "code"];
console.log(wordBreak(s, wordDict));
```

### Example Output

```text
true
```
## 94. Unique Paths
**Pattern:** Grid DP

**Complexity:** O(m*n) time, O(n) space

```javascript
function uniquePaths(m, n) {
  const dp = new Array(n).fill(1);

  for (let row = 1; row < m; row++) {
    for (let col = 1; col < n; col++) {
      dp[col] += dp[col - 1];
    }
  }

  return dp[n - 1];
}
```



### Example Input

```javascript
const m = 3;
const n = 7;
console.log(uniquePaths(m, n));
```

### Example Output

```text
28
```
## 95. Edit Distance
**Pattern:** 2D DP

**Complexity:** O(n*m) time, O(n*m) space

```javascript
function minDistance(word1, word2) {
  const dp = Array.from(
    { length: word1.length + 1 },
    () => new Array(word2.length + 1).fill(0)
  );

  for (let i = 0; i <= word1.length; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= word2.length; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= word1.length; i++) {
    for (let j = 1; j <= word2.length; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],
          dp[i][j - 1],
          dp[i - 1][j - 1]
        );
      }
    }
  }

  return dp[word1.length][word2.length];
}
```



### Example Input

```javascript
const word1 = "horse";
const word2 = "ros";
console.log(minDistance(word1, word2));
```

### Example Output

```text
3
```
## 96. Jump Game
**Pattern:** Greedy

**Complexity:** O(n) time, O(1) space

```javascript
function canJump(nums) {
  let farthest = 0;

  for (let i = 0; i < nums.length; i++) {
    if (i > farthest) return false;

    farthest = Math.max(
      farthest,
      i + nums[i]
    );

    if (farthest >= nums.length - 1) return true;
  }

  return true;
}
```



### Example Input

```javascript
const nums = [2, 3, 1, 1, 4];
console.log(canJump(nums));
```

### Example Output

```text
true
```
## 97. Meeting Rooms II
**Pattern:** Sorting + Two Pointers

**Complexity:** O(n log n) time

```javascript
function minMeetingRooms(intervals) {
  const starts = intervals
    .map(interval => interval[0])
    .sort((a, b) => a - b);

  const ends = intervals
    .map(interval => interval[1])
    .sort((a, b) => a - b);

  let startIndex = 0;
  let endIndex = 0;
  let rooms = 0;
  let maxRooms = 0;

  while (startIndex < starts.length) {
    if (starts[startIndex] < ends[endIndex]) {
      rooms++;
      maxRooms = Math.max(maxRooms, rooms);
      startIndex++;
    } else {
      rooms--;
      endIndex++;
    }
  }

  return maxRooms;
}
```



### Example Input

```javascript
const intervals = [[0,30],[5,10],[15,20]];
console.log(minMeetingRooms(intervals));
```

### Example Output

```text
2
```
## 98. Generate Parentheses
**Pattern:** Backtracking

**Complexity:** O(Cn) output-dependent

```javascript
function generateParenthesis(n) {
  const result = [];

  function backtrack(current, open, close) {
    if (current.length === 2 * n) {
      result.push(current);
      return;
    }

    if (open < n) {
      backtrack(current + "(", open + 1, close);
    }

    if (close < open) {
      backtrack(current + ")", open, close + 1);
    }
  }

  backtrack("", 0, 0);

  return result;
}
```



### Example Input

```javascript
const n = 3;
console.log(generateParenthesis(n));
```

### Example Output

```text
["((()))","(()())","(())()","()(())","()()()"]
```
## 99. Subsets
**Pattern:** Backtracking

**Complexity:** O(2^n) output-dependent

```javascript
function subsets(nums) {
  const result = [];

  function backtrack(index, current) {
    result.push([...current]);

    for (let i = index; i < nums.length; i++) {
      current.push(nums[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);

  return result;
}
```



### Example Input

```javascript
const nums = [1, 2, 3];
console.log(subsets(nums));
```

### Example Output

```text
[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]
```
## 100. Implement Trie
**Pattern:** Trie / Prefix Tree

**Complexity:** O(word length) per operation

```javascript
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;

    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }

      node = node.children.get(char);
    }

    node.isEnd = true;
  }

  search(word) {
    const node = this.findNode(word);
    return node !== null && node.isEnd;
  }

  startsWith(prefix) {
    return this.findNode(prefix) !== null;
  }

  findNode(word) {
    let node = this.root;

    for (const char of word) {
      if (!node.children.has(char)) return null;
      node = node.children.get(char);
    }

    return node;
  }
}
```

---



### Example Input

```javascript
const trie = new Trie();
trie.insert("apple");
console.log(trie.search("apple"));
console.log(trie.search("app"));
console.log(trie.startsWith("app"));
trie.insert("app");
console.log(trie.search("app"));
```

### Example Output

```text
true
false
true
true
```
# Top 25 Priority Problems

If interview time is limited, start here:

```text
1.  Two Sum
2.  Product of Array Except Self
3.  Maximum Subarray
4.  3Sum
5.  Subarray Sum Equals K
6.  Longest Substring Without Repeating Characters
7.  Minimum Window Substring
8.  Container With Most Water
9.  Trapping Rain Water
10. Search in Rotated Sorted Array
11. Koko Eating Bananas
12. Daily Temperatures
13. Largest Rectangle in Histogram
14. Reverse Linked List
15. Linked List Cycle
16. Remove Nth Node From End
17. LRU Cache
18. Binary Tree Level Order Traversal
19. Validate Binary Search Tree
20. Lowest Common Ancestor
21. Top K Frequent Elements
22. Number of Islands
23. Course Schedule
24. Network Delay Time / Dijkstra
25. Coin Change
```

---

# JavaScript / Node.js Coding Problems

Keep these in a **separate JavaScript/Node.js coding section** because they test JavaScript and backend engineering rather than pure DSA.

## Promise / Async

- [ ] Implement `Promise.all()`
- [ ] Implement `Promise.race()`
- [ ] Implement `Promise.allSettled()`
- [ ] Retry with exponential backoff
- [ ] Concurrency limiter
- [ ] Task scheduler
- [ ] Promise timeout

## Data Structures / Backend

- [ ] LRU Cache
- [ ] Min Heap
- [ ] Max Heap
- [ ] Priority Queue
- [ ] Queue using two Stacks
- [ ] Stack using two Queues
- [ ] Circular Queue
- [ ] EventEmitter

## JavaScript Utilities

- [ ] `map()` polyfill
- [ ] `filter()` polyfill
- [ ] `reduce()` polyfill
- [ ] `call()` polyfill
- [ ] `apply()` polyfill
- [ ] `bind()` polyfill
- [ ] debounce
- [ ] throttle
- [ ] memoization
- [ ] deep clone
- [ ] array flatten

## Backend Coding

- [ ] Token-bucket rate limiter
- [ ] Sliding-window rate limiter
- [ ] In-memory cache with TTL
- [ ] Cache eviction
- [ ] Simple job queue
- [ ] Worker pool
- [ ] Request deduplication
- [ ] Idempotency-key handling
- [ ] Retry + exponential backoff
- [ ] Circuit breaker

---

# Complexity Cheat Sheet

| Complexity | Typical Example |
|---|---|
| O(1) | Hash lookup / array access |
| O(log n) | Binary Search |
| O(n) | Linear traversal |
| O(n log n) | Efficient sorting |
| O(n²) | Nested loops |
| O(2ⁿ) | Subsets / Backtracking |
| O(n!) | Permutations |

---

# Interview Explanation Template

For each problem, answer in this order:

```text
1. Problem understanding
2. Brute-force approach
3. Why brute force is not ideal
4. Optimal approach
5. Data structure used
6. Algorithm
7. JavaScript implementation
8. Time complexity
9. Space complexity
10. Edge cases
11. Possible optimization
```

---

# Recommended Preparation Target

```text
25 problems  → Solve without help
50 problems  → Solve with minimal hints
75 problems  → Understand the major patterns
100 problems → Understand and implement the approaches
```

For a Senior Node.js interview, combine DSA with:

```text
DSA
+
JavaScript Internals
+
Promises / Async
+
Node.js Internals
+
System Design
+
Database
+
Redis / Caching
+
API Design
+
Testing
+
AWS
```

That combination is much closer to the expectations of a senior Node.js / Full-Stack interview than DSA alone.