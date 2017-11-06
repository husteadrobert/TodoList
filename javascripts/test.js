var Point = function() {
  this.a = 'hello';
  this.b = 'friend';
};

Point.prototype.sayHello = function() {
  console.log("hello!");
};

Point.prototype = {
  sayGoodbye: function() {
    console.log("Goodbye!");
  },
};

Point.prototype.constructor = Point;

var newObject = new Point();

var anotherObject = new Point();

newObject.sayGoodbye(); //THIS ->newObject

anotherObject.sayGoodbye(); //THIS ->anotherObject


newObject.a = 'I am newObject';
anotherObject.a = 'I am anotherObject';

console.log(newObject.a); //'I am newObject'
console.log(anotherObject.a); //'I am anotherObject'

Object.getPrototypeOf(newObject); //Point.prototype

newObject.isPrototypeOf(Point.prototype);  //true

newObject.sayHello();