const testGrammar = {
  origin: [
    "PASS  tests/#testFile#.test.js\n ✓ #should# (#time#ms)\n ✓ #should# (#time#ms)\n ✓ #should# (#time#ms)\n Running path coverage analysis...\n [WARN] Route '#route#' has #pct#% branch coverage\n   - Missing coverage for #missing#\n Running Unit Tests: #numTests# tests passed, 0 failed.",
    "PASS  tests/#testFile#.test.js\n ✓ #should# (#time#ms)\n ✓ #should# (#time#ms)\n PASS  tests/#testFile2#.test.js\n ✓ #should# (#time#ms)\n ✓ #should# (#time#ms)",
    "Test Suites: 1 passed, 1 total\nTests:       #numTests# passed, #numTests# total\nSnapshots:   0 total\nTime:        #time#.#time#s\nRan all test suites."
  ],
  testFile: ["bakery", "auth", "checkout", "cart", "payment", "inventory", "user"],
  testFile2: ["db", "cache", "api", "utils", "config"],
  should: [
    "should return inventory list",
    "should reject invalid checkout items",
    "should connect to stripe gateway",
    "should hash passwords on signup",
    "should block SQL injection on login",
    "should calculate taxes correctly",
    "should throw error on missing email",
    "should timeout if database is unreachable"
  ],
  time: ["12", "34", "8", "48", "115", "2", "6", "89", "142"],
  route: ["/api/checkout", "/api/users", "/login", "/cart/add", "/api/products"],
  pct: ["85", "92", "78", "99", "88"],
  missing: [
    "stripe API connection failure",
    "null parameter edge case",
    "unauthorized user role",
    "database timeout exception"
  ],
  numTests: ["18", "24", "42", "15", "8", "31"]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = testGrammar;
} else {
  window.testGrammar = testGrammar;
}
