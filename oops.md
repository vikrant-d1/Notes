<img width="1484" height="948" alt="image" src="https://github.com/user-attachments/assets/61b1d78d-cde8-4934-97b6-72a0e785e278" />
OOP itself is a way of structuring code around objects — bundles of data (state) and the functions that act on that data (behavior). Instead of loose variables and functions scattered around, you group related things into one self-contained unit.


**Encapsulation:** is the process of bundling data and methods together while restricting direct access to the internal state of an object. Instead of modifying data directly, users interact with the object through public methods, which helps protect data integrity and maintainability.

```javascript
class BankAccount {
  #balance = 0; // # makes it truly private

  deposit(amount) {
    if (amount > 0) this.#balance += amount;
  }
  getBalance() { return this.#balance; }
}
```

**Abstraction:**  is the process of hiding implementation details and exposing only the necessary functionality. It allows users to interact with an object through a simple interface without needing to understand the internal working of the system.
```javascript
class Car {
  start() {
    this.#injectFuel();
    this.#ignite();   // caller never sees these
  }
  #injectFuel() { /* ... */ }
  #ignite() { /* ... */ }
}
new Car().start(); // that's the whole interface
```

**Inheritance:** is an OOP concept where a child class inherits properties and methods from a parent class. It enables code reuse, reduces duplication, and helps create hierarchical relationships between classes.
```javascript
class Animal {
  constructor(name) { this.name = name; }
  eat() { return `${this.name} eats`; }
}
class Dog extends Animal {
  bark() { return `${this.name} barks`; }
}
const d = new Dog("Rex");
d.eat();  // inherited
d.bark(); // its own
```

**Polymorphism:**  is an OOP concept that allows the same method or interface to have different implementations in different classes. It enables objects of different types to be treated through a common interface while exhibiting different behaviors.
```javascript
class Shape { area() { return 0; } }
class Circle extends Shape {
  constructor(r) { super(); this.r = r; }
  area() { return Math.PI * this.r ** 2; } // overrides
}
class Square extends Shape {
  constructor(s) { super(); this.s = s; }
  area() { return this.s ** 2; }
}

[new Circle(3), new Square(4)].forEach(s => console.log(s.area()));
// each responds to area() in its own way
```
