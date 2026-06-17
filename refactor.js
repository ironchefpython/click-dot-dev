const refactorGrammar = {
  origin: [
    " <<<<<<< #path#:L#line#\n - #oldCode1#\n - #oldCode2#\n - #oldCode3#\n ======= #path#:L#line#\n + #newCode1#\n + #newCode2#\n >>>>>>>\n [REFACTOR] #refactorMsg#",
    " <<<<<<< #path#:L#line#\n - #oldCode#\n ======= #path#:L#line#\n + #newCode#\n >>>>>>>\n [REFACTOR] #refactorMsg#"
  ],
  path: ["/src/cart.js", "/src/auth.js", "/src/api/routes.js", "/lib/database.js", "/src/utils/format.js"],
  line: ["10", "42", "115", "8", "33", "77", "90"],

  oldCode1: [
    "function getCartTotal(items) {",
    "for(let i=0; i<items.length; i++) {",
    "if (user === null || user === undefined) {"
  ],
  oldCode2: [
    "  let sum = 0;",
    "  sum += items[i].price * items[i].qty;",
    "  return false;"
  ],
  oldCode3: [
    "  return sum;",
    "}",
    "}"
  ],

  newCode1: [
    "const getCartTotal = items =>",
    "const isValidUser = user => !!user;"
  ],
  newCode2: [
    "  items.reduce((sum, item) => sum + item.price * item.qty, 0);",
    ""
  ],

  oldCode: [
    "const result = await db.query('SELECT * FROM users'); return result;",
    "var _this = this;",
    "if (err) { console.log(err); throw err; }"
  ],
  newCode: [
    "return db.query('SELECT * FROM users');",
    "// Removed var _this in favor of arrow function",
    "if (err) throw new Error(`Database error: ${err.message}`);"
  ],

  refactorMsg: [
    "Extracted checkout validation to middleware.",
    "Replaced connection pool callbacks with promises.",
    "Converted classic functions to arrow functions.",
    "Removed redundant null checks.",
    "Simplified array iteration using .reduce()",
    "Modularized authentication logic."
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = refactorGrammar;
} else {
  window.refactorGrammar = refactorGrammar;
}
