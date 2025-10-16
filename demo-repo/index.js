// Simple demo file for testing
function greet(name) {
  return `Hello, ${name}!`;
}

function add(a, b) {
  return a + b;
}

console.log(greet('World'));
console.log('2 + 2 =', add(2, 2));

module.exports = { greet, add };
